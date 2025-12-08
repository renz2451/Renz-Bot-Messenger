module.exports.config = {
	name: "unsend",
	version: "1.0.7",
	permission: 2,
	credits: "Nayan • Improved by ChatGPT",
	prefix: true,
	description: "Unsend your replied message with reaction confirmation",
	category: "admin",
	usages: "Reply to your message and type /unsend",
	cooldowns: 5
};

module.exports.languages = {
	"vi": {
			"returnCant": "Không thể gỡ tin nhắn của người khác.",
			"missingReply": "Hãy reply tin nhắn cần gỡ."
	},
	"en": {
			"returnCant": "You can only unsend YOUR OWN message.",
			"missingReply": "Reply to the message you want to unsend."
	}
};

module.exports.run = async function({ api, event, getText }) {

	// ❗ FIRST: user must reply to a message
	if (!event.messageReply)
			return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);

	// ❗ SECOND: check if user is trying to unsend bot's own message
	if (event.messageReply.senderID != api.getCurrentUserID())
			return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);

	// 👍 Auto react BEFORE unsending
	api.setMessageReaction("👍", event.messageID, () => {}, true);

	// 🗑️ Unsend after reaction
	return api.unsendMessage(event.messageReply.messageID);
};