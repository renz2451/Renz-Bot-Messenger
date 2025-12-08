const fs = require("fs");
const path = require("path");

module.exports.config = {
	name: "setprefix",
	version: "1.2.0",
	permission: 2,
	prefix: false,
	credits: "Nayan | Fixed by ChatGPT",
	description: "Change group prefix",
	category: "admin",
	usages: "[new prefix/reset]",
	cooldowns: 3
};

module.exports.languages = {
	"en": {
		"successChange": "✅ Prefix successfully changed to: **%1**",
		"missingInput": "⚠️ You must provide a prefix.\n\nExample:\n/setprefix !",
		"resetPrefix": "🔄 Prefix has been reset to default: **%1**",
		"confirmChange": "⚠️ Do you really want to change the prefix to: **%1**?\n\nReact 👍 to confirm."
	}
};

module.exports.handleReaction = async function ({ api, event, Threads, handleReaction, getText }) {
	try {
		if (event.userID !== handleReaction.author) return;

		const threadID = handleReaction.threadID;

		// Load existing thread data
		const data = (await Threads.getData(threadID)).data || {};
		data["PREFIX"] = handleReaction.newPrefix;

		// Save prefix to DB
		await Threads.setData(threadID, { data });
		await global.data.threadData.set(String(threadID), data);

		// Remove confirmation message
		api.unsendMessage(handleReaction.messageID);

		// Confirm to user
		return api.sendMessage(
			getText("successChange", handleReaction.newPrefix),
			threadID
		);

	} catch (err) {
		console.log("[SET PREFIX ERROR] " + err);
	}
};

module.exports.run = async function ({ api, event, args, Threads, getText }) {

	const threadID = event.threadID;

	// Missing prefix
	if (!args[0])
		return api.sendMessage(getText("missingInput"), threadID, event.messageID);

	const prefix = args[0].trim();

	if (prefix.length === 0)
		return api.sendMessage(getText("missingInput"), threadID, event.messageID);

	// RESET PREFIX
	if (prefix.toLowerCase() === "reset") {
		const data = (await Threads.getData(threadID)).data || {};

		data["PREFIX"] = global.config.PREFIX; // Load from nayan.json

		// Save back
		await Threads.setData(threadID, { data });
		await global.data.threadData.set(String(threadID), data);

		return api.sendMessage(
			getText("resetPrefix", global.config.PREFIX),
			threadID,
			event.messageID
		);
	}

	// CONFIRM MESSAGE
	return api.sendMessage(
		getText("confirmChange", prefix),
		threadID,
		(err, info) => {
			if (err) return;

			// Push confirm handler
			global.client.handleReaction.push({
				name: module.exports.config.name,
				messageID: info.messageID,
				author: event.senderID,
				newPrefix: prefix,
				threadID: threadID
			});
		}
	);
};