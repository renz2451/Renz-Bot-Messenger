const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "changecover",
  version: "8.0.0",
  permission: 2,
  credits: "Jantzy + ChatGPT",
  prefix: true,
  description: "Change bot cover photo (image or URL)",
  category: "system",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage(
    "📤 Send the **image URL** or **attach a photo** to set as the new cover photo.",
    event.threadID,
    (_, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        type: "cover",
        messageID: info.messageID,
        author: event.senderID
      });
    }
  );
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  if (event.senderID !== handleReply.author) return;

  let url = null;
  const { threadID, body } = event;

  if (event.attachments?.length > 0) url = event.attachments[0].url;
  else if (body?.startsWith("http")) url = body.trim();

  if (!url)
    return api.sendMessage("❌ Please attach an image or send a valid image URL.", threadID);

  const imgPath = path.join(__dirname, `cache/cover_${Date.now()}.jpg`);

  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, res.data);
  } catch {
    return api.sendMessage("❌ Failed to download image.", threadID);
  }

  const steps = [
    "✨ PREPARING\n▰▱▱▱▱ 20%",
    "⏳ PROCESSING\n▰▰▱▱▱ 40%",
    "🎨 OPTIMIZING\n▰▰▰▱▱ 60%",
    "⚙ APPLYING\n▰▰▰▰▱ 80%",
    "✔ FINISHING\n▰▰▰▰▰ 100%"
  ];

  for (let i = 0; i < steps.length; i++) {
    await api.editMessage(steps[i], handleReply.messageID);
    await new Promise((res) => setTimeout(res, 700));
  }

  api.changeCover(fs.createReadStream(imgPath), async (err) => {
    if (err) {
      return api.editMessage("❌ Failed to change cover photo.", handleReply.messageID);
    }

    const botID = api.getCurrentUserID();

    api.sendMessage(
      {
        body: `✅ **Cover photo updated successfully!**\n👤 https://facebook.com/${botID}`,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath)
    );
  });
};
