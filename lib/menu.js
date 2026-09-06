// lib/menu.js
// Daftar command bot. Dipakai oleh .menu dan dipakai handler untuk routing command.

const COMMANDS = [
  {
    category: "Chat AI",
    items: [
      {
        cmd: ".ai <pesan>",
        desc: "Chat dengan karakter AI. Contoh: .ai hai, apa kabar?",
      },
      {
        cmd: ".regen",
        desc: "Regenerate balasan AI terakhir (kasih jawaban alternatif).",
      },
      {
        cmd: ".newchat",
        desc: "Mulai conversation baru dengan karakter aktif (riwayat lama tetap di history).",
      },
    ],
  },
  {
    category: "Karakter",
    items: [
      {
        cmd: ".setchar <character_id>",
        desc: "Set / ganti karakter aktif untuk chat ini.",
      },
      {
        cmd: ".charinfo [character_id]",
        desc: "Lihat info karakter. Kalau kosong, lihat karakter yang sedang aktif.",
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
        cmd: ".tags",
        desc: "Lihat daftar tag/kategori karakter yang tersedia.",
      },
    ],
  },
  {
    category: "Favorit",
    items: [
      {
        cmd: ".fav add <char_id> [nama]",
        desc: "Tambah karakter ke favorit (otomatis pakai karakter aktif kalau char_id kosong).",
      },
      {
        cmd: ".fav list",
        desc: "Lihat daftar favorit kamu.",
      },
      {
        cmd: ".fav use <no>",
        desc: "Pakai karakter favorit nomor X (sesuai list).",
      },
      {
        cmd: ".fav del <no|char_id>",
        desc: "Hapus karakter dari favorit.",
      },
    ],
  },
  {
    category: "Media",
    items: [
      {
        cmd: ".genimg <prompt>",
        desc: "Generate gambar dari teks prompt. Contoh: .genimg kucing astronaut",
      },
      {
        cmd: ".genavatar <prompt>",
        desc: "Generate avatar dari teks prompt.",
      },
    ],
  },
  {
    category: "Info & Status",
    items: [
      {
        cmd: ".menu",
        desc: "Tampilkan semua command (pesan ini).",
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
        cmd: ".userinfo",
        desc: "Lihat info akun Character.AI yang sedang dipakai bot.",
      },
      {
        cmd: ".history",
        desc: "Lihat daftar percakapan tersimpan untuk karakter aktif.",
      },
      {
        cmd: ".session",
        desc: "Lihat status session chat WA ini (karakter aktif, chat_id, dll).",
      },
      {
        cmd: ".botstats",
        desc: "Lihat statistik bot (uptime, jumlah pesan, command terpakai, dll).",
      },
      {
        cmd: ".owner",
        desc: "Lihat info pemilik bot & nomor bot.",
      },
      {
        cmd: ".reset",
        desc: "Reset session chat WA ini (karakter & history di chat ini dihapus).",
      },
    ],
  },
];

function buildMenuText() {
  let out = "";
  out += "╭── *WA BOT — Character.AI* ──\n";
  out += "│ CAINode + Baileys\n";
  out += "╰──────────────────────────\n\n";
  out += "AI hanya merespon saat pesan diawali *.ai*.\n\n";

  let total = 0;
  for (const cat of COMMANDS) {
    out += `┌─ *${cat.category}* ─\n`;
    for (const c of cat.items) {
      out += `│ ${c.cmd}\n`;
      out += `│   _${c.desc}_\n`;
      total++;
    }
    out += "└────────────────────\n\n";
  }
  out += `Total: *${total} command*\n`;
  out += "Made with CAINode + Baileys";
  return out;
}

module.exports = { COMMANDS, buildMenuText };
