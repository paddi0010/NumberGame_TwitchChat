const tmi  = require('tmi.js');
const config = require('./secret_data/config.json');
const channel = config.channels[0];

const client = new tmi.Client({
    options: {
        debug: true,
    },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: config.identify,

    channels: config.channels,
});

const minNumber = 1;
const maxNumber = 100;
let targetNumber;
let guesses = 0;
let gameRunning = false;

client.on('connected', (address ,port) => {
    console.log("Connected!", "Adresse: " + address + " Port: " + port);
    client.say(channel, `Willkommen zum Zahlenratespiel! 🔢 Tippt "!start" in den Chat, um zu beginnen.`);
});

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    if (message.toLowerCase() === '!start') {
        startNumberGame(channel);
    } else if (gameRunning && !isNaN(parseInt(message))) {
        const guess = parseInt(message);
        makeGuess(channel, guess);
    }
});
function startNumberGame(channel) {
    if (gameRunning) {
        client.say(channel, `Ein Spiel läuft bereits. Bitte beendet das aktuelle Spiel, bevor ihr ein neues startet.`);
        return;
    }

    targetNumber = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    guesses = 0;
    gameRunning = true;
    client.say(channel, `Das Spiel wurde gestartet! Ihr könnt jetzt eine Zahl zwischen ${minNumber} und ${maxNumber} raten.`);
}

function makeGuess(channel, guess) {
    guesses++;

    if (guess === targetNumber) {
        client.say(channel, `Glückwunsch! Ihr habt die Zahl ${targetNumber} in ${guesses} Versuchen erraten! ✅`);
        gameRunning = false;
    } else if (guess < targetNumber) {
        client.say(channel, `Die gescuhte Zahl ist größer als ${guess}. ↗️ Versucht es erneut`);
    } else {
        client.say(channel, `Die Zahl ist kleiner als ${guess}. ↘️ Versucht es erneut.`);
    }
}


client.connect().catch(console.error);