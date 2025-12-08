const fs = require("fs");

module.exports.config = {
  name: "help",
  version: "4.0.0",
  permission: 0,
  credits: "Renztxpro • Fully Fixed by ChatGPT",
  description: "Modern Cyber Help Command",
  prefix: true,
  category: "guide",
  usages: "[page / command]",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const { commands } = global.client;

  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  // If argument exists
  const userInput = args[0] ? args[0].toLowerCase() : null;

  // ============================================================
  // 1️⃣ CHECK IF INPUT IS A PAGE NUMBER → DO NOT TREAT AS COMMAND
  // ============================================================
  if (userInput && !isNaN(userInput)) {
    const page = parseInt(userInput);
    const listCommands = Array.from(commands.keys()).sort();
    const perPage = 12;
    const totalPages = Math.ceil(listCommands.length / perPage);

    if (page < 1 || page > totalPages) {
      return api.sendMessage(
        `❌ Page not found.\n📌 Valid pages: 1 → ${totalPages}`,
        threadID,
        messageID
      );
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageCommands = listCommands.slice(start, end);

    let msg = `┏━━━━━━━━━━━━━━━━━━━━━━┓
┃     ⚡ CYBER COMMAND LIST ⚡    ┃
┣━━━━━━━━━━━━━━━━━━━━━━┫
┃ 🔢 Page: ${page}/${totalPages}
┃ 🔑 Prefix: ${prefix}
┃ 📦 Total Commands: ${listCommands.length}
┣━━━━━━━━━━━━━━━━━━━━━━┫
`;

    pageCommands.forEach((cmd, i) => {
      msg += `┃ ${start + i + 1}. ${prefix}${cmd}\n`;
    });

    msg += `┣━━━━━━━━━━━━━━━━━━━━━━┫
┃ Use: ${prefix}help [cmd]
┃ Example: ${prefix}help ping
┣━━━━━━━━━━━━━━━━━━━━━━┫
┃ Developer: Renztxpro
┗━━━━━━━━━━━━━━━━━━━━━━┛`;

    return api.sendMessage(msg, threadID, messageID);
  }

  // ============================================================
  // 2️⃣ USER ASKED FOR A SPECIFIC COMMAND & IT EXISTS
  // ============================================================
  if (userInput && commands.has(userInput)) {
    const cmd = commands.get(userInput);
    const info = cmd.config;

    const details = `⚡ ───「 CYBER COMMAND INFO 」─── ⚡

🔹 Command: ${prefix}${info.name}
📄 Description: ${info.description}
🛠 Usage: ${prefix}${info.name} ${info.usages || ""}
📂 Category: ${info.category || "general"}
⏱ Cooldown: ${info.cooldowns || 5}s
🔐 Permission: ${
      info.permission == 0
        ? "Everyone"
        : info.permission == 1
        ? "Group Admin"
        : "Bot Admin"
    }
👨‍💻 Author: ${info.credits}

⚡ Tip: Use ${prefix}help to view the full command list
`;

    return api.sendMessage(details, threadID, messageID);
  }

  // ============================================================
  // 3️⃣ INVALID COMMAND NAME (Only execute if not number)
  // ============================================================
  if (userInput && !commands.has(userInput)) {
    return api.sendMessage(
      `❌ Unknown command.\nTry: ${prefix}help or ${prefix}weather`,
      threadID,
      messageID
    );
  }

  // ============================================================
  // 4️⃣ DEFAULT HELP PAGE (PAGE 1)
  // ============================================================
  const listCommands = Array.from(commands.keys()).sort();
  const perPage = 12;
  const totalPages = Math.ceil(listCommands.length / perPage);

  let msg = `┏━━━━━━━━━━━━━━━━━━━━━━┓
┃     ⚡ CYBER COMMAND LIST ⚡     ┃
┣━━━━━━━━━━━━━━━━━━━━━━┫
┃ 🔢 Page: 1/${totalPages}
┃ 🔑 Prefix: ${prefix}
┃ 📦 Total Commands: ${listCommands.length}
┣━━━━━━━━━━━━━━━━━━━━━━┫
`;

  const firstPage = listCommands.slice(0, perPage);

  firstPage.forEach((cmd, i) => {
    msg += `┃ ${i + 1}. ${prefix}${cmd}\n`;
  });

  msg += `┣━━━━━━━━━━━━━━━━━━━━━━┫
┃ Use: ${prefix}help [page]
┃ Use: ${prefix}help [cmd]
┃ Example: ${prefix}help 2
┣━━━━━━━━━━━━━━━━━━━━━━┫
┃ Developer: Renztxpro
┗━━━━━━━━━━━━━━━━━━━━━━┛`;

  return api.sendMessage(msg, threadID, messageID);
};