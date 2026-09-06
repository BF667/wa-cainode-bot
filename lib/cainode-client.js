// lib/cainode-client.js
// Wrapper untuk CAINode - mengelola login, koneksi karakter, dan menyimpan session per-grup/pengguna.

const fs = require("fs");
const path = require("path");

/**
 * Mengelola satu instance CAINode yang sudah login dengan satu token.
 * Setiap chat WhatsApp akan memiliki session masing-masing (char_id + chat_id),
 * sehingga beberapa user/grup bisa chat dengan character berbeda secara paralel.
 */
class CainodeManager {
  constructor() {
    this.client = null;
    this.loggedIn = false;
    // Map <waJid, { char_id, chat_id, character_name }>: session per chat WhatsApp
    this.sessions = new Map();
    this.defaultCharacterId = null;
  }

  /**
   * Inisialisasi CAINode dan login pakai token Character.AI.
   * @param {string} token Character.AI session token
   */
  async login(token) {
    if (this.client) {
      try {
        await this.client.logout();
      } catch (_) {
        /* ignore */
      }
    }
    const { CAINode } = await import("cainode");
    this.client = new CAINode();
    await this.client.login(token);
    this.loggedIn = true;
    return this.client;
  }

  async logout() {
    if (this.client && this.loggedIn) {
      try {
        await this.client.logout();
      } catch (_) {
        /* ignore */
      }
    }
    this.loggedIn = false;
    this.sessions.clear();
  }

  /**
   * Ambil atau buat session untuk chat WA tertentu.
   */
  getSession(waJid) {
    if (!this.sessions.has(waJid)) {
      this.sessions.set(waJid, {
        char_id: this.defaultCharacterId,
        chat_id: null,
        character_name: null,
      });
    }
    return this.sessions.get(waJid);
  }

  /**
   * Set karakter aktif untuk chat WA tertentu dan connect ke karakter tsb.
   */
  async setCharacter(waJid, characterId) {
    if (!this.client || !this.loggedIn) {
      throw new Error("CAINode belum login. Pastikan token valid.");
    }
    const session = this.getSession(waJid);

    // Disconnect dulu dari character lama (kalau ada)
    try {
      await this.client.character.disconnect();
    } catch (_) {
      /* belum connect, abaikan */
    }

    // Ambil info character dulu supaya nama bisa ditampilkan
    let characterName = null;
    try {
      const info = await this.client.character.info(characterId);
      if (info && info.character) {
        characterName = info.character.name || info.character.title || null;
      }
    } catch (_) {
      /* abaikan kalau info gagal */
    }

    // Connect ke character baru
    await this.client.character.connect(characterId);

    // Simpan ke session WA
    session.char_id = characterId;
    session.character_name = characterName;
    // Reset chat_id (akan diisi otomatis saat pertama kali send_message)
    session.chat_id = null;

    this.sessions.set(waJid, session);
    return session;
  }

  /**
   * Kirim pesan ke character AI dan ambil balasannya.
   */
  async chat(waJid, message) {
    if (!this.client || !this.loggedIn) {
      throw new Error("CAINode belum login. Pastikan token valid.");
    }
    const session = this.getSession(waJid);
    if (!session.char_id) {
      throw new Error(
        "Belum ada karakter aktif. Gunakan .setchar <character_id> dulu."
      );
    }

    // Connect otomatis kalau belum ter-connect
    // (CAINode hanya menjaga 1 koneksi aktif, jadi kita connect tiap kali mau chat
    //  untuk memastikan state-nya benar untuk chat WA ini.)
    try {
      await this.client.character.connect(session.char_id);
    } catch (_) {
      /* mungkin sudah connect, abaikan */
    }

    // Kirim pesan. Pakai manual_opt agar tidak bentrok dengan session chat WA lain.
    const opts = session.chat_id
      ? { char_id: session.char_id, chat_id: session.chat_id }
      : { char_id: session.char_id };

    const sendResult = await this.client.character.send_message(
      message,
      false, // manual_turn = false (auto-generate reply)
      "", // image_url kosong
      opts
    );

    // Simpan chat_id kalau baru
    if (sendResult && sendResult.turn && sendResult.turn.chat_id) {
      session.chat_id = sendResult.turn.chat_id;
      this.sessions.set(waJid, session);
    }

    // Ambil balasan character
    const reply = sendResult?.turn?.candidates?.[0]?.raw_content || null;
    return reply;
  }

  /**
   * Mulai conversation baru untuk chat WA tertentu.
   */
  async newConversation(waJid, withGreeting = true) {
    if (!this.client || !this.loggedIn) {
      throw new Error("CAINode belum login.");
    }
    const session = this.getSession(waJid);
    if (!session.char_id) {
      throw new Error("Belum ada karakter aktif.");
    }

    try {
      await this.client.character.connect(session.char_id);
    } catch (_) {
      /* abaikan */
    }

    const result = await this.client.character.create_new_conversation(
      withGreeting,
      { char_id: session.char_id }
    );

    // Reset chat_id di session
    session.chat_id = null;
    this.sessions.set(waJid, session);

    return result;
  }

  /**
   * Persist sessions ke file (opsional, supaya gak reset tiap restart).
   */
  saveSessions(filePath) {
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        defaultCharacterId: this.defaultCharacterId,
      };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Gagal simpan sessions:", e.message);
    }
  }

  loadSessions(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (data.sessions) {
          this.sessions = new Map(data.sessions);
        }
        if (data.defaultCharacterId) {
          this.defaultCharacterId = data.defaultCharacterId;
        }
      }
    } catch (e) {
      console.error("Gagal load sessions:", e.message);
    }
  }
}

module.exports = { CainodeManager };
