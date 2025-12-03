export function createWordGame(config) {
    const rows = document.querySelectorAll("#game-board .row");
    let selected_row = 0;
    let tile = 0;
    let answer = null;
    let num_guesses = 0;
    const max_tiles = 5;
    let startTime = Date.now();
    let elapsedTime = 0;
    let timerInterval = null;
    const max_time = 300;
    let submitLock = false;
    window.inputLocked = false;

    async function run() {
        answer = await config.getAnswer(); // Mode decides how to get answer
        if (config.restore) {
            const restored = await config.restore(rows);
            if (restored) {
                let guesses = restored.guesses || guesses;
                selected_row = guesses.length;
                num_guesses = guesses.length;

                if (restored.completed){
                    window.inputLocked = true;
                    config.showScoreboard(restored.last_score);
                }

                for(let i = 0; i < guesses.length; i++){
                    colorRow(guesses[i], rows[i]);
                }
                
                startTime = restored.start_time || Date.now();
                if(!restored.completed){
                    updateTimerUI(Math.floor((Date.now() - startTime) / 1000));
                }
                //elapsedTime = restored.elapsed || 0;
                
                
            }
        }
        let word = "";
        for (let i = 0; i < max_tiles; i++) word += rows[Math.max(selected_row-1, 0)].children[i].textContent;
        word = word.toLowerCase();
        if(!(word === answer || num_guesses === 6)){
            startTimer();
        }
        
    }

    run();

    // Timer functions:
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            if(elapsedTime >= max_time){
                elapsedTime = max_time;
                updateTimerUI(elapsedTime);
                showMessage(`Time is up! Word was ${answer}`);
                window.inputLocked = true;
                stopTimer();
                config.finish(false, num_guesses, calculateScore(false), elapsedTime);
                return;
            }
            updateTimerUI(elapsedTime);
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function updateTimerUI(sec) {
        const timerDisplay = document.getElementById("timer");
        if (!timerDisplay) return;

        const minutes = Math.floor(sec / 60);
        const seconds = sec % 60;

        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    // ----- KEYBOARD EVENTS -----
    document.querySelectorAll(".keyboard-key").forEach(key => {
        key.addEventListener("click", () => addLetter(key.textContent.trim()));
    });
    document.querySelector(".keyboard-key-delete").addEventListener("click", deleteLetter);
    document.querySelector(".keyboard-key-enter").addEventListener("click", submitWord);

    // Physical Keyboard
    document.addEventListener("keydown", (e) => {
    if (window.inputLocked) return;

    const key = e.key.toLowerCase();

    if (/^[a-z]$/.test(key)) {
        addLetter(key.toUpperCase());
    }
    else if (key === "backspace") {
        deleteLetter();
    }
    else if (key === "enter") {
        submitWord();
    }
});
    // ----- FUNCTIONS -----
    function addLetter(letter) {
        if (window.inputLocked) return;
        if (tile < max_tiles) {
            rows[selected_row].children[tile].textContent = letter;
            tile++;
        }
    }

    function deleteLetter() {
        if (window.inputLocked) return;
        if (tile > 0) {
            tile--;
            rows[selected_row].children[tile].textContent = "";
        }
    }

    function showMessage(message) {
        const msg = document.getElementById("message");
        msg.textContent = message;
        msg.classList.add("show");
        setTimeout(() => msg.classList.remove("show"), 1500);
    }

    async function submitWord() {
        if (submitLock) return;
        submitLock = true;
        setTimeout(() => submitLock = false, 50);
        if (window.inputLocked) return;
        if (num_guesses >= 6) return showMessage("No more guesses!");
        if (tile !== max_tiles) return showMessage("Not 5-letters!");

        let word = "";
        for (let i = 0; i < max_tiles; i++) word += rows[selected_row].children[i].textContent;
        word = word.toLowerCase();
        console.log("word", word);

        if (!sowpods.includes(word)) return showMessage("Not a word!");

        num_guesses++;
        colorRow(word, rows[selected_row]);

        // Mode chooses how to save
        await config.saveProgress(word, selected_row, (word === answer || num_guesses === 6), startTime);

        if (word === answer) {
            showMessage("Correct!");
            window.inputLocked = true;
            stopTimer();
            return config.finish(true, num_guesses, calculateScore(true), elapsedTime, answer);
        }
        if (num_guesses === 6) {
            showMessage(`Word is ${answer}`);
            window.inputLocked = true;
            stopTimer();
            return config.finish(false, num_guesses, calculateScore(false), elapsedTime, answer);
        }

        selected_row++;
        tile = 0;
    }
    function calculateScore(correct){
        let score = 1000;
        const deductions = [0, 25, 75, 175, 375, 490];
        const pointsPerMinute = 100;
        const minWinScore = 50;
        const loseScore = 10;

        if(!correct){
            return loseScore;
        }

        for(let i = 0; i < num_guesses; i++){
            score -= deductions[i];
        }

        const minutes = Math.floor(elapsedTime / 60);

        score -= pointsPerMinute * minutes;

        console.log(score);

        return Math.max(score, minWinScore);
    }
    function colorRow(word, row) {
        const result = Array(5).fill('absent');
        const wordArr = word.split('');
        const answerArr = answer.split('');

        for (let i = 0; i < max_tiles; i++) {
            if (wordArr[i] === answerArr[i]) {
                result[i] = 'correct';
                answerArr[i] = null;
                wordArr[i] = null;
            }
        }
        for (let i = 0; i < max_tiles; i++) {
            if (wordArr[i] !== null) {
                let idx = answerArr.indexOf(wordArr[i]);
                if (idx !== -1) {
                    result[i] = 'present';
                    answerArr[idx] = null;
                }
            }
        }
        row.querySelectorAll(".tile").forEach((tile, i) => {
            tile.classList.add(result[i]);
        });

        // Color keyboard
        word.split('').forEach((letter, i) => {
            const key = document.querySelector(`.keyboard-key[data-key="${letter.toUpperCase()}"]`);
            if (!key) return;

            // Prevent downgrading keys
            if (result[i] === "correct" ||
                (result[i] === "present" && !key.classList.contains("correct")) ||
                (result[i] === "absent" && !key.classList.contains("correct") && !key.classList.contains("present"))) {

                key.classList.remove("correct", "present", "absent");
                key.classList.add(result[i]);
            }
        });
    }
}
