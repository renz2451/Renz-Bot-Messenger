const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "note",
  version: "1.1.0",
  permission: 0,
  credits: "Jantzy Acc + ChatGPT",
  prefix: true,
  description: "Create real Messenger Notes",
  category: "utility",
  usages: "",
  cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    "📝 𝗠𝗲𝘀𝘀𝗲𝗻𝗴𝗲𝗿 𝗡𝗼𝘁𝗲 𝗠𝗲𝗻𝘂\n\nChoose note type:\n1️⃣ Text\n2️⃣ Emoji\n3️⃣ Music\n4️⃣ GIF\n5️⃣ Color Text\n\nReply with a number.",
    event.threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        type: "menu"
      });
    }
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (handleReply.author !== event.senderID) return;

  const userID = api.getCurrentUserID();

  // 🔥 FIXED — ALWAYS finds Nayanstate.json even if command is in /scripts/commands/
  let cookies;
  try {
    const filePath = path.join(process.cwd(), "Nayanstate.json");

    if (!fs.existsSync(filePath)) {
      return api.sendMessage("❌ Nayanstate.json NOT FOUND.\nPlace it in your bot root folder.", event.threadID);
    }

    const raw = fs.readFileSync(filePath, "utf8");

    if (!raw || raw.trim() === "") {
      return api.sendMessage("❌ Nayanstate.json is EMPTY.", event.threadID);
    }

    const data = JSON.parse(raw);

    if (!Array.isArray(data) || data.length === 0) {
      return api.sendMessage("❌ Nayanstate.json contains NO cookies.", event.threadID);
    }

    cookies = data.map(c => `${c.key}=${c.value}`).join("; ");
  } catch (e) {
    return api.sendMessage("❌ Error reading Nayanstate.json:\n" + e.message, event.threadID);
  }

  // Headers for real Messenger Note API
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Cookie": cookies,
    "User-Agent": "Mozilla/5.0"
  };

  // POST function for note
  async function postNote(text, type = "TEXT", extra = {}) {
    try {
      const variables = {
        actor_id: userID,
        text: text,
        note_type: type,
        source: "MESSENGER"
      };

      if (extra.color) variables.color = extra.color;
      if (extra.gif) variables.gif_keyword = extra.gif;
      if (extra.music) variables.music_title = extra.music;

      await axios({
        url: "https://graph.facebook.com/graphql",
        method: "POST",
        headers,
        data: new URLSearchParams({
          fb_api_req_friendly_name: "MessengerNotesCreateMutation",
          fb_api_caller_class: "RelayModern",
          doc_id: "7184429151624515",
          variables: JSON.stringify(variables)
        })
      });

      return api.sendMessage("✅ Your note is now posted on Messenger!", event.threadID);
    } catch (err) {
      return api.sendMessage("❌ Error posting note:\n" + err.message, event.threadID);
    }
  }

  // ---- MENU ----
  if (handleReply.type === "menu") {
    const choice = event.body.trim();

    switch (choice) {
      case "1":
        api.sendMessage("✍️ Send your text note.", event.threadID, (e, info) => {
          global.client.handleReply.push({
            name: "note",
            messageID: info.messageID,
            author: event.senderID,
            type: "text"
          });
        });
        break;

      case "2":
        api.sendMessage("😊 Send your emoji.", event.threadID, (e, info) => {
          global.client.handleReply.push({
            name: "note",
            messageID: info.messageID,
            author: event.senderID,
            type: "emoji"
          });
        });
        break;

      case "3":
        api.sendMessage("🎵 Send music title.", event.threadID, (e, info) => {
          global.client.handleReply.push({
            name: "note",
            messageID: info.messageID,
            author: event.senderID,
            type: "music"
          });
        });
        break;

      case "4":
        api.sendMessage("🔍 Send GIF keyword.", event.threadID, (e, info) => {
          global.client.handleReply.push({
            name: "note",
            messageID: info.messageID,
            author: event.senderID,
            type: "gif"
          });
        });
        break;

      case "5":
        api.sendMessage("🎨 Send color + message (example: #ff00ff Hello!)", event.threadID, (e, info) => {
          global.client.handleReply.push({
            name: "note",
            messageID: info.messageID,
            author: event.senderID,
            type: "color"
          });
        });
        break;

      default:
        api.sendMessage("❌ Invalid choice.", event.threadID);
    }
    return;
  }

  // ---- NOTE TYPES ----
  if (handleReply.type === "text") return postNote(event.body, "TEXT");

  if (handleReply.type === "emoji") return postNote(event.body, "EMOJI");

  if (handleReply.type === "music")
    return postNote(event.body, "MUSIC", { music: event.body });

  if (handleReply.type === "gif")
    return postNote(event.body, "GIF", { gif: event.body });

  if (handleReply.type === "color") {
    const arr = event.body.split(" ");
    const color = arr.shift();
    const msg = arr.join(" ");
    return postNote(msg, "COLORED_TEXT", { color });
  }
};
