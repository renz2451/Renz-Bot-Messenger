module.exports.config = {
  name: "goodbye",
  eventType: ["log:unsubscribe"],
  version: "1.0.0",
  credits: "Nayan",
  description: "Goodbye notification when members leave",
};

module.exports.run = async function({ api, event, Users, Threads }) {
  // Don't notify if bot is kicked
  if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

  // Check if antiout is enabled for this thread
  let threadData = (await Threads.getData(event.threadID)).data || {};

  // Only send goodbye if antiout is OFF
  if (threadData.antiout == true) return;

  // Get user name
  const name = global.data.userName.get(event.logMessageData.leftParticipantFbId) || 
               await Users.getNameUser(event.logMessageData.leftParticipantFbId) || 
               "Someone";

  // Determine leave type
  const type = (event.author == event.logMessageData.leftParticipantFbId) ? 
               "left the group" : 
               "was removed by admin";

  // Customizable message - you can change this
  const goodbyeMessage = `👋 ${name} ${type}\n\nGoodbye!`;

  return api.sendMessage(goodbyeMessage, event.threadID);
}