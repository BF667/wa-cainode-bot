# WhatsApp Bot — Character.AI (CAINode + Baileys)

Bot WhatsApp yang menghubungkan ke Character.AI pakai library [CAINode](https://github.com/KevinAdhaikal/CAINode) dan WhatsApp Web pakai [Baileys](https://github.com/WhiskeySockets/Baileys).

**AI hanya merespon ketika pesan diawali `.ai`**. Semua command lain (lihat karakter, search, generate gambar, dll) juga diawali `.` — ketik `.menu` di chat bot untuk melihat semua command.

Konfigurasi 100% via `config.js` — **tidak ada .env**.

---

## Fitur

- ✅ Login Character.AI pakai token (1 token, multi-user WA)
- ✅ Chat dengan karakter: `.ai <pesan>`
- ✅ Session per chat WA (DM/grup beda karakter bisa paralel)
- ✅ Ganti karakter: `.setchar <character_id>`
- ✅ Search karakter, trending, featured, for you
- ✅ Lihat info akun & karakter
- ✅ Generate gambar / avatar dari prompt
- ✅ Mulai conversation baru
- ✅ Lihat history percakapan
- ✅ Menu bantuan: `.menu`
- ✅ **Pairing Code** — link WhatsApp pakai kode (gak perlu scan QR)
- ✅ **Config.js** — semua setting (nomor bot, owner, token, dll) di satu file

---

## Instalasi

### 1. Clone / download project ini

```bash
git clone https://github.com/BF667/wa-cainode-bot.git
cd wa-cainode-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Buat `config.js`

```bash
cp config.example.js config.js
```

Lalu edit `config.js` dan isi:
- `character_ai_token` — token Character.AI (WAJIB)
- `bot_phone_number` — nomor WA yang dipakai bot (untuk pairing code)
- `owner_jid` — nomor WA kamu (untuk notifikasi & info)
- `connection_method` — `"qr"` atau `"pairing_code"`

### 4. Dapatkan token Character.AI

Cara paling gampang:

1. Buka [character.ai](https://character.ai) di browser, login.
2. Buka DevTools (F12) → tab **Application** → **Cookies** → `https://character.ai`.
3. Cari cookie bernama `HTTP_AUTHORIZATION`, copy valuenya.
4. Atau di console browser jalankan:

   ```js
   document.cookie
     .split(";")
     .find((c) => c.trim().startsWith("HTTP_AUTHORIZATION"))
     .split("=")[1];
   ```

5. Paste ke `config.js` di variabel `character_ai_token`.

### 5. Jalankan bot

```bash
npm start
```

**Jika `connection_method: "pairing_code"`** (default):
- Bot akan print kode 8 digit di terminal.
- Buka WhatsApp di HP-mu → Settings → Linked Devices → **Link with phone number** → masukkan kode tsb.

**Jika `connection_method: "qr"`**:
- QR code akan muncul di terminal.
- Scan dengan WhatsApp → Linked Devices → Link a Device.

### 6. Test

Kirim pesan ke nomor bot:

```
.menu
```

---

## Cara Pakai

| Command                  | Fungsi                                              |
| ------------------------ | --------------------------------------------------- |
| `.ai <pesan>`            | Chat dengan karakter AI aktif                       |
| `.menu` / `.help`        | Tampilkan semua command                             |
| `.ping`                  | Cek status server Character.AI                       |
| `.setchar <character_id>` | Ganti karakter aktif untuk chat ini                 |
| `.charinfo [id]`         | Lihat info karakter (aktif atau berdasar ID)         |
| `.newchat`               | Mulai conversation baru dengan karakter aktif       |
| `.search <kata kunci>`   | Cari karakter di Character.AI                       |
| `.trending`              | Karakter trending                                   |
| `.featured`              | Karakter featured                                   |
| `.foryou`                | Rekomendasi karakter                                |
| `.userinfo`              | Info akun Character.AI bot                          |
| `.history`               | Daftar percakapan tersimpan                         |
| `.genimg <prompt>`       | Generate gambar dari teks                           |
| `.genavatar <prompt>`    | Generate avatar dari teks                           |
| `.session`               | Lihat status session chat ini                       |
| `.reset`                 | Reset session chat ini (karakter & history dihapus) |
| `.owner`                 | Lihat info pemilik bot & nomor bot                  |

---

## config.js — Penjelasan Field

```js
module.exports = {
  character_ai_token: "",         // Token Character.AI (WAJIB)
  default_character_id: "",       // Karakter default (opsional)
  bot_phone_number: "",           // Nomor WA bot untuk pairing code
  owner_jid: "",                  // Nomor WA owner (untuk notifikasi)
  connection_method: "pairing_code", // "qr" atau "pairing_code"
  prefix: ".",                    // Prefix command
  allowed_jids: [],               // Whitelist nomor yang boleh pakai bot
};
```

---

## Struktur Project

```
wa-cainode-bot/
├── index.js               # Entry point: koneksi WA (QR/pairing code) + handler pesan
├── config.example.js       # Template konfigurasi (copy jadi config.js)
├── config.js              # ASLI kamu — di-gitignore (jangan commit!)
├── package.json
├── README.md
├── lib/
│   ├── cainode-client.js   # Wrapper CAINode (login, session, chat)
│   ├── commands.js         # Router semua command
│   └── menu.js             # Daftar command untuk .menu
├── auth/                   # Auto-generated Baileys (jangan dihapus / commit)
└── sessions.json           # Auto-generated (state session per chat)
```

---

## Catatan

- **AI hanya merespon ketika pesan diawali `.ai`**. Semua command API lain tetap jalan (tapi tetap butuh login token).
- 1 bot = 1 token Character.AI. Beberapa user WA bisa chat paralel (masing-masing dengan karakter berbeda).
- Folder `auth/` menyimpan kredensial WhatsApp. Jangan di-share / commit ke Git.
- Untuk logout WhatsApp, hapus folder `auth/` lalu jalankan `npm start` lagi.
- Kadang CAINode meresponse agak lambat (2–10 detik). Bot sudah otomatis kirim "Sedang berpikir..." dulu.
- File `sessions.json` menyimpan state session per chat WA. Boleh dihapus untuk reset semua session.

---

## Troubleshooting

**Pairing code tidak muncul**
- Pastikan `bot_phone_number` terisi & valid (format: 62xxx, tanpa "+" atau spasi).
- Pastikan `connection_method: "pairing_code"` di config.js.
- Tunggu 2–3 detik setelah startup, kode akan print di terminal.

**Error: "CAINode belum login"**
Token di `config.js` salah / kosong. Cek lagi `character_ai_token`.

**Error: "Gagal set karakter: ..."**
Character ID salah format. Pastikan dapat dari `.search` / `.trending` / URL character.ai.

**WhatsApp gak balas pesan**
- Pastikan koneksi internet stabil
- Cek terminal, ada error log?
- Coba hapus folder `auth/` lalu request pairing code / scan QR ulang

**Bot tetap jalan tapi `.ai` error**
Koneksi Character.AI drop. Restart bot (`Ctrl+C` lalu `npm start` lagi).

---

## Lisensi

MIT. Pakai library pihak ketiga: [CAINode](https://github.com/KevinAdhaikal/CAINode) (MIT), [Baileys](https://github.com/WhiskeySockets/Baileys) (MIT).

Project ini tidak berafiliasi dengan Character.AI atau WhatsApp. Gunakan dengan sopan dan ikuti TOS masing-masing layanan.
