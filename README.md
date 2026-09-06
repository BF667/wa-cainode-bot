<div align="center">

# 🤖 WA Bot — Character.AI

**WhatsApp Bot Character.AI pakai [CAINode](https://github.com/KevinAdhaikal/CAINode) + [Baileys](https://github.com/WhiskeySockets/Baileys)**

AI hanya merespon saat pesan diawali `.ai` • Pairing Code + QR • Config via `config.js` (NO ENV)

</div>

---

## ✨ Fitur

| Kategori | Fitur |
|---|---|
| **Chat AI** | `.ai` chat dengan karakter • `.regen` regenerate balasan • `.newchat` mulai conversation baru |
| **Karakter** | `.setchar` `.charinfo` `.search` `.trending` `.featured` `.foryou` `.tags` |
| **Favorit** | `.fav add` `.fav list` `.fav use` `.fav del` (persistent, per user WA) |
| **Media** | `.genimg` generate gambar • `.genavatar` generate avatar |
| **Info** | `.menu` `.ping` `.userinfo` `.history` `.session` `.botstats` `.owner` `.reset` |

**Total: 21 command.** Ketik `.menu` di chat bot untuk lihat semua.

---

## 🚀 Quick Start

```bash
# 1. Clone repo
git clone https://github.com/BF667/wa-cainode-bot.git
cd wa-cainode-bot

# 2. Install dependencies
npm install

# 3. Bikin config.js dari template
cp config.example.js config.js

# 4. Edit config.js — isi token Character.AI + nomor bot + nomor owner
nano config.js   # atau pakai editor favoritmu

# 5. Jalankan bot
npm start
```

Bot akan minta **pairing code** (default) atau **QR code** (sesuai `connection_method` di config).

---

## 🔑 Token Character.AI

1. Buka [character.ai](https://character.ai) di browser, login.
2. Buka DevTools (F12) → **Application** → **Cookies** → `https://character.ai`.
3. Cari cookie `HTTP_AUTHORIZATION`, copy valuenya.
4. Atau jalankan di console browser:

   ```js
   document.cookie
     .split(";")
     .find((c) => c.trim().startsWith("HTTP_AUTHORIZATION"))
     .split("=")[1];
   ```

5. Paste ke `config.js` → `character_ai_token`.

---

## 📞 Cara Pairing

### Pairing Code (default — paling gampang)

1. Set di `config.js`:
   ```js
   bot_phone_number: "62812xxxxxxx",  // nomor WA yang dipakai bot
   connection_method: "pairing_code",
   ```
2. `npm start`
3. Kode 8 digit muncul di terminal.
4. Di HP: **WhatsApp → Settings → Linked Devices → Link with phone number** → masukin kode.

### QR Code

1. Set di `config.js`:
   ```js
   connection_method: "qr",
   ```
2. `npm start`
3. QR muncul di terminal. Scan pakai **WhatsApp → Linked Devices → Link a Device**.

---

## ⚙️ config.js

| Field | Wajib | Deskripsi |
|---|:---:|---|
| `character_ai_token` | ✅ | Token Character.AI |
| `bot_phone_number` | kalau pairing_code | Nomor WA bot (format: `62xxx`, tanpa `+`) |
| `owner_jid` | opsional | Nomor WA owner (untuk notifikasi saat bot aktif) |
| `connection_method` | opsional | `"pairing_code"` (default) atau `"qr"` |
| `default_character_id` | opsional | Karakter default untuk chat baru |
| `prefix` | opsional | Prefix command (default: `"."`) |
| `allowed_jids` | opsional | Whitelist nomor WA yang boleh pakai bot |

Contoh:

```js
module.exports = {
  character_ai_token: "TOKEN_KAMU_DI_SINI",
  bot_phone_number: "6281234567890",
  owner_jid: "6281234567890",
  connection_method: "pairing_code",
  default_character_id: "",
  prefix: ".",
  allowed_jids: [],
};
```

---

## 📋 Command Reference

### Chat AI
| Command | Fungsi |
|---|---|
| `.ai <pesan>` | Chat dengan karakter AI aktif |
| `.regen` | Regenerate balasan AI terakhir |
| `.newchat` | Mulai conversation baru dengan karakter aktif |

### Karakter
| Command | Fungsi |
|---|---|
| `.setchar <id>` | Ganti karakter aktif untuk chat ini |
| `.charinfo [id]` | Lihat info karakter (aktif atau by ID) |
| `.search <kata>` | Cari karakter di Character.AI |
| `.trending` | Karakter trending |
| `.featured` | Karakter featured |
| `.foryou` | Rekomendasi karakter untukmu |
| `.tags` | Lihat daftar tag/kategori karakter |

### Favorit
| Command | Fungsi |
|---|---|
| `.fav add <id> [nama]` | Tambah karakter ke favorit (atau pakai karakter aktif kalau kosong) |
| `.fav list` | Lihat daftar favorit |
| `.fav use <no>` | Pakai karakter favorit nomor X |
| `.fav del <no\|id>` | Hapus dari favorit |

### Media
| Command | Fungsi |
|---|---|
| `.genimg <prompt>` | Generate gambar dari teks |
| `.genavatar <prompt>` | Generate avatar dari teks |

### Info & Status
| Command | Fungsi |
|---|---|
| `.menu` / `.help` | Tampilkan semua command |
| `.ping` | Cek status server Character.AI |
| `.userinfo` | Info akun Character.AI bot |
| `.history` | Daftar percakapan tersimpan untuk karakter aktif |
| `.session` | Status session chat WA ini |
| `.botstats` | Statistik bot (uptime, jumlah pesan, command terpakai) |
| `.owner` | Info pemilik bot & nomor bot |
| `.reset` | Reset session chat WA ini |

---

## 📁 Struktur Project

```
wa-cainode-bot/
├── index.js                # Entry: koneksi WA + handler pesan
├── config.example.js       # Template konfigurasi (copy jadi config.js)
├── config.js               # Asli kamu (di-gitignore!)
├── package.json
├── README.md
├── lib/
│   ├── cainode-client.js   # Wrapper CAINode (login, session, chat)
│   ├── commands.js        # Router semua command
│   ├── menu.js            # Daftar command + .menu formatter
│   ├── favorites.js       # Manager favorit karakter per user
│   └── stats.js           # Tracker statistik bot
├── auth/                   # Auto-generated Baileys (jangan commit)
├── sessions.json           # State session per chat (auto)
└── favorites.json          # Daftar favorit per user (auto)
```

---

## 🛠️ Troubleshooting

<details>
<summary><b>Pairing code tidak muncul</b></summary>

- Pastikan `bot_phone_number` terisi & valid (format: `62xxx`, tanpa `+` atau spasi).
- Pastikan `connection_method: "pairing_code"` di config.js.
- Tunggu 2–3 detik setelah startup, kode akan print di terminal.

</details>

<details>
<summary><b>Error: "CAINode belum login"</b></summary>

Token di `config.js` salah / kosong. Cek lagi `character_ai_token`.

</details>

<details>
<summary><b>Error: "Gagal set karakter: ..."</b></summary>

Character ID salah format. Pastikan dapat dari `.search` / `.trending` / `.featured` / URL character.ai.

</details>

<details>
<summary><b>WhatsApp gak balas pesan</b></summary>

- Cek terminal, ada error log?
- Pastikan koneksi internet stabil.
- Hapus folder `auth/` lalu `npm start` lagi untuk re-pairing.

</details>

<details>
<summary><b>Bot tetap jalan tapi .ai error</b></summary>

Koneksi Character.AI drop. Restart bot (`Ctrl+C` lalu `npm start` lagi).

</details>

---

## 📝 Catatan

- **AI hanya merespon** ketika pesan diawali `.ai`. Command lain tetap jalan tanpa AI aktif (tapi butuh login token).
- 1 bot = 1 token Character.AI. Multi-user WA bisa chat paralel dengan karakter berbeda.
- Folder `auth/`, `config.js`, `sessions.json`, `favorites.json` — **jangan commit ke Git** (sudah di-gitignore).
- Untuk logout WhatsApp, hapus folder `auth/` lalu jalankan `npm start` lagi.
- CAINode response 2–10 detik. Bot otomatis kirim "Sedang berpikir..." supaya gak bingung.

---

## 📜 Lisensi

MIT. Pakai library pihak ketiga:
- [CAINode](https://github.com/KevinAdhaikal/CAINode) (MIT)
- [Baileys](https://github.com/WhiskeySockets/Baileys) (MIT)

Project ini **tidak berafiliasi** dengan Character.AI atau WhatsApp. Gunakan dengan sopan dan ikuti TOS masing-masing layanan.

---

<div align="center">

Made with CAINode + Baileys

</div>
