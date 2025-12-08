module.exports.config = {
    name: "autotime",
    version: "3.0.0",
    permission: 0,
    credits: "Nayan + ChatGPT",
    description: "Automatic hourly messages with on/off system",
    prefix: true,
    category: "system",
    usages: "/autotime on | off",
    cooldowns: 3
};

// Storage inside memory (NO EXTRA FILE)
global.autoTimeStatus = global.autoTimeStatus || {}; // { threadID: true/false }

const schedule = [
    { time: "12:00 AM", msg: ["It's 12 AM — midnight vibes 🌙"] },
    { time: "1:00 AM", msg: ["It's 1 AM — time to sleep 😴"] },
    { time: "2:00 AM", msg: ["It's 2 AM — don't stay up too late 😪"] },
    { time: "3:00 AM", msg: ["It's 3 AM — night owls still awake 👀"] },
    { time: "4:00 AM", msg: ["It's 4 AM — early birds or no sleep? 🤔"] },
    { time: "5:00 AM", msg: ["It's 5 AM — good morning for some, still night for others 😌"] },
    { time: "6:00 AM", msg: ["It's 6 AM — a fresh new day ☀️"] },
    { time: "7:00 AM", msg: ["It's 7 AM — wake up and shine ✨"] },
    { time: "8:00 AM", msg: ["It's 8 AM — breakfast time 🍳"] },
    { time: "9:00 AM", msg: ["It's 9 AM — stay productive 💼"] },
    { time: "10:00 AM", msg: ["It's 10 AM — keep going strong 💪"] },
    { time: "11:00 AM", msg: ["It's 11 AM — almost noon 🌤️"] },
    { time: "12:00 PM", msg: ["It's 12 PM — lunch time 🍽️"] },
    { time: "1:00 PM", msg: ["It's 1 PM — hope you're having a good day 😄"] },
    { time: "2:00 PM", msg: ["It's 2 PM — take a small break 🌿"] },
    { time: "3:00 PM", msg: ["It's 3 PM — afternoon vibes 😌"] },
    { time: "4:00 PM", msg: ["It's 4 PM — stay hydrated 💧"] },
    { time: "5:00 PM", msg: ["It's 5 PM — almost evening 🌇"] },
    { time: "6:00 PM", msg: ["It's 6 PM — have a relaxing evening ❤️"] },
    { time: "7:00 PM", msg: ["It's 7 PM — dinner time 🍜"] },
    { time: "8:00 PM", msg: ["It's 8 PM — relax and chill 😊"] },
    { time: "9:00 PM", msg: ["It's 9 PM — getting late 🌙"] },
    { time: "10:00 PM", msg: ["It's 10 PM — time to rest 😴"] },
    { time: "11:00 PM", msg: ["It's 11 PM — sleep well 😌"] }
];

module.exports.onLoad = function({ api }) {
    setInterval(() => {
        try {
            const now = new Date(Date.now() + 25200000); // UTC+7
            const currentTime = now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
            });

            const entry = schedule.find(item => item.time === currentTime);
            if (!entry) return;

            const randomMsg = entry.msg[Math.floor(Math.random() * entry.msg.length)];

            if (global.data && global.data.allThreadID) {
                global.data.allThreadID.forEach(threadID => {
                    if (global.autoTimeStatus[threadID] === true) {
                        api.sendMessage(randomMsg, threadID);
                    }
                });
            }

        } catch (err) {
            console.log("AutoTime Error:", err);
        }
    }, 1000);
};

module.exports.run = function({ api, event, args }) {
    const threadID = event.threadID;

    if (!args[0]) {
        return api.sendMessage(
            "Use:\n/autotime on  → Enable auto time messages\n/autotime off → Disable auto time messages",
            threadID
        );
    }

    const input = args[0].toLowerCase();

    if (input === "on") {
        global.autoTimeStatus[threadID] = true;
        return api.sendMessage("✅ AutoTime enabled for this chat.", threadID);
    }

    if (input === "off") {
        global.autoTimeStatus[threadID] = false;
        return api.sendMessage("❌ AutoTime disabled for this chat.", threadID);
    }

    return api.sendMessage("Invalid option. Use /autotime on or /autotime off.", threadID);
};