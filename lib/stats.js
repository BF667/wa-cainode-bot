// lib/stats.js
// Tracker statistik bot (uptime, message count, command usage).

const startTime = Date.now();

const stats = {
  messages_total: 0,
  commands_total: 0,
  commands: {}, // { "ai": N, "menu": N, ... }
  sessions_started: 0,
};

function recordMessage() {
  stats.messages_total++;
}

function recordCommand(cmd) {
  stats.commands_total++;
  stats.commands[cmd] = (stats.commands[cmd] || 0) + 1;
}

function recordSessionStart() {
  stats.sessions_started++;
}

function uptimeMs() {
  return Date.now() - startTime;
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}

function getStats() {
  return {
    uptime: formatUptime(uptimeMs()),
    messages_total: stats.messages_total,
    commands_total: stats.commands_total,
    commands_used: stats.commands,
    sessions_started: stats.sessions_started,
    started_at: new Date(startTime).toISOString(),
  };
}

module.exports = {
  recordMessage,
  recordCommand,
  recordSessionStart,
  getStats,
  formatUptime,
};
