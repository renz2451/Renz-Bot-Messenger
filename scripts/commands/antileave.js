// ============================================================
// antiout.js — ULTIMATE Anti-Leave (Max Strict / No-Escape)
// Version: 5.0
// Credits: Terence + Jantzy + Assistant
// Paste into: /scripts/commands/antiout.js
// ============================================================

module.exports.config = {
  name: "antiout",
  version: "5.0",
  permission: 2,
  credits: "Terence + Jantzy + Assistant",
  description: "Ultimate anti-leave: keeps retrying until user is re-added (Max Strict Mode)",
  prefix: true,
  category: "system",
  usages: "on/off/status/setmsg/setgif/reaction/reset/mode",
  cooldowns: 3
};

const fs = require("fs-extra");
const path = require("path");
const dataFile = path.join(__dirname, "..", "data", "antiout.json");

// Ensure data path/file exists
async function ensureData() {
  await fs.ensureDir(path.join(__dirname, "..", "data"));
  if (!fs.existsSync(dataFile)) {
    await fs.writeJson(dataFile, {});
  }
}

// Helper: sleep ms
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Helper: safe get user name
function getUserName(api, uid) {
  return new Promise((resolve) => {
    api.getUserInfo(uid, (err, res) => {
      try {
        if (err || !res || !res[uid]) return resolve("Unknown User");
        return resolve(res[uid].name || "Unknown User");
      } catch (e) {
        return resolve("Unknown User");
      }
    });
  });
}

// Helper: attempt add with Promise
function attemptAdd(api, uid, threadID) {
  return new Promise((resolve) => {
    // addUserToGroup signature varies by library — keep callback style
    try {
      api.addUserToGroup(uid, threadID, (err) => {
        if (!err) return resolve({ success: true });
        return resolve({ success: false, err });
      });
    } catch (e) {
      // In case addUserToGroup returns a Promise
      try {
        api.addUserToGroup(uid, threadID)
          .then(() => resolve({ success: true }))
          .catch((err2) => resolve({ success: false, err: err2 }));
      } catch (e2) {
        resolve({ success: false, err: e2 });
      }
    }
  });
}

// Build rejoin link (fallback)
function buildRejoinLink(api, threadID) {
  // m.me join trick used previously; keep same pattern
  return `https://m.me/${api.getCurrentUserID()}?join_group=${threadID}`;
}

// ============================================================
// HANDLE LEAVE EVENT (MAX STRICT: infinite retry with backoff)
// ============================================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (event.logMessageType !== "log:unsubscribe") return;

    await ensureData();
    const all = await fs.readJson(dataFile);

    const threadID = String(event.threadID);
    const target = event.logMessageData.leftParticipantFbId;

    // skip if bot left
    if (String(target) === String(api.getCurrentUserID())) return;

    // ensure group config exists
    if (!all[threadID]) {
      all[threadID] = {
        enabled: false,
        message: "🚫 {name} tried to leave — no escape allowed!\n\n{type}",
        gif: "",
        reaction: "",
        mode: "max" // default to max strict
      };
      await fs.writeJson(dataFile, all, { spaces: 2 });
    }

    // If antiout disabled, do nothing
    if (!all[threadID].enabled) return;

    const cfg = all[threadID];

    const userName = await getUserName(api, target);
    const msgText = (cfg.message || "")
      .replace(/\{name\}/g, userName)
      .replace(/\{id\}/g, target)
      .replace(/\{type\}/g, "User attempted to leave.");

    // 7-LAYER approach condensed into a resilient retry loop
    // Layer summary:
    // 1) Normal add attempt
    // 2) Alternate add attempt (same API but called again)
    // 3) Short retries (1s, 2s)
    // 4) DM rejoin link every attempt
    // 5) Exponential backoff up to 60s and continue until success
    // 6) Optional group message + gif
    // 7) Reaction message

    let added = false;
    let attempt = 0;

    // We'll retry until added — Max Strict Mode
    while (!added) {
      attempt += 1;

      // Try to add (primary)
      const res1 = await attemptAdd(api, target, threadID);
      if (res1.success) {
        added = true;
        console.log(`[antiout] add success (primary) for ${target} on attempt ${attempt}`);
        break;
      }

      // Try a quick immediate second attempt (silent alternate)
      const res2 = await attemptAdd(api, target, threadID);
      if (res2.success) {
        added = true;
        console.log(`[antiout] add success (secondary) for ${target} on attempt ${attempt}`);
        break;
      }

      // Send DM rejoin link as fallback and reminder
      try {
        api.sendMessage(
          {
            body: `🚫 You cannot permanently leave this group.\nTap to rejoin:`,
            url: buildRejoinLink(api, threadID)
          },
          target,
          () => {}
        );
      } catch (e) {
        // ignore DM sending errors
      }

      // Exponential backoff logic: increase delay each loop up to 60s
      // delays sequence: 1000ms, 2000ms, 4000ms, 8000ms, 16000ms, 30000ms, 60000ms, 60000ms...
      let delay = 1000 * Math.pow(2, Math.min(attempt - 1, 6)); // 2^(attempt-1) * 1s, capped
      if (delay > 60000) delay = 60000;

      console.log(`[antiout] attempt ${attempt} failed to add ${target}. waiting ${delay}ms before retry.`);

      // Small internal "burst" retry pair before sleeping to maximize chance
      // (another immediate quick add and then sleep)
      const res3 = await attemptAdd(api, target, threadID);
      if (res3.success) {
        added = true;
        console.log(`[antiout] add success (burst) for ${target} on attempt ${attempt}`);
        break;
      }

      // Wait before next loop
      await sleep(delay);

      // On long-running loops, periodically send group notice about the attempt (every ~6 tries)
      if (attempt % 6 === 0) {
        try {
          api.sendMessage(
            `╔═══ ⚠ Antiout Notice ═══╗
║ Retrying to restore: ${userName}
║ Attempts so far: ${attempt}
║ If FB is rate-limiting, this will continue until re-add succeeds.
╚══════════════════════════╝`,
            threadID
          );
        } catch (e) {
          // ignore
        }
      }

      // Continue loop until added (Max Strict)
    } // end while

    // At this point added === true
    // Send main group message with optional GIF
    try {
      let msgObj = { body: msgText };
      if (cfg.gif && cfg.gif.length > 5) {
        try {
          msgObj.attachment = await global.utils.getStreamFromURL(cfg.gif);
        } catch (e) {
          console.log("[antiout] GIF fetch error:", e);
        }
      }
      api.sendMessage(msgObj, threadID);
    } catch (e) {
      console.log("[antiout] send group message error:", e);
    }

    // Send reaction message if configured
    if (cfg.reaction && cfg.reaction.trim() !== "") {
      try {
        api.sendMessage(cfg.reaction, threadID);
      } catch (e) {
        // ignore
      }
    }

  } catch (err) {
    console.log("Antiout handleEvent (MAX) error:", err);
  }
};

// ============================================================
// COMMANDS: on/off/status/setmsg/setgif/reaction/reset/mode
// ============================================================
module.exports.run = async ({ api, event, args }) => {
  try {
    await ensureData();
    const all = await fs.readJson(dataFile);
    const threadID = String(event.threadID);

    if (!all[threadID]) {
      all[threadID] = {
        enabled: false,
        message: "🚫 {name} tried to leave — no escape allowed!\n\n{type}",
        gif: "",
        reaction: "",
        mode: "max"
      };
    }

    const cfg = all[threadID];
    const sub = (args[0] || "").toLowerCase();

    if (sub === "on") {
      cfg.enabled = true;
      await fs.writeJson(dataFile, all, { spaces: 2 });
      return api.sendMessage("🟢 Antiout ENABLED (Max Strict) for this group.", threadID);
    }

    if (sub === "off") {
      cfg.enabled = false;
      await fs.writeJson(dataFile, all, { spaces: 2 });
      return api.sendMessage("🔴 Antiout DISABLED for this group.", threadID);
    }

    if (sub === "status") {
      return api.sendMessage(
        `╔══ 🔍 ANTI-LEAVE STATUS ══╗
║ State: ${cfg.enabled ? "ON" : "OFF"}
║ Mode: ${cfg.mode || "max"}
║ Message: ${(cfg.message || "").slice(0, 120)}
║ GIF: ${cfg.gif || "None"}
║ Reaction: ${cfg.reaction || "None"}
╚══════════════════════════╝`,
        threadID
      );
    }

    if (sub === "setmsg") {
      const newMsg = args.slice(1).join(" ");
      if (!newMsg) return api.sendMessage("❗ Usage: /antiout setmsg <message>", threadID);
      cfg.message = newMsg;
      await fs.writeJson(dataFile, all, { spaces: 2 });
      return api.sendMessage("✏️ Antiout leave message updated.", threadID);
    }

    if (sub === "setgif") {
      const gif = args[1];
      if (!gif) return api.sendMessage("❗ Usage: /antiout setgif <url>", threadID);
      cfg.gif = gif;
      await fs.writeJson(dataFile, all, { spaces: 2 });
      return api.sendMessage("🎬 GIF updated.", threadID);
    }

    if (sub === "reaction") {
      const text = args.slice(1).join(" ");
      if (!text) return api.sendMessage("❗ Usage: /antiout reaction <message>", threadID);
      cfg.reaction = text;
      await fs.writeJson(dataFile, all, { spaces: 2 });
      return api.sendMessage("⚡ Reaction message updated.", threadID);
    }

    if (sub === "reset" || sub === "clear") {
      all[threadID] = {
        enabled: false,
        message: "🚫 {name} tried to leave — no escape allowed!\n\n{type}",
        gif: "",
        reaction: "",
        mode: "max"
      };
      await fs.writeJson(dataFile, all, { spaces: 2 });
      return api.sendMessage("♻ Antiout settings reset for this group.", threadID);
    }

    // Optional: allow switching mode (max/smart/normal) for future flexibility
    if (sub === "mode") {
      const m = (args[1] || "max").toLowerCase();
      if (!["max", "smart", "normal"].includes(m)) return api.sendMessage("❗ Mode must be one of: max, smart, normal", threadID);
      cfg.mode = m;
      await fs.writeJson(dataFile, all, { spaces: 2 });
      return api.sendMessage(`✅ Antiout mode set to: ${m}`, threadID);
    }

    // Help
    const help =
      "╔═══ 🛠 Antiout Commands ═══╗\n" +
      "║ /antiout on — enable antiout\n" +
      "║ /antiout off — disable antiout\n" +
      "║ /antiout status — show settings\n" +
      "║ /antiout setmsg <text> — set leave message\n" +
      "║ /antiout setgif <url> — set gif\n" +
      "║ /antiout reaction <text> — set re-add message\n" +
      "║ /antiout reset — reset settings\n" +
      "║ /antiout mode <max|smart|normal> — change retry mode\n" +
      "╚═══════════════════════════╝";

    return api.sendMessage(help, threadID);

  } catch (err) {
    console.log("Antiout command error:", err);
    return api.sendMessage("⚠️ Error: cannot process antiout command.", event.threadID);
  }
};