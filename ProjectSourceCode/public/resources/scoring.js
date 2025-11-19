const START_SCORE = 1000;
const TIME_LIMIT_MS = 5 * 60 * 1000; // 5 minutes in ms for time allotted

let guessesUsed = 0;
let gameOver = false;
let score = 0;

/* TIMER STATE */
let startTime = Date.now();
let timerInterval = setInterval(updateTimer, 1000);

function gettime(){
    return Date.now() 
}

function timer(){
    if(gameOver){
        clearInterval(TimeInterval);
        return;
    }

    const elapsed = getElapsedMs();
    let remaining = TIME_LIMIT_MS - elapsed;

    if(remaining <= 0){

    }

}