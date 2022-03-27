const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

let game = {};

function ran_divider(num) {
  let dividers = [];

  for (let i = 0; i < num / 2; i++) {
    if (num % i == 0) dividers.push(i);
  }

  return dividers[Math.floor(Math.random() * dividers.length)];
}

function generate_problem(chat_id, type, difficulty) {
  let min;
  let max;

  if (difficulty == "easy") {
    min = 1;
    max = 100;
  }

  if (difficulty == "intermediate") {
    min = 10;
    max = 1000;
  }

  if (difficulty == "extreme") {
    min = 1000;
    max = 10000;
  }

  let num1 = Math.floor(Math.random() * max) + min;
  let num2 = Math.floor(Math.random() * max) + min;
  let question;
  let answer;

  if (type == "additions") {
    question = num1 + " + " + num2;
    answer = num1 + num2;
  } else if (type == "subtractions") {
    question = num1 + " - " + num2;
    answer = num1 - num2;
  } else if (type == "multiplications") {
    question = num1 + " * " + num2;
    answer = num1 * num2;
  } else if (type == "divisions") {
    num2 = ran_divider(num1);
    question = num1 + " / " + num2;
    answer = num1 / num2;
  }

  game[chat_id]["question"] = question;
  game[chat_id]["answer"] = answer;
  return question;
}

bot.on("polling_error", console.log);

bot.onText(/\/start/, (msg) => {
  let message = "Hello " + msg.from.first_name + "! Welcome to the math teacher bot, choose an activity you want to practise: \n➕Additions\n➖Subtractions\n✖️Multiplications\n➗Divisions";

  bot.sendMessage(msg.chat.id, message, {
    reply_markup: {
      keyboard: [["➕Additions"], ["➖Subtractions"], ["✖️Multiplications"], ["➗Divisions"]],
    },
  });
});

bot.onText(/\/stop/, (msg) => {
  let chat_id = msg.chat.id;
  let score = game[chat_id]["score"];
  let attempts = game[chat_id]["attempts"];
  let percent = (score / attempts) * 100;
  let message = "The game is stopped.\nYour score is: " + score + "/" + attempts + " " + percent + "% ❇️❇️❇️";

  bot.sendMessage(msg.chat.id, message);

  delete game[chat_id];
});

bot.on("message", (msg) => {
  let chat_id = msg.chat.id;

  if (msg.text == "/start" || msg.text == "/stop") return;

  if (!game.hasOwnProperty(chat_id)) {
    if (msg.text === "➕Additions") {
      game[chat_id] = {
        score: 0,
        attempts: 0,
        type: "additions",
        difficulty: "",
        question: "",
        answer: "",
      };
    } else if (msg.text === "➖Subtractions") {
      game[chat_id] = {
        score: 0,
        attempts: 0,
        type: "subtractions",
        difficulty: "",
        question: "",
        answer: "",
      };
    } else if (msg.text === "✖️Multiplications") {
      game[chat_id] = {
        score: 0,
        attempts: 0,
        type: "multiplications",
        difficulty: "",
        question: "",
        answer: "",
      };
    } else if (msg.text === "➗Divisions") {
      game[chat_id] = {
        score: 0,
        attempts: 0,
        type: "divisions",
        difficulty: "",
        question: "",
        answer: "",
      };
    }

    bot.sendMessage(chat_id, "Choose a level: \n👶Easy\n🧑‍🎓Intermediate\n🔥Extreme", {
      reply_markup: {
        keyboard: [["👶Easy"], ["🧑‍🎓Intermediate"], ["🔥Extreme"]],
      },
    });
  } else if (game[chat_id]["type"] !== "" && game[chat_id]["difficulty"] === "") {
    if (msg.text === "👶Easy") {
      game[chat_id]["difficulty"] = "easy";
    } else if (msg.text === "🧑‍🎓Intermediate") {
      game[chat_id]["difficulty"] = "intermediate";
    } else if (msg.text === "🔥Extreme") {
      game[chat_id]["difficulty"] = "extreme";
    }

    let question = generate_problem(chat_id, game[chat_id]["type"], game[chat_id]["difficulty"]);

    bot.sendMessage(chat_id, question + " = ?");
  } else if (game[chat_id]["question"] !== "") {
    let user_answer = msg.text;
    let answer = game[chat_id]["answer"];
    let i = 0;

    if (answer != user_answer) {
      bot.sendMessage(chat_id, "❌ Wrong answer! The answer was: " + answer);
      game[chat_id]["question"] = "";
      game[chat_id]["answer"] = "";
      game[chat_id]["attempts"] += 1;
    } else {
      bot.sendMessage(chat_id, "✅ Correct answer!");
      game[chat_id]["question"] = "";
      game[chat_id]["answer"] = "";
      game[chat_id]["score"] += 1;
      game[chat_id]["attempts"] += 1;
    }

    let question = generate_problem(chat_id, game[chat_id]["type"], game[chat_id]["difficulty"]);

    bot.sendMessage(chat_id, question + " = ?");
  }
});
