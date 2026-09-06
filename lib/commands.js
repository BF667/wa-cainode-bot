// lib/commands.js
// Handler untuk setiap command. Menerima (msg, senderJid, ctx) dan mengembalikan string balasan.

const { buildMenuText } = require("./menu");

/**
 * ctx berisi:
 *   - cainode   : instance CainodeManager
 *   - senderJid : jid pengirim (string)
 *   - reply     : function async (text) untuk kirim balasan ke chat yang sama
 */

module.exports = {
  /**
   * Router utama. Menerima teks pesan (sudah di-trim) dan mengembalikan balasan atau null.
   */
  async handle(text, senderJid, ctx) {
    if (!text || !text.startsWith(".")) return null;

    const [rawCmd, ...rest] = text.split(" ");
    const cmd = rawCmd.toLowerCase().replace(/^\./, "");
    const argStr = rest.join(" ").trim();

    switch (cmd) {
      case "menu":
      case "help":
        return buildMenuText();

      case "ping": {
        try {
          const r = await ctx.cainode.client.ping();
          return `*Server Character.AI:* ${JSON.stringify(r)}`;
        } catch (e) {
          return `Ping gagal: ${e.message}`;
        }
      }

      case "ai": {
        if (!argStr) {
          return "Kirim pesan ke AI setelah command.\nContoh: .ai hai, apa kabar?";
        }
        if (!ctx.cainode.loggedIn) {
          return "Bot belum login ke Character.AI. Setel token dulu via file .env (CHARACTER_AI_TOKEN).";
        }
        try {
          await ctx.reply("_Sedang berpikir..._");
          const reply = await ctx.cainode.chat(senderJid, argStr);
          if (!reply) {
            return "Karakter tidak memberikan balasan. Coba lagi ya.";
          }
          return reply;
        } catch (e) {
          return `Gagal chat AI: ${e.message}`;
        }
      }

      case "setchar": {
        if (!argStr) {
          return "Cara pakai: .setchar <character_id>\nContoh: .setchar YnBfM2RhNjV... ";
        }
        try {
          const session = await ctx.cainode.setCharacter(senderJid, argStr);
          return `Karakter aktif diubah ke: *${session.character_name || argStr}*\nID: ${argStr}\n\nSekarang kamu bisa chat pakai .ai <pesan>`;
        } catch (e) {
          return `Gagal set karakter: ${e.message}`;
        }
      }

      case "charinfo": {
        try {
          const session = ctx.cainode.getSession(senderJid);
          const charId = argStr || session.char_id;
          if (!charId) {
            return "Belum ada karakter aktif. Pakai .setchar <id> dulu atau .charinfo <id>";
          }
          const info = await ctx.cainode.client.character.info(charId);
          const c = info?.character || info;
          const lines = [];
          lines.push("*INFO KARAKTER*");
          lines.push("────────────");
          lines.push(`Nama: ${c.name || c.title || "-"}`);
          lines.push(`ID: ${charId}`);
          lines.push(`Greeting: ${(c.greeting || "-").slice(0, 200)}`);
          lines.push(`Description: ${(c.description || "-").slice(0, 300)}`);
          if (c.participant__num_interactions) {
            lines.push(`Interaksi: ${c.participant__num_interactions}`);
          }
          if (c.search_score) lines.push(`Search score: ${c.search_score}`);
          return lines.join("\n");
        } catch (e) {
          return `Gagal ambil info karakter: ${e.message}`;
        }
      }

      case "newchat": {
        try {
          const session = ctx.cainode.getSession(senderJid);
          if (!session.char_id) {
            return "Belum ada karakter aktif. Pakai .setchar <id> dulu.";
          }
          const result = await ctx.cainode.newConversation(senderJid, true);
          const greeting =
            result?.turn?.candidates?.[0]?.raw_content ||
            result?.greeting ||
            "(tanpa greeting)";
          return `*Conversation baru dibuat!*\n\nKarakter menyapa:\n${greeting}`;
        } catch (e) {
          return `Gagal buat conversation baru: ${e.message}`;
        }
      }

      case "search": {
        if (!argStr) return "Cara pakai: .search <kata kunci>";
        try {
          const result = await ctx.cainode.client.search.characters(argStr);
          const chars = result?.characters || result || [];
          if (!Array.isArray(chars) || chars.length === 0) {
            return `Tidak ada karakter ditemukan untuk "${argStr}".`;
          }
          const lines = [`*Hasil pencarian "${argStr}":*`, "────────────"];
          for (const c of chars.slice(0, 8)) {
            lines.push(
              `• ${c.name || c.title || "?"} — \`${c.external_id || c.character_id || c.id}\``
            );
            if (c.description) {
              lines.push(`   _${c.description.slice(0, 100)}_`);
            }
          }
          lines.push("\nGunakan .setchar <id> untuk memilih karakter.");
          return lines.join("\n");
        } catch (e) {
          return `Gagal cari karakter: ${e.message}`;
        }
      }

      case "trending": {
        try {
          const result = await ctx.cainode.client.search.trending();
          const chars = result?.trending_characters || result?.characters || [];
          if (!Array.isArray(chars) || chars.length === 0) {
            return "Tidak ada karakter trending saat ini.";
          }
          const lines = ["*🔥 KARAKTER TRENDING:*", "────────────"];
          for (const c of chars.slice(0, 10)) {
            lines.push(
              `• ${c.name || c.title || "?"} — \`${c.external_id || c.character_id || c.id}\``
            );
          }
          lines.push("\nGunakan .setchar <id> untuk memilih.");
          return lines.join("\n");
        } catch (e) {
          return `Gagal ambil trending: ${e.message}`;
        }
      }

      case "featured": {
        try {
          const result = await ctx.cainode.client.explore.featured();
          const chars = result?.featured_characters || result?.characters || [];
          if (!Array.isArray(chars) || chars.length === 0) {
            return "Tidak ada karakter featured saat ini.";
          }
          const lines = ["*⭐ KARAKTER FEATURED:*", "────────────"];
          for (const c of chars.slice(0, 10)) {
            lines.push(
              `• ${c.name || c.title || "?"} — \`${c.external_id || c.character_id || c.id}\``
            );
          }
          lines.push("\nGunakan .setchar <id> untuk memilih.");
          return lines.join("\n");
        } catch (e) {
          return `Gagal ambil featured: ${e.message}`;
        }
      }

      case "foryou": {
        try {
          const result = await ctx.cainode.client.explore.for_you();
          const chars = result?.recommended_characters || result?.characters || [];
          if (!Array.isArray(chars) || chars.length === 0) {
            return "Tidak ada rekomendasi karakter saat ini.";
          }
          const lines = ["*💎 KARAKTER UNTUKMU (For You):*", "────────────"];
          for (const c of chars.slice(0, 10)) {
            lines.push(
              `• ${c.name || c.title || "?"} — \`${c.external_id || c.character_id || c.id}\``
            );
          }
          lines.push("\nGunakan .setchar <id> untuk memilih.");
          return lines.join("\n");
        } catch (e) {
          return `Gagal ambil rekomendasi: ${e.message}`;
        }
      }

      case "userinfo": {
        try {
          // NOTE: user.info adalah GETTER (bukan method), jadi TANPA tanda kurung
          const info = await ctx.cainode.client.user.info;
          const u = info?.user || info;
          const lines = ["*INFO AKUN CHARACTER.AI:*", "────────────"];
          lines.push(`Username: ${u.username || "-"}`);
          lines.push(`Name: ${u.name || "-"}`);
          lines.push(`Email: ${u.email || "-"}`);
          if (u.avatar) lines.push(`Avatar: ${u.avatar}`);
          if (u.bio) lines.push(`Bio: ${u.bio}`);
          if (u.count_followers) lines.push(`Followers: ${u.count_followers}`);
          if (u.count_following) lines.push(`Following: ${u.count_following}`);
          return lines.join("\n");
        } catch (e) {
          return `Gagal ambil user info: ${e.message}`;
        }
      }

      case "history": {
        try {
          const session = ctx.cainode.getSession(senderJid);
          if (!session.char_id) {
            return "Belum ada karakter aktif.";
          }
          const result = await ctx.cainode.client.chat.history_conversation_list(
            session.char_id
          );
          const chats = result?.chats || result || [];
          if (!Array.isArray(chats) || chats.length === 0) {
            return "Belum ada history conversation untuk karakter ini.";
          }
          const lines = ["*HISTORY CONVERSATION:*", "────────────"];
          for (const c of chats.slice(0, 10)) {
            lines.push(
              `• ${c.name || "(untitled)"} — \`${c.chat_id || c.id}\``
            );
          }
          return lines.join("\n");
        } catch (e) {
          return `Gagal ambil history: ${e.message}`;
        }
      }

      case "genimg": {
        if (!argStr) return "Cara pakai: .genimg <prompt>";
        try {
          await ctx.reply("_Lagi generate gambar..._");
          const result = await ctx.cainode.client.image.generate_image(argStr);
          // Cari URL gambar di response
          const url =
            result?.image?.url ||
            result?.url ||
            result?.images?.[0]?.url ||
            (typeof result === "string" ? result : null);
          if (!url) {
            return `Generate gambar selesai, tapi tidak menemukan URL. Response: ${JSON.stringify(result).slice(0, 300)}`;
          }
          // Karena WhatsApp butuh download dulu untuk kirim image, kita balas URL-nya saja.
          return `Gambar berhasil dibuat:\n${url}`;
        } catch (e) {
          return `Gagal generate image: ${e.message}`;
        }
      }

      case "genavatar": {
        if (!argStr) return "Cara pakai: .genavatar <prompt>";
        try {
          await ctx.reply("_Lagi generate avatar..._");
          const result = await ctx.cainode.client.image.generate_avatar(argStr);
          const url =
            result?.image?.url ||
            result?.url ||
            (typeof result === "string" ? result : null);
          if (!url) {
            return `Generate avatar selesai, tapi tidak menemukan URL. Response: ${JSON.stringify(result).slice(0, 300)}`;
          }
          return `Avatar berhasil dibuat:\n${url}`;
        } catch (e) {
          return `Gagal generate avatar: ${e.message}`;
        }
      }

      case "session": {
        const s = ctx.cainode.getSession(senderJid);
        const lines = ["*SESSION CHAT INI:*", "────────────"];
        lines.push(`JID: ${senderJid}`);
        lines.push(`Char ID: ${s.char_id || "(belum diset)"}`);
        lines.push(`Char Name: ${s.character_name || "-"}`);
        lines.push(`Chat ID: ${s.chat_id || "(belum ada conversation)"}`);
        lines.push(`Login: ${ctx.cainode.loggedIn ? "✓" : "✗"}`);
        return lines.join("\n");
      }

      case "reset": {
        ctx.cainode.sessions.delete(senderJid);
        return "Session chat ini sudah direset. Pakai .setchar <id> untuk memilih karakter baru.";
      }

      case "owner": {
        const cfg = ctx.config || {};
        const lines = ["*INFO BOT:*", "────────────"];
        lines.push(
          `Owner: ${cfg.owner_jid ? "+" + cfg.owner_jid.replace(/\D/g, "") : "(tidak diset)"}`
        );
        lines.push(
          `Nomor Bot: ${
            cfg.bot_phone_number
              ? "+" + cfg.bot_phone_number.replace(/\D/g, "")
              : "(tidak diset)"
          }`
        );
        lines.push(
          `Koneksi: ${cfg.connection_method || "qr"}`
        );
        return lines.join("\n");
      }

      default:
        return null; // bukan command dikenal
    }
  },
};
