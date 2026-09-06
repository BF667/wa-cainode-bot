// index.js
// WhatsApp Bot Character.AI — CAINode + Baileys
//
// Konfigurasi ada di ./config.js (bukan .env). Lihat config.example.js.
//
// Metode koneksi:
//   - "qr"            → scan QR code di terminal
//   - "pairing_code"  → pakai kode pairing (lebih gampang, tinggal masukin kode di WA)
//
// AI HANYA merespon ketika pesan diawali dengan prefix (default ".").
// Kirim ".menu" ke nomor bot untuk melihat semua command.

const fs = require("fs");
const path = require("path");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const P = require("pino");

const { CainodeManager } = require("./lib/cainode-client");
const { FavoritesManager } = require("./lib/favorites");
const stats = require("./lib/stats");
const commands = require("./lib/commands");

// ─── Load config (NO .env!) ─────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, "config.js");
const CONFIG_EXAMPLE_PATH = path.join(__dirname, "config.example.js");

let config;
if (fs.existsSync(CONFIG_PATH)) {
  config = require("./config");
} else {
  console.warn(
    "⚠️  config.js tidak ditemukan. Memakai config.example.js sebagai fallback."
  );
  console.warn("    Salin config.example.js → config.js lalu isi nilainya.\n");
  config = require("./config.example");
}

const CHARACTER_AI_TOKEN = config.character_ai_token || "";
const DEFAULT_CHARACTER_ID = config.default_character_id || "";
const BOT_PHONE_NUMBER = (config.bot_phone_number || "").replace(/\D/g, "");
const OWNER_JID = config.owner_jid || "";
const CONNECTION_METHOD = config.connection_method || "qr";
const BOT_PREFIX = config.prefix || ".";
const ALLOWED_JIDS = (config.allowed_jids || [])
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const SESSION_DIR = path.join(__dirname, "auth");
const SESSIONS_STATE = path.join(__dirname, "sessions.json");
const FAVORITES_FILE = path.join(__dirname, "favorites.json");

// ─── Init CAINode ──────────────────────────────────────────────
const cainode = new CainodeManager();
cainode.defaultCharacterId = DEFAULT_CHARACTER_ID || null;
cainode.loadSessions(SESSIONS_STATE);

// ─── Init Favorites ────────────────────────────────────────────
const favorites = new FavoritesManager(FAVORITES_FILE);

// ─── Helper kirim pesan ────────────────────────────────────────
async function sendText(sock, jid, text) {
  await sock.sendMessage(jid, { text });
}

// ─── Handler pesan masuk ───────────────────────────────────────
async function onMessageUpsert(sock, msg) {
  const m = msg.messages[0];
  if (!m || !m.message || m.key.fromMe) return;

  const jid = m.key.remoteJid;
  let text = "";
  if (m.message.conversation) text = m.message.conversation;
  else if (m.message.extendedTextMessage?.text)
    text = m.message.extendedTextMessage.text;
  else return;

  text = text.trim();
  if (!text.startsWith(BOT_PREFIX)) return; // hanya proses pesan yang diawali prefix

  // Track stats: semua pesan masuk
  stats.recordMessage();

  // Whitelist (kalau di-set)
  if (ALLOWED_JIDS.length > 0) {
    const lower = jid.toLowerCase();
    if (!ALLOWED_JIDS.some((a) => lower.includes(a))) return;
  }

  console.log(`[${jid}] ${text}`);

  const ctx = {
    cainode,
    favorites,
    stats,
    senderJid: jid,
    reply: async (t) => sendText(sock, jid, t),
    config,
  };

  try {
    const response = await commands.handle(text, jid, ctx);
    if (response) {
      await sendText(sock, jid, response);
    }
    cainode.saveSessions(SESSIONS_STATE);
  } catch (e) {
    console.error("Error handle command:", e);
    await sendText(sock, jid, `Error: ${e.message}`);
  }
}

// ─── Format nomor WA → JID ─────────────────────────────────────
function phoneToJid(phone) {
  if (!phone) return null;
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = p.replace(/^0/, "");
  return `${p}@s.whatsapp.net`;
}

// ─── Request pairing code (jika metode pairing_code) ───────────
let pairingCodeRequested = false;
async function requestPairingCode(sock) {
  if (pairingCodeRequested) return;
  if (CONNECTION_METHOD !== "pairing_code") return;
  if (!BOT_PHONE_NUMBER) {
    console.warn(
      "⚠️  connection_method = 'pairing_code' tapi bot_phone_number kosong."
    );
    console.warn("    Isi bot_phone_number di config.js dulu.");
    return;
  }
  pairingCodeRequested = true;

  try {
    // Delay sedikit supaya socket siap
    await new Promise((r) => setTimeout(r, 1500));
    const code = await sock.requestPairingCode(BOT_PHONE_NUMBER);
    console.log("\n────────────────────────────────────────────");
    console.log("🔗 PAIRING CODE:");
    console.log(`      ${code}`);
    console.log("────────────────────────────────────────────");
    console.log("Buka WhatsApp > Settings > Linked Devices >");
    console.log('Link with phone number > masukkan kode di atas.');
    console.log("────────────────────────────────────────────\n");
  } catch (e) {
    console.error("Gagal request pairing code:", e.message);
  }
}

// ─── Start WhatsApp (Baileys) ──────────────────────────────────
async function startBot() {
  // Login CAINode dulu
  if (CHARACTER_AI_TOKEN) {
    console.log("Login ke Character.AI...");
    try {
      await cainode.login(CHARACTER_AI_TOKEN);
      console.log("✓ Berhasil login Character.AI");
      if (cainode.defaultCharacterId) {
        console.log(`Default character ID: ${cainode.defaultCharacterId}`);
      }
    } catch (e) {
      console.error("✗ Gagal login Character.AI:", e.message);
      console.error(
        "Bot tetap jalan, tapi command .ai akan gagal sampai token diperbaiki."
      );
    }
  } else {
    console.warn(
      "⚠️  character_ai_token kosong. Set di config.js supaya command .ai bisa jalan."
    );
  }

  // Baileys auth state
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: CONNECTION_METHOD === "qr",
    logger: P({ level: "silent" }),
    browser: ["CAINode-WA-Bot", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && CONNECTION_METHOD === "qr") {
      console.log("\n Scan QR ini dengan WhatsApp-mu:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("\n✓ WhatsApp terhubung!");
      console.log("Kirim .menu ke nomor bot untuk melihat semua command.\n");

      // Notifikasi owner
      if (OWNER_JID) {
        const ownerJid = phoneToJid(OWNER_JID) || OWNER_JID;
        sendText(
          sock,
          ownerJid,
          "✅ Bot aktif! Ketik .menu untuk lihat semua command."
        ).catch(() => {});
      }
    }

    if (connection === "close") {
      const code =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.statusCode;
      console.log("Connection closed. Code:", code);
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("Reconnecting...");
        startBot();
      } else {
        console.log(
          "Logged out. Hapus folder ./auth lalu jalankan ulang untuk login baru."
        );
      }
    }
  });

  // Trigger pairing code saat credentials update (pertama kali)
  if (CONNECTION_METHOD === "pairing_code") {
    sock.ev.on("creds.update", async () => {
      // Hanya request kalau belum ter-autentikasi
      const registered = state.creds?.registered;
      if (!registered && !pairingCodeRequested) {
        await requestPairingCode(sock);
      }
    });
    // Fallback: coba langsung juga
    setTimeout(() => requestPairingCode(sock), 2500);
  }

  sock.ev.on("messages.upsert", (msg) => {
    onMessageUpsert(sock, msg).catch((e) =>
      console.error("onMessageUpsert error:", e)
    );
  });
}

// ─── Jalankan ──────────────────────────────────────────────────
startBot().catch((e) => {
  console.error("Fatal error saat start bot:", e);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  try {
    await cainode.logout();
  } catch (_) {
    /* ignore */
  }
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  console.warn("[unhandledRejection]", reason?.message || reason);
});
