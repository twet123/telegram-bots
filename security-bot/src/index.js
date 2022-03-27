const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const token = process.env.TOKEN;
const api_key = process.env.API_KEY;

const url_regex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;

const bot = new TelegramBot(token, { polling: true });

let reports = {};

bot.on("polling_error", console.log);

bot.on("message", (message) => {
  let chat_id = message.chat.id;
  let message_id = message.message_id;

  if (message.text == "!report") {
    let original_id = message.reply_to_message.message_id;
    let user_to_ban = message.reply_to_message.from.id;

    if (original_id) {
      console.log(reports);

      if (Object.keys(reports).length === 0 || !reports.hasOwnProperty(original_id)) {
        reports[original_id] = [];
        reports[original_id].push(message.from.id);
      } else if (reports[original_id].length == 3 && !reports[original_id].includes(message.from.id)) {
        bot.deleteMessage(chat_id, original_id);
        bot.banChatMember(chat_id, user_to_ban);
        delete reports.original_id;
      } else if (reports[original_id].length > 0 && !reports[original_id].includes(message.from.id)) {
        reports[original_id].push(message.from.id);
      }
    }
  } else {
    let urls = message.text.match(url_regex);

    if (urls && urls.length > 0) {
      let threatEntitiesObj = [];
      urls.map((el) =>
        threatEntitiesObj.push({
          url: el,
        })
      );

      axios({
        method: "post",
        url: "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + api_key,
        data: {
          client: {
            clientId: "Security Bot",
            clientVersion: "1.5.2",
          },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: threatEntitiesObj,
          },
        },
      }).then((response) => {
        if (response.data && Object.keys(response.data).length === 0 && Object.getPrototypeOf(response.data) === Object.prototype) bot.sendMessage(chat_id, "The links are safe.");
        else {
          bot.deleteMessage(chat_id, message_id);
          bot.sendMessage(chat_id, "The links are suspicious.");
        }
      });
    }
  }
});
