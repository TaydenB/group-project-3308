export function createWordGame(config) {
    const rows = document.querySelectorAll("#game-board .row");
    let selected_row = 0;
    let tile = 0;
    let answer = null;
    let num_guesses = 0;
    const max_tiles = 5;
    window.inputLocked = false;

    async function run() {
        answer = await config.getAnswer(); // Mode decides how to get answer
        if (config.restore) {
            const restored = await config.restore(rows);
            if (restored) {
                let guesses = restored.guesses || guesses;
                selected_row = guesses.length;
                num_guesses = guesses.length;

                if (restored.completed) window.inputLocked = true;
                for(let i = 0; i < guesses.length; i++){
                    colorRow(guesses[i], rows[i]);
                }
                
            }
        }
    }

    run();

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
        console.log(rows);
        if (window.inputLocked) return;
        if (num_guesses >= 6) return showMessage("No more guesses!");
        if (tile !== max_tiles) return showMessage("Not 5-letters!");

        let word = "";
        for (let i = 0; i < max_tiles; i++) word += rows[selected_row].children[i].textContent;
        word = word.toLowerCase();

        if (!sowpods.includes(word)) return showMessage("Not a word!");

        num_guesses++;
        colorRow(word, rows[selected_row]);

        // Mode chooses how to save
        await config.saveProgress(word, selected_row, (word === answer || num_guesses === 6));

        if (word === answer) {
            showMessage("Correct!");
            window.inputLocked = true;
            return config.finish(true, num_guesses);
        }
        console.log(num_guesses);
        if (num_guesses === 6) {
            showMessage(`Word is ${answer}`);
            window.inputLocked = true;
            return config.finish(false, num_guesses);
        }

        selected_row++;
        tile = 0;
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
