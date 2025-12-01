/*Select the Tiles*/
import { WordSelector } from "./hash.js";
const rows = document.querySelectorAll("#game-board .row");
let selected_row = 0;
let tile = 0;
let answer = null;
let max_tiles = 5;
let guesses = 0;
const START_SCORE = 1000;
const TIME_LIMIT_MS = 5 * 60 * 1000; // 5 minutes in ms 
let guessesUsed = 0;
let gameOver = false;
let score = 0;

/* TIMER STATE */
let startTime = Date.now();
let timerInterval = setInterval(updateTimer, 1000);
async function run() {
    const selector = new WordSelector('/resources/words.txt');
    answer = await selector.pickWord();
}
run();
/*Create the implementation for the keyboard*/
//for all keyboard-key classes
document.querySelectorAll(".keyboard-key").forEach(key => {
    //if you click on any of the keyboard buttons
    key.addEventListener("click", () => {
        //returns if game is over
        if (gameOver) return;
        //store the contents of the button in letter
        const letter = key.textContent.trim();
        //call addLetter function
        addLetter(letter);
    });
});

//for the delete key
document.querySelector(".keyboard-key-delete").addEventListener("click", () => {
    //returns if game is over
    if (gameOver) return;
    //call deleteLetter function
    deleteLetter();
});

//for the enter key
document.querySelector(".keyboard-key-enter").addEventListener("click", () => {
    //returns if game is over
    if (gameOver) return;
    //call submit word function
    submitWord();
});

/*Create the functions to make the keys function*/
//addLetter function that adds a letter into the tile
function addLetter(letter) {
    //if within the row
    if (tile < max_tiles) {
        //pick the correct tile
        const current_tile = rows[selected_row].children[tile];
        //put the letter in the tile
        current_tile.textContent = letter;
        //increment tile count
        tile++;
    }
}

function showMessage(message) {
    const msg = document.getElementById("message");
    msg.textContent = message;
    msg.classList.add("show");
    setTimeout(() => {
        msg.classList.remove("show");
    }, 1500);
}

//deleteLetter function that removes a letter from the tile
function deleteLetter() {
    //if there is a value to delete
    if (tile > 0) {
        //decrement the tile count
        tile--;
        //pick correct tile
        const current_tile = rows[selected_row].children[tile];
        //remove the letter from the tile
        current_tile.textContent = "";
    }
}

//submitWord function that enters the word
function submitWord() {
    if (guesses >= 6) {
        showMessage("No more guesses!");
        const finalScore = 0;
        endGame(finalScore);
        return;
    }
    //if not enough letters nothing happens
    if (tile != max_tiles) {
        showMessage("Not 5-letters!");
        return
    }
    if (answer == null) {
        run();
        console.log(answer);
    }

    //word variable to store values in tiles
    let word = "";
    //loop through tiles and store in variable word
    for (let i = 0; i < max_tiles; i++) {
        word += rows[selected_row].children[i].textContent;
    }
    word = word.toLowerCase();
    if (!sowpods.includes(word)) {
        showMessage("Not a word!");
        return;
    }
    guesses += 1;
    colorRow(word, rows[selected_row]);

    if (word === answer) {
        showMessage("Correct!");
        const elapsedMs = getElapsedMs();
        const finalScore = calculateScore(guesses, elapsedMs);
        endGame(finalScore);
        return;
    }

    if (guesses === 6) {
        showMessage(`Word is ${answer}`);
        const finalScore = 0;   // or use calculateScore if you want
        endGame(finalScore);
        return;
    }

    //change rows
    if (selected_row < 5) {
        //increment row
        selected_row++;
        //start on first tile again
        tile = 0;
    }
}

function colorRow(word, row) {
    const result = Array(5).fill('absent');
    const wordArr = word.split('');
    const answerArr = answer.split('');
    //greens
    for (let i = 0; i < max_tiles; i++) {
        if (wordArr[i] === answerArr[i]) {
            result[i] = 'correct';
            answerArr[i] = null;
            wordArr[i] = null;
        }
    }
    //yellows
    for (let i = 0; i < max_tiles; i++) {
        if (wordArr[i] !== null) {
            let idx = answerArr.indexOf(wordArr[i]);
            if (idx !== -1) {
                result[i] = 'present';
                answerArr[idx] = null;
            }
        }
    }
    const tiles = row.querySelectorAll(".tile");
    for (let i = 0; i < max_tiles; i++) {
        tiles[i].classList.add(result[i]);
    }
}


/*Time functions to calculate elapsed time  */
function getElapsedMs() {
    return Date.now() - startTime;
}

function updateTimer() {
    if (gameOver) {
        clearInterval(timerInterval);
        return;
    }

    const elapsed = getElapsedMs();
    let remaining = TIME_LIMIT_MS - elapsed;

    if (remaining <= 0) {
        remaining = 0;
        const finalScore = 0;  //time out at 0
        endGame(finalScore);
        return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const timerElem = document.getElementById("timer");
    if (timerElem) {
        timerElem.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}


/*All scoring functions*/
function calculateScore(guessesUsed, elapsedMs) {
    const base = START_SCORE; //starting score
    const guessesOverFirst = Math.max(0, guessesUsed - 1); //guess penalty amount of guesses
    const guessPenalty = guessesOverFirst * 100; //total guess penalty
    const elapsedSeconds = Math.floor(elapsedMs / 1000); //elapsed time
    const timePenalty = elapsedSeconds * 2; //penalty for time
    let finalScore = base - guessPenalty - timePenalty; //final score
    if (finalScore < 0) {
        finalScore = 0;
    }
    return finalScore;
}

function sendScoreToServer(score) {
    // This posts the score to the server.
    fetch('/scoreboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score })
    }).catch(err => {
        console.error('Failed to send score:', err);
    });
}

function endGame(finalScore) {
    if (gameOver) return;
    gameOver = true;

    score = finalScore;

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    sendScoreToServer(score);
}