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

//Variables
let minNumber = 1;
let maxNumber = 100;
let maxGameDuration = 1 * 60 * 1000; // 1 Minute
let targetNumber;
let guesses = 0;
let gameRunning = false;

client.on('connected', (address ,port) => {
    console.log("Connected!", "Adresse: " + address + " Port: " + port);
    client.say(channel, `Willkommen zum Zahlenratespiel! 🔢 Tippt "!start" in den Chat, um zu beginnen.`);
});

//Commands
client.on('message', (channel, tags, message, self) => {
    if (self) return;

    if (message.toLowerCase() === '!start') {
        startNumberGame(channel);
    } else if (gameRunning && !isNaN(parseInt(message))) {
        makeGuess(channel, message); 
    } else if (message.toLowerCase().startsWith('!setrange ')) {
        setRange(channel, message); 
    } else if (message.toLowerCase().startsWith('!guess ')) {
        makeGuess(channel, message.substring(7));
    } else if (message.toLowerCase().startsWith('!stop')) {
        stopGame(channel);
    } else if (message.toLowerCase().startsWith('!number')) {
        helpCommand(channel, message, tags);
    }
});


function startNumberGame(channel) {
    if (gameRunning) {
        client.say(channel, `Ein Spiel läuft bereits. ⚠️ Bitte beendet das aktuelle Spiel, bevor ihr ein neues startet.`);
        return;
    }

    gameStartTime = Date.now();

    targetNumber = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    guesses = 0;
    gameRunning = true;

    
    const remainingTimeInMinutes = Math.ceil(maxGameDuration / (1000 * 60));

    
    client.say(channel, `Das Spiel wurde gestartet! ✅ Ihr könnt jetzt eine Zahl zwischen ${minNumber} und ${maxNumber} raten. Ihr habt ca. ${remainingTimeInMinutes} Minuten Zeit. ⌛`);

    startGameTimer(channel);
}


function setRange(channel, message) {
    const args = message.split(' ');
    if (args.length === 3 && !isNaN(parseInt(args[1])) && !isNaN(parseInt(args[2]))) {
        minNumber = parseInt(args[1]);
        maxNumber = parseInt(args[2]);
        client.say(channel, `Neuer Zahlenbereich festgelegt: ${minNumber} bis ${maxNumber} ✅`);
    } else {
        client.say(channel, `Ungültige Verwendung! ⚠️ Verwendung: !setrange <mindestzahl> <höchstzahl>`);
    }
}


function makeGuess(channel, message) {
    if (!gameRunning) {
        client.say(channel, `Es läuft derzeit kein Spiel. ❌ Tippe "!start" in den Chat ein, um eines zu beginnen.`);
        return;
    }

    const guess = parseInt(message); // Die geratene Zahl aus der Nachricht extrahieren

    guesses++;

    if (isNaN(guess)) {
        client.say(channel, `Ungültige Verwendung! ⚠️ Verwendung: !guess <zahl>`);
        return;
    }

    if (guess === targetNumber) {
        client.say(channel, `Glückwunsch! Ihr habt die Zahl ${targetNumber} in ${guesses} Versuchen erraten! ✅`);
        gameRunning = false;
    } else if (guess < targetNumber) {
        client.say(channel, `Die gesuchte Zahl ist größer als ${guess}. ↗️ Versucht es erneut`);
    } else {
        client.say(channel, `Die Zahl ist kleiner als ${guess}. ↘️ Versucht es erneut.`);
    }
}


function stopGame(channel, manualStop = true) {
    if (!gameRunning) {
        client.say(channel, `Es läuft derzeit kein Spiel, das gestoppt werden kann. ❌`);
        return;
    }

    if (manualStop) {
        client.say(channel, `Das Spiel wurde gestoppt. ❌ Die gesuchte Zahl war ${targetNumber}. 🔢`);
    }

    gameRunning = false;
}

function helpCommand(channel, tags) {
    const message = `🔢 Zahlenspiel-Commands: !start, !stop, !setrange <mindestzahl> <höchstzahl> || ${tags.username} ||`;

    client.say(channel, message);
}

function startGameTimer(channel) {
   const timer = setTimeout (() => {
    if (gameRunning) {
        stopGame(channel, false);
        client.say(channel, `Die Spielzeit ist abgelaufen, das Spiel wurde beendet. ⌛❌`);
    }
   }, maxGameDuration);

   gameTimer = timer;
}

client.connect().catch(console.error);
