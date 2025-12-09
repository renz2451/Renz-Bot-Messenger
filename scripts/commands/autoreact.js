const fs = require("fs-extra");
const axios = require("axios");

const stateFile = __dirname + "/autoreply_react_state.txt";
const memoryFile = __dirname + "/autoreply_memory.json";

if (!fs.existsSync(memoryFile)) fs.writeFileSync(memoryFile, "{}");

const random = arr => arr[Math.floor(Math.random() * arr.length)];


// === LOAD USER MEMORY ===
function loadMemory() {
    try {
        return JSON.parse(fs.readFileSync(memoryFile, "utf8"));
    } catch {
        return {};
    }
}

// === SAVE USER MEMORY ===
function saveMemory(mem) {
    fs.writeFileSync(memoryFile, JSON.stringify(mem, null, 2));
}



// === GENDER DETECTOR ===
function detectGender(name) {
    const n = name.toLowerCase();

    const femaleNames = [
        "anne","ana","marie","maria","rose","ella","angel","angelyn","samantha",
        "sara","sarah","joy","jen","jennifer","kath","kathryn","michelle",
        "ashley","nikki","nicole","bea","mary","princess","queen"
    ];

    const maleNames = [
        "john","mark","michael","josh","renz","renjie","james","carl","kyle",
        "jay","christian","ian","leo","lance","jason","gab","gabriel",
        "andrew","allan","alden","dominic","romeo"
    ];

    if (femaleNames.some(v => n.includes(v))) return "female";
    if (maleNames.some(v => n.includes(v))) return "male";

    return "unknown";
}



// === SMART EMOJI REACT ENGINE ===
async function getAIReact(message) {
    const msg = message.toLowerCase();

    if (/(love|miss|kilig|crush|sweet|mahal|landi)/.test(msg))
        return random(["😍","😳","😏","🥰"]);
    if (/(sad|lungkot|hurt|iyak|alone|sakit)/.test(msg))
        return random(["😢","😭","💔","🥺"]);
    if (/(galit|inis|pikon|bwisit)/.test(msg))
        return random(["😡","🤬","😤"]);
    if (/(haha|hehe|lol|lmao|joke)/.test(msg))
        return random(["😂","🤣"]);
    if (/(wtf|hala|omg|shock)/.test(msg))
        return random(["😳","😱"]);
    if (/(flex|achievement|proud)/.test(msg))
        return random(["😎","🔥"]);

    return random(["🙂","😬"]);
}



// === MAIN AI GENZ WITH MEMORY + GENDER ===
async function getAIReply(msg, name, userID) {
    try {
        const apiRes = await axios.get(
            "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json"
        );
        const base = apiRes.data.api;

        const memory = loadMemory();

        if (!memory[userID]) memory[userID] = {
            mood: "neutral",
            nickname: null,
            lastMsg: "",
            lastEmotion: "",
            vibe: "normal",
            gender: "unknown"
        };

        const userMem = memory[userID];

        // AUTO DETECT GENDER
        if (userMem.gender === "unknown") {
            userMem.gender = detectGender(name);
        }

        // DETECT EMOTION
        let emotion = "neutral";
        let vibe = userMem.vibe;

        const m = msg.toLowerCase();

        if (/(miss|love|crush|kilig|sweet)/.test(m)) {
            emotion = "romantic";
            vibe = "clingy";
        }
        else if (/(sad|hurt|pagod|tired|down)/.test(m)) {
            emotion = "sad";
            vibe = "comforting";
        }
        else if (/(bwisit|inis|galit)/.test(m)) {
            emotion = "angry";
            vibe = "sarcastic";
        }
        else if (/(haha|lol|lmao|joke)/.test(m)) {
            emotion = "funny";
            vibe = "playful";
        }

        // SPECIAL USER OVERRIDE
        if (name.toLowerCase() === "angelyn dela fuente") {
            vibe = "super-sweet";
        }

        // SAVE MEMORY
        userMem.lastMsg = msg;
        userMem.lastEmotion = emotion;
        userMem.vibe = vibe;
        saveMemory(memory);

        const prompt = `
You are a Gen-Z Taglish AI chatbot with MEMORY & GENDER-AWARE replies.
You remember the user’s vibe, emotion, and gender.

User name: ${name}
User ID: ${userID}
User gender: ${userMem.gender}

PAST MEMORY:
- Last message: ${userMem.lastMsg}
- Last emotion: ${userMem.lastEmotion}
- Current vibe: ${userMem.vibe}

RULES:
- Reply in Taglish only.
- NEVER use Ilokano unless THEY used it.

- GENDER RULES:
    * If male → chill, bro-type, playful but not malambing.
    * If female → softer, sweeter, more lambing.
    * If unknown → neutral Gen-Z tone.

- VIBE RULES:
    * clingy: sweet, soft, malambing
    * comforting: gentle, emotional support
    * sarcastic: witty, clapback
    * playful: kalog, makulit
    * super-sweet: extra lambing
    * normal: casual Taglish Gen-Z

- Keep it SHORT, NATURAL, HUMAN-like.

User message: "${msg}"
Generate your reply:`;

        const ai = await axios.get(
            `${base}/nayan/gpt3?prompt=${encodeURIComponent(prompt)}`
        );

        let reply = ai.data.response || "Wait, ano ulit sinabi mo?";

        if (Math.random() < 0.2) {
            reply += " " + random(["HAHA", "lol", "char", "tbh"]);
        }

        return reply;

    } catch (err) {
        console.log("Reply Error:", err);
        return "Naglag ako beh wait 😭";
    }
}



// === MODULE CONFIG ===
module.exports.config = {
    name: "autogenz",
    version: "15.1.0",
    permission: 0,
    credits: "ChatGPT + Nayan + Jantzy Upgrade",
    description: "Gen-Z Taglish AI with memory, gender, vibes & accurate reacts",
    prefix: true,
    category: "ai",
    usages: "[on/off]",
    cooldowns: 3
};

module.exports.languages = {
    en: {
        on: "🔥 AutoGenZ with MEMORY + GENDER is now ACTIVE!",
        off: "💤 AutoGenZ is OFF.",
        error: "Use: /autogenz on or /autogenz off"
    }
};



// === EVENT HANDLER ===
module.exports.handleEvent = async function ({ api, event, Users }) {

    if (!fs.existsSync(stateFile)) fs.writeFileSync(stateFile, "false");

    const enabled = fs.readFileSync(stateFile, "utf8");
    if (enabled !== "true") return;
    if (!event.body) return;

    const name = await Users.getNameUser(event.senderID);

    const emoji = await getAIReact(event.body);
    api.setMessageReaction(emoji, event.messageID, () => {}, true);

    const reply = await getAIReply(event.body, name, event.senderID);

    const delay = Math.min(2500, reply.length * 18);

    api.sendTypingIndicator(event.threadID);
    setTimeout(() => {
        api.sendMessage(reply, event.threadID, event.messageID);
    }, delay);
};



// === ON/OFF COMMAND ===
module.exports.start = async function ({ nayan, events, args, lang }) {

    if (args[0] === "on") {
        fs.writeFileSync(stateFile, "true");
        return nayan.sendMessage(lang("on"), events.threadID, events.messageID);
    }

    if (args[0] === "off") {
        fs.writeFileSync(stateFile, "false");
        return nayan.sendMessage(lang("off"), events.threadID, events.messageID);
    }

    return nayan.sendMessage(lang("error"), events.threadID, events.messageID);
};