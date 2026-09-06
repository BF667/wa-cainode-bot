// config.example.js
// ─────────────────────────────────────────────────────────────
// SALIN file ini jadi "config.js" lalu isi nilainya.
// File config.js ASLI di-gitignore (tidak ikut ke GitHub).
//
// "NO ENV" — semua konfigurasi ada di sini, bukan di .env.
// ─────────────────────────────────────────────────────────────

module.exports = {
  // ─── Character.AI ──────────────────────────────────────────
  // Token untuk login ke Character.AI (WAJIB supaya .ai jalan).
  // Cara dapet:
  //   1. Buka https://character.ai di browser, login
  //   2. DevTools (F12) > Application > Cookies > https://character.ai
  //   3. Cari cookie "HTTP_AUTHORIZATION", copy valuenya
  // Atau jalankan di console browser:
  //   document.cookie.split(';').find(c=>c.trim().startsWith('HTTP_AUTHORIZATION')).split('=')[1]
  character_ai_token: "",

  // (Opsional) Karakter default yang otomatis aktif untuk chat baru.
  // Kosongkan = user harus .setchar manual dulu sebelum .ai.
  default_character_id: "",

  // ─── WhatsApp Bot ──────────────────────────────────────────
  // Nomor bot dalam format internasional TANPA "+" atau spasi.
  // Contoh: 62 812 3456 7890 → "6281234567890"
  // Dipakai untuk pairing code (link device pakai kode, bukan QR).
  bot_phone_number: "",

  // Pemilik bot. Nomor WA owner dalam format internasional tanpa "+".
  // Contoh: "6281234567890"
  // Owner akan dapat notifikasi saat bot startup & bisa akses command khusus (opsional).
  owner_jid: "",

  // Metode koneksi WhatsApp:
  //   "qr"           → Scan QR code di terminal
  //   "pairing_code" → Pakai kode pairing (butuh bot_phone_number di atas).
  //                   Buka WhatsApp > Settings > Linked Devices > Link with phone number
  connection_method: "pairing_code",

  // ─── Opsional ──────────────────────────────────────────────
  // Prefix command. Default "." (titik).
  prefix: ".",

  // Whitelist nomor WA yang boleh pakai bot.
  // Kosongkan = semua orang yang mengirim pesan ke nomor bot bisa pakai.
  // Format: ["62812xxx@s.whatsapp.net", "62899xxx@s.whatsapp.net"]
  allowed_jids: [],
};
