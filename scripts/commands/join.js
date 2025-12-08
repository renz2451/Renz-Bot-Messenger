const chalk = require('chalk');

module.exports.config = {
    name: "join",
    version: "1.0.1",
    permission: 2,
    credits: "ryuko",
    prefix: true,
    description: "Join groups where the bot is a member",
    category: "admin",
    usages: "",
    cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    var { threadID, messageID, senderID, body } = event;
    var { ID } = handleReply;

    if (!body || isNaN(parseInt(body))) {
        return api.sendMessage('❌ Your selection must be a number.', threadID, messageID);
    }

    const selection = parseInt(body);
    if (selection < 1 || selection > ID.length) {
        return api.sendMessage("❌ Your pick is not on the list.", threadID, messageID);
    }

    try {
        const targetThreadID = ID[selection - 1];

        // Check if the bot is still in the group
        try {
            const threadInfo = await api.getThreadInfo(targetThreadID);

            // Check if bot is still in the group
            const botID = api.getCurrentUserID();
            const isBotInGroup = threadInfo.participantIDs.includes(botID);

            if (!isBotInGroup) {
                return api.sendMessage("❌ I'm no longer in that group. Please choose another group.", threadID, messageID);
            }

            // Check if user is already in group
            if (threadInfo.participantIDs.includes(senderID)) {
                return api.sendMessage(`✅ You are already in this group: ${threadInfo.threadName || "Unknown Group"}.`, threadID, messageID);
            }

            // Try to add user
            await api.addUserToGroup(senderID, targetThreadID);

            // Check if group has approval mode
            if (threadInfo.approvalMode) {
                // Check if bot is admin
                const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
                if (!isBotAdmin) {
                    return api.sendMessage(
                        `📝 Added you to "${threadInfo.threadName || "the group"}".\n` +
                        `⚠️ This group has approval mode enabled and I'm not an admin.\n` +
                        `Please wait for a group admin to approve your request.`,
                        threadID, messageID
                    );
                }
            }

            return api.sendMessage(
                `✅ Successfully added you to: ${threadInfo.threadName || "the group"}\n\n` +
                `📍 Check your message requests or spam folder if you don't see the group.\n` +
                `🔒 If the group has approval mode enabled, you'll need admin approval.`,
                threadID, messageID
            );

        } catch (threadError) {
            // If we can't get thread info, bot is probably not in the group anymore
            return api.sendMessage("❌ I'm no longer in that group or the group doesn't exist.", threadID, messageID);
        }

    } catch (error) {
        console.error("Error:", error);
        return api.sendMessage(`❌ Failed to add you to the group.\nError: ${error.message || error}`, threadID, messageID);
    }
}

module.exports.run = async function({ api, event }) {
    var { threadID, messageID, senderID } = event;

    try {
        // Get all threads where the bot is a member
        const threadList = await api.getThreadList(100, null, ['INBOX']);

        // Filter only group conversations (not individual messages)
        const groupThreads = threadList.filter(thread => 
            thread.isGroup === true && 
            thread.threadID !== event.threadID // Exclude current thread
        );

        if (groupThreads.length === 0) {
            return api.sendMessage("❌ I'm not a member of any groups.", threadID, messageID);
        }

        let msg = `📋 Checking available groups...\n\n`;
        await api.sendMessage(msg, threadID, messageID);

        let availableGroups = [];
        let number = 0;

        // Check each group to see if bot is still a member
        for (const thread of groupThreads) {
            try {
                // Get fresh thread info to verify bot is still in group
                const threadInfo = await api.getThreadInfo(thread.threadID);

                // Check if bot is still in the group
                const botID = api.getCurrentUserID();
                const isBotInGroup = threadInfo.participantIDs.includes(botID);

                if (isBotInGroup) {
                    number++;
                    const threadName = threadInfo.threadName || `Group ${thread.threadID}`;
                    const participantCount = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0;
                    const isBotAdmin = threadInfo.adminIDs ? threadInfo.adminIDs.some(admin => admin.id === botID) : false;

                    availableGroups.push({
                        threadID: thread.threadID,
                        name: threadName,
                        participantCount: participantCount,
                        isBotAdmin: isBotAdmin,
                        approvalMode: threadInfo.approvalMode || false
                    });
                }

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.log(`Skipping group ${thread.threadID}: ${error.message}`);
                continue;
            }
        }

        if (availableGroups.length === 0) {
            return api.sendMessage("❌ I'm not currently a member of any accessible groups.", threadID, messageID);
        }

        // Sort available groups by name
        availableGroups.sort((a, b) => {
            const nameA = a.name || `Group ${a.threadID}`;
            const nameB = b.name || `Group ${b.threadID}`;
            return nameA.localeCompare(nameB);
        });

        msg = `📋 Available Groups to Join (${availableGroups.length})\n\n`;
        let ID = [];
        let displayNumber = 0;

        for (const group of availableGroups) {
            displayNumber++;
            let adminStatus = group.isBotAdmin ? "🛡️ (Admin)" : "👤 (Member)";
            let approvalStatus = group.approvalMode ? "🔒 (Approval)" : "🔓 (Open)";

            msg += `${displayNumber}. ${group.name} (${group.participantCount} members)\n`;
            msg += `   ${adminStatus} | ${approvalStatus}\n\n`;
            ID.push(group.threadID);

            // Limit display to prevent message being too long
            if (displayNumber >= 20) {
                msg += `\n... and ${availableGroups.length - 20} more available groups`;
                break;
            }
        }

        msg += `\n📝 Reply to this message with the number of the group you want to join.\n\n`;
        msg += `⚠️ Note: I can only add you if I'm an admin in that group.\n`;
        msg += `🔒 Groups with "Approval" require admin approval to join.\n`;
        msg += `🛡️ "Admin" means I have admin rights in that group.`;

        await api.sendMessage(msg, threadID, (error, info) => {
            if (error) {
                console.error("Send message error:", error);
                return api.sendMessage("❌ Failed to send group list.", threadID, messageID);
            }

            // Store the reply handler
            if (global.client.handleReply) {
                global.client.handleReply.push({
                    name: this.config.name,
                    author: senderID,
                    messageID: info.messageID,
                    ID: ID      
                });
                console.log(chalk.green(`✓ Stored ${ID.length} available groups for user ${senderID}`));
            }
        }, messageID);

    } catch (error) {
        console.error("Error getting thread list:", error);
        return api.sendMessage(`❌ Error retrieving groups: ${error.message || error}`, threadID, messageID);
    }
}