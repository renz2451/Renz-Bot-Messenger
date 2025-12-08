module.exports.config = {
  name: "bio",
  version: "2.0.0",
  permission: 2,
  prefix: true,
  credits: "Terence + Edited",
  premium: false,
  category: "admin",
  description: "Change the bot's biography or auto-reset",
  usages: "bio [new biography]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const { threadID, messageID } = event;

    // MONO BOLD FONT BIO
    const defaultBio =
      `𝙏𝙝𝙞𝙨 𝘽𝙤𝙩 𝙈𝙖𝙙𝙚 𝘽𝙮 "𝙏𝙚𝙧𝙚𝙣𝙘𝙚 𝙎𝙞𝙢𝙗𝙧𝙚" 🤖\n` +
      `𝙁𝘽 : https://www.facebook.com/100015.02.2008.renz`;

    // If no arguments = restore default bio
    if (args.length === 0) {
      api.changeBio(defaultBio, err => {
        if (err)
          return api.sendMessage(
            `❌ Failed to restore default bio.\nError: ${err}`,
            threadID,
            messageID
          );

        return api.sendMessage(
          `✅ Bio restored to default:\n\n${defaultBio}`,
          threadID,
          messageID
        );
      });
      return;
    }

    // User wants to set own bio manually
    const newBio = args.join(" ");

    api.changeBio(newBio, error => {
      if (error) {
        return api.sendMessage(
          `❌ Failed to update bio.\nError: ${error}`,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        `✅ Successfully updated the bot biography to:\n\n${newBio}`,
        threadID,
        messageID
      );
    });

  } catch (err) {
    return api.sendMessage(
      `❌ Error in bio command:\n${err.message}`,
      event.threadID,
      event.messageID
    );
  }
};

// AUTO RESTORE DEFAULT BIO IF BOT BIO IS MANUALLY CHANGED
module.exports.handleEvent = async function ({ api }) {
  const defaultBio =
    `𝙏𝙝𝙞𝙨 𝘽𝙤𝙩 𝙈𝙖𝙙𝙚 𝘽𝙮 "𝙏𝙚𝙧𝙚𝙣𝙘𝙚 𝙎𝙞𝙢𝙗𝙧𝙚" 🤖\n` +
    `𝙁𝘽 : https://www.facebook.com/100015.02.2008.renz`;

  api.getCurrentUserInfo((err, info) => {
    if (err || !info) return;

    // If bio is empty or different = auto-reset
    if (!info.bio || info.bio !== defaultBio) {
      api.changeBio(defaultBio, () => {});
    }
  });
};