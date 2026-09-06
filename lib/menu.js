// lib/menu.js
// Daftar command bot. Dipakai oleh .menu dan dipakai handler untuk routing command.

const COMMANDS = [
  {
    cmd: ".ai <pesan>",
    desc: "Chat dengan karakter AI. Contoh: .ai hai, apa kabar?",
  },
  {
    cmd: ".menu",
    desc: "Tampilkan semua command yang tersedia (pesan ini).",
  },
  {
    cmd: ".help",
    desc: "Alias dari .menu.",
  },
  {
    cmd: ".ping",
    desc: "Cek status server Character.AI (health check).",
  },
  {
    cmd: ".setchar <character_id>",
    desc: "Set / ganti karakter aktif untuk chat ini. Contoh: .setchar abc123XYZ",
  },
  {
    cmd: ".charinfo [character_id]",
    desc: "Lihat info karakter. Kalau kosong, lihat karakter yang sedang aktif.",
  },
  {
    cmd: ".newchat",
    desc: "Mulai conversation baru dengan karakter aktif (riwayat lama tetap tersimpan di history).",
  },
  {
    cmd: ".search <kata kunci>",
    desc: "Cari karakter di Character.AI. Contoh: .search iron man",
  },
  {
    cmd: ".trending",
    desc: "Tampilkan karakter yang sedang trending.",
  },
  {
    cmd: ".featured",
    desc: "Tampilkan karakter unggulan (featured).",
  },
  {
    cmd: ".foryou",
    desc: "Tampilkan rekomendasi karakter untukmu (for you).",
  },
  {
    cmd: ".userinfo",
    desc: "Lihat info akun Character.AI yang sedang dipakai bot.",
  },
  {
    cmd: ".history",
    desc: "Lihat daftar percakapan tersimpan (history conversation list) untuk karakter aktif.",
  },
  {
    cmd: ".genimg <prompt>",
    desc: "Generate gambar dari teks prompt. Contoh: .genimg kucing astronaut",
  },
  {
    cmd: ".genavatar <prompt>",
    desc: "Generate avatar dari teks prompt.",
  },
  {
    cmd: ".session",
    desc: "Lihat status session chat WA ini (karakter aktif, chat_id, dll).",
  },
  {
    cmd: ".reset",
    desc: "Reset session chat WA ini (karakter & history di chat ini dihapus).",
  },
  {
    cmd: ".owner",
    desc: "Lihat info pemilik bot & nomor bot.",
  },
];

function buildMenuText() {
  let out = "*WHATSAPP BOT — Character.AI (CAINode + Baileys)*\n";
  out += "────────────────────\n";
  out += `Total: *${COMMANDS.length} command*\n\n`;
  out += "Ketik command diawali titik (.) lalu kirim pesan.\n";
  out += "AI hanya akan merespon ketika kamu memakai *.ai*.\n\n";
  out += "*DAFTAR COMMAND:*\n";
  out += "────────────────────\n";
  for (const c of COMMANDS) {
    out += `${c.cmd}\n`;
    out += `  _${c.desc}_\n\n`;
  }
  out += "────────────────────\n";
  out += "Made with CAINode + Baileys";
  return out;
}

module.exports = { COMMANDS, buildMenuText };
