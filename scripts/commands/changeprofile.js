const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "changeavatar",
  version: "8.0.0",
  permission: 2,
  credits: "Jantzy Acc + ChatGPT",
  prefix: true,
  description: "Change bot avatar with image or URL",
  category: "system",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage(
    "📤 Now send the **image URL** or **attach a photo** to use as your new avatar.",
    event.threadID,
    (_, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        type: "avatarInput",
        messageID: info.messageID,
        author: event.senderID
      });
    }
  );
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  if (event.senderID !== handleReply.author) return;

  if (handleReply.type !== "avatarInput") return;

  const { threadID, body } = event;

  let url = null;

  if (event.attachments?.length > 0) url = event.attachments[0].url;
  else if (body.startsWith("http")) url = body.trim();

  if (!url)
    return api.sendMessage("❌ Please attach an image or send a valid image URL.", threadID);

  const imgPath = path.join(__dirname, `cache/avatar_${Date.now()}.jpg`);

  // Download
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, res.data);
  } catch (err) {
    return api.sendMessage("❌ Failed to download image.", threadID);
  }

  let msgID = handleReply.messageID;

  const steps = [
    "✨ **PREPARING AVATAR UPDATE**\n▰▱▱▱▱ 20%",
    "✨ **PROCESSING IMAGE**\n▰▰▱▱▱ 40%",
    "🎨 **OPTIMIZING IMAGE**\n▰▰▰▱▱ 60%",
    "⚙ **APPLYING AVATAR**\n▰▰▰▰▱ 80%",
    "✔ **FINALIZING**\n▰▰▰▰▰ 100%"
  ];

  // Progress edit (max 5 edits)
  for (let i = 0; i < steps.length; i++) {
    await api.editMessage(steps[i], msgID);
    await new Promise((res) => setTimeout(res, 700));
  }

  // Change avatar
  api.changeAvatar(fs.createReadStream(imgPath), async (err) => {
    if (err) {
      return api.editMessage("❌ Failed to apply avatar.", msgID);
    }

    const botID = api.getCurrentUserID();
    const profileURL = `https://facebook.com/${botID}`;

    return api.sendMessage(
      {
        body:
          `✅ **Avatar changed successfully!**\n\n` +
          `👤 Profile: ${profileURL}\n` +
          `📸 Preview attached below.`,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath)
    );
  });
};