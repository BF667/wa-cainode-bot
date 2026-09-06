// lib/commands.js
// Handler untuk setiap command. Menerima (msg, senderJid, ctx) dan mengembalikan string balasan.
//
// ctx berisi:
//   - cainode   : instance CainodeManager
//   - favorites : instance FavoritesManager
//   - stats     : stats module
//   - senderJid : jid pengirim (string)
//   - reply     : function async (text) untuk kirim balasan ke chat yang sama
//   - config    : object config.js

const { buildMenuText } = require("./menu");

module.exports = {
  /**
   * Router utama. Menerima teks pesan (sudah di-trim) dan mengembalikan balasan atau null.
   */
  async handle(text, senderJid, ctx) {
    if (!text || !text.startsWith(".")) return null;

    const [rawCmd, ...rest] = text.split(" ");
    const cmd = rawCmd.toLowerCase().replace(/^\./, "");
    const argStr = rest.join(" ").trim();

    // Track command usage stats
    if (ctx.stats && typeof ctx.stats.recordCommand === "function") {
      ctx.stats.recordCommand(cmd);
    }

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
          return "Bot belum login ke Character.AI. Setel token dulu di config.js (character_ai_token).";
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

      case "regen": {
        if (!ctx.cainode.loggedIn) {
          return "Bot belum login ke Character.AI.";
        }
        const session = ctx.cainode.getSession(senderJid);
        if (!session.char_id || !session.chat_id) {
          return "Belum ada balasan AI yang bisa di-regenerate. Chat dulu pakai .ai sebelumnya.";
        }
        try {
          await ctx.reply("_Lagi mikir ulang..._");
          // Connect dulu
          try {
            await ctx.cainode.client.character.connect(session.char_id);
          } catch (_) {
            /* abaikan */
          }
          // Ambil turn_id terakhir dari history
          const history = await ctx.cainode.client.chat.history_chat_turns({
            chat_id: session.chat_id,
            char_id: session.char_id,
          });
          const turns = history?.turns || history || [];
          if (!Array.isArray(turns) || turns.length === 0) {
            return "Tidak ada history percakapan untuk di-regenerate.";
          }
          const lastTurn = turns[turns.length - 1];
          const turnId = lastTurn?.id || lastTurn?.turn_id || lastTurn?.turnKey?.turnId;
          if (!turnId) {
            return "Tidak bisa ambil turn_id balasan terakhir.";
          }
          const result = await ctx.cainode.client.character.generate_turn_candidate(
            turnId,
            { char_id: session.char_id, chat_id: session.chat_id }
          );
          const reply =
            result?.turn?.candidates?.[0]?.raw_content ||
            result?.candidate?.raw_content ||
            null;
          if (!reply) return "Gagal regenerate balasan.";
          return `*Regenerated:*\n\n${reply}`;
        } catch (e) {
          return `Gagal regenerate: ${e.message}`;
        }
      }

      case "setchar": {
        if (!argStr) {
          return "Cara pakai: .setchar <character_id>\nContoh: .setchar YnBfM2RhNjV...";
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

      case "tags": {
        try {
          const result = await ctx.cainode.client.search.list_tags();
          const tags = result?.tags || result || [];
          if (!Array.isArray(tags) || tags.length === 0) {
            return "Tidak ada tag tersedia saat ini.";
          }
          const lines = ["*🏷️ TAG KARAKTER:*", "────────────"];
          for (const t of tags.slice(0, 20)) {
            const name = t.name || t.title || t.tag || "?";
            const count = t.num_characters || t.count || "";
            lines.push(`• ${name}${count ? ` (${count})` : ""}`);
          }
          if (tags.length > 20) {
            lines.push(`\n...dan ${tags.length - 20} tag lainnya.`);
          }
          return lines.join("\n");
        } catch (e) {
          return `Gagal ambil tag: ${e.message}`;
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
          const url =
            result?.image?.url ||
            result?.url ||
            result?.images?.[0]?.url ||
            (typeof result === "string" ? result : null);
          if (!url) {
            return `Generate gambar selesai, tapi tidak menemukan URL. Response: ${JSON.stringify(result).slice(0, 300)}`;
          }
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

      case "fav": {
        const fav = ctx.favorites;
        if (!fav) return "Modul favorit tidak tersedia.";
        const [sub, ...favRest] = argStr.split(" ");
        const favArg = favRest.join(" ").trim();
        const subCmd = (sub || "list").toLowerCase();

        switch (subCmd) {
          case "list":
            return fav.formatList(senderJid);

          case "add": {
            const session = ctx.cainode.getSession(senderJid);
            let charId = favArg;
            let name = null;
            // Jika kosong, pakai karakter aktif
            if (!charId) {
              if (!session.char_id) {
                return "Cara pakai: .fav add <character_id> [nama] — atau set karakter aktif dulu pakai .setchar.";
              }
              charId = session.char_id;
              name = session.character_name;
            } else {
              // Pisah char_id dan nama (kalau ada spasi)
              const parts = charId.split(" ");
              if (parts.length > 1) {
                charId = parts[0];
                name = parts.slice(1).join(" ");
              }
            }
            // Ambil nama dari API kalau belum ada
            if (!name && ctx.cainode.loggedIn) {
              try {
                const info = await ctx.cainode.client.character.info(charId);
                name = info?.character?.name || info?.character?.title || null;
              } catch (_) {
                /* abaikan */
              }
            }
            const r = fav.add(senderJid, charId, name);
            if (!r.ok) {
              return `Karakter sudah ada di favorit:\n${r.entry.name || r.entry.char_id}`;
            }
            return `Ditambahkan ke favorit (#${r.index}):\n${name || charId}\n\`${charId}\``;
          }

          case "use": {
            if (!favArg) return "Cara pakai: .fav use <no>";
            const entry = fav.get(senderJid, favArg);
            if (!entry) {
              return `Favorit nomor ${favArg} tidak ditemukan. Ketik .fav list untuk lihat daftar.`;
            }
            try {
              const session = await ctx.cainode.setCharacter(
                senderJid,
                entry.char_id
              );
              return `Karakter aktif: *${session.character_name || entry.char_id}*\n(dari favorit)\n\nSekarang bisa chat pakai .ai <pesan>`;
            } catch (e) {
              return `Gagal pakai favorit: ${e.message}`;
            }
          }

          case "del":
          case "delete":
          case "remove": {
            if (!favArg) return "Cara pakai: .fav del <no|char_id>";
            const r = fav.remove(senderJid, favArg);
            if (!r.ok) {
              return `Tidak ditemukan di favorit: ${favArg}`;
            }
            return `Dihapus dari favorit:\n${r.removed.name || r.removed.char_id}`;
          }

          default:
            return "Sub-command .fav tidak dikenal. Pakai: add / list / use / del";
        }
      }

      case "botstats": {
        const s = ctx.stats.getStats();
        const topCmds = Object.entries(s.commands_used)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([k, v]) => `   .${k}: ${v}`)
          .join("\n");
        const lines = [
          "*📊 STATISTIK BOT:*",
          "────────────",
          `Uptime: ${s.uptime}`,
          `Started: ${s.started_at}`,
          `Pesan masuk: ${s.messages_total}`,
          `Command dipakai: ${s.commands_total}`,
          `Session aktif: ${ctx.cainode.sessions.size}`,
          "",
          "*Top 5 command:*",
          topCmds || "   (belum ada)",
        ];
        return lines.join("\n");
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
        lines.push(`Koneksi: ${cfg.connection_method || "qr"}`);
        return lines.join("\n");
      }

      case "reset": {
        ctx.cainode.sessions.delete(senderJid);
        return "Session chat ini sudah direset. Pakai .setchar <id> atau .fav use <no> untuk memilih karakter.";
      }

      default:
        return null; // bukan command dikenal
    }
  },
};
