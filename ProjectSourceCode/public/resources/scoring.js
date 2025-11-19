const START_SCORE = 1000;
const TIME_LIMIT_MS = 5 * 60 * 1000; // 5 minutes in ms for time allotted

let guessesUsed = 0;
let gameOver = false;
let score = 0;

/* timer state */
let startTime = Date.now();
let timerInterval = setInterval(updateTimer, 1000); //update every second

function gettime(){
    return Date.now() //gets local time
}

function timer(){
    if(gameOver){
        clearInterval(TimeInterval); //game over finish game quit
        return;
    }

    const elapsed = getElapsedMs();
    let remaining = TIME_LIMIT_MS - elapsed; //remaining time in the game

    if(remaining <= 0){ //if remaining time is <= 0 game is over
        remaining = 0;
        score = 0;
        gameOver = true;
        clearInterval(timerInterval);
    }

    const totalSeconds = Math.floor(remaining / 1000); //remaining time in seconds
    const minutes = Math.floor(totalSeconds / 60); //remaining time in min
    const seconds = totalSeconds % 60; //remaining time in seconds but now can be used with min

    const timerElem = document.getElementById("timer");
    if (timerElem) {
        timerElem.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`; //text for timer
    }
}