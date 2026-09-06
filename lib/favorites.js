// lib/favorites.js
// Manager favorit karakter per user WA.
// Disimpan ke favorites.json (persistent antar restart).

const fs = require("fs");
const path = require("path");

class FavoritesManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {}; // { "waJid": [ { char_id, name, added_at } ] }
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        this.data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      }
    } catch (e) {
      console.error("Gagal load favorites:", e.message);
      this.data = {};
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error("Gagal simpan favorites:", e.message);
    }
  }

  list(waJid) {
    return this.data[waJid] || [];
  }

  add(waJid, charId, name = null) {
    if (!this.data[waJid]) this.data[waJid] = [];
    // Cek duplikat
    const existing = this.data[waJid].find(
      (c) => c.char_id === charId
    );
    if (existing) {
      return { ok: false, reason: "duplicate", entry: existing };
    }
    const entry = {
      char_id: charId,
      name: name || charId,
      added_at: new Date().toISOString(),
    };
    this.data[waJid].push(entry);
    this.save();
    return { ok: true, entry, index: this.data[waJid].length };
  }

  remove(waJid, key) {
    // key bisa index (1-based) atau char_id
    const list = this.data[waJid] || [];
    let idx = -1;
    const numKey = Number(key);
    if (!isNaN(numKey) && numKey >= 1 && numKey <= list.length) {
      idx = numKey - 1;
    } else {
      idx = list.findIndex((c) => c.char_id === key);
    }
    if (idx === -1) return { ok: false, reason: "not_found" };
    const removed = list.splice(idx, 1)[0];
    this.data[waJid] = list;
    this.save();
    return { ok: true, removed };
  }

  get(waJid, key) {
    const list = this.data[waJid] || [];
    const numKey = Number(key);
    if (!isNaN(numKey) && numKey >= 1 && numKey <= list.length) {
      return list[numKey - 1];
    }
    return list.find((c) => c.char_id === key) || null;
  }

  formatList(waJid) {
    const list = this.list(waJid);
    if (list.length === 0) {
      return "Belum ada karakter favorit. Tambah pakai .fav add <character_id> [nama]";
    }
    const lines = [`*FAVORIT KARAKTER (${list.length}):*`, "────────────"];
    list.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.name || c.char_id}`);
      lines.push(`   \`${c.char_id}\``);
    });
    lines.push("\nGunakan .fav use <no> untuk pilih karakter.");
    return lines.join("\n");
  }
}

module.exports = { FavoritesManager };
