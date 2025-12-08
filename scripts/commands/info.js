module.exports.config = {
  name: "admin",
  version: "1.0.0",
  permission: 0,
  credits: "Renz",
  prefix: true,
  description: "",
  category: "prefix",
  usages: "",
  cooldowns: 5,
  dependencies: 
{
  "request":"",
  "fs-extra":"",
  "axios":""
}
};
module.exports.run = async function({ api,event,args,client,Users,Threads,__GLOBAL,Currencies }) {
const axios = global.nodemodule["axios"];
const request = global.nodemodule["request"];
const fs = global.nodemodule["fs-extra"];
const time = process.uptime(),
  hours = Math.floor(time / (60 * 60)),
  minutes = Math.floor((time % (60 * 60)) / 60),
  seconds = Math.floor(time % 60);
const moment = require("moment-timezone");
var juswa = moment.tz("Asia/Manila").format("『D/MM/YYYY』 【hh:mm:ss】");

var callback = () => api.sendMessage({body:`
🌐 𝗔𝗗𝗠𝗜𝗡 𝗜𝗡𝗙𝗢 ━━━━━━━━━━━━━━━━

𝗡𝗮𝗺𝗲: 𝗧𝗲𝗿𝗲𝗻𝗰𝗲
𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸: 𝗧𝗲𝗿𝗲𝗻𝗰𝗲 𝗦𝗶𝗺𝗯𝗿𝗲
𝗥𝗲𝗹𝗶𝗴𝗶𝗼𝗻: 𝗜𝗚𝗟𝗘𝗦𝗜𝗔 𝗡𝗜 𝗖𝗥𝗜𝗦𝗧𝗢 (𝗜𝗡𝗖)
𝗣𝗲𝗿𝗺𝗮𝗻𝗲𝗻𝘁 𝗔𝗱𝗱𝗿𝗲𝘀𝘀: 𝗖𝗮𝗺𝗶𝗹𝗶𝗻𝗴, 𝗧𝗮𝗿𝗹𝗮𝗰
𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗔𝗱𝗱𝗿𝗲𝘀𝘀: 𝗟𝗮𝘀𝗼𝗻𝗴, 𝗖𝗮𝗺𝗶𝗹𝗶𝗻𝗴
𝗚𝗲𝗻𝗱𝗲𝗿: 𝗠𝗮𝗹𝗲
𝗔𝗴𝗲: 𝟭𝟳+
𝗥𝗲𝗹𝗮𝘁𝗶𝗼𝗻𝘀𝗵𝗶𝗽: 𝗖𝗼𝗺𝗽𝗹𝗶𝗰𝗮𝘁𝗲𝗱
𝗪𝗼𝗿𝗸: 𝗦𝘁𝘂𝗱𝗲𝗻𝘁
✉️ 𝗚𝗺𝗮𝗶𝗹: terencesimbre075@gmail.com
📨 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺: t.me/r3nz75
📘 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞: 100073299970612

━━━━━━━━━━━━━━━━━━━━━━ 🌐`,attachment: fs.createReadStream(__dirname + "/cache/1.png")}, event.threadID, () => 
  fs.unlinkSync(__dirname + "/cache/1.png"));  
    return request(encodeURI(`https://graph.facebook.com/100073299970612/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)).pipe(
fs.createWriteStream(__dirname+'/cache/1.png')).on('close',() => callback());
 };