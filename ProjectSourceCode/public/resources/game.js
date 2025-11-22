document.addEventListener("DOMContentLoaded", () => {

    /*Select the Tiles*/
    import("./hash.js").then(({ WordSelector }) => {

        const rows = document.querySelectorAll("#game-board .row");
        let selected_row = 0;
        let tile = 0;
        let answer = null;
        let max_tiles = 5;
        let guesses = 0;

        // ----- RESTORE SAVED PROGRESS FROM SERVER -----
        const saved = window.dailyProgress;
        window.inputLocked = false;
        if (saved) {
            answer = saved.answer;
            guesses = saved.guesses.length;

            // Restore letters & colors for each existing guess
            saved.guesses.forEach((prevWord, r) => {
                for (let c = 0; c < prevWord.length; c++) {
                    rows[r].children[c].textContent = prevWord[c].toUpperCase();
                }
                colorRow(prevWord, rows[r]);
            });

            // NEXT row should ALWAYS be guesses.length
            selected_row = saved.guesses.length;
            tile = 0;

            // If already finished, lock input
            if (saved.completed) {
                window.inputLocked = true;
            }
        }


        // ----- GET TODAY’S WORD ONLY IF NO SAVED PROGRESS -----
        async function run() {
            if (saved && saved.answer) {
                answer = saved.answer;
                return;
            }

            const selector = new WordSelector('/resources/words.txt');
            answer = await selector.pickWord();
        }

        run();


        /* Keyboard setup */
        document.querySelectorAll(".keyboard-key").forEach(key => {
            key.addEventListener("click", () => {
                const letter = key.textContent.trim();
                addLetter(letter);
            });
        });

        document.querySelector(".keyboard-key-delete").addEventListener("click", deleteLetter);
        document.querySelector(".keyboard-key-enter").addEventListener("click", submitWord);


        /* FUNCTIONS */

        function addLetter(letter) {
            if (window.inputLocked) return;
            if (tile < max_tiles) {
                const current_tile = rows[selected_row].children[tile];
                current_tile.textContent = letter;
                tile++;
            }
        }

        function showMessage(message) {
            const msg = document.getElementById("message");
            msg.textContent = message;
            msg.classList.add("show");
            setTimeout(() => msg.classList.remove("show"), 1500);
        }

        function deleteLetter() {
            if (window.inputLocked) return;
            if (tile > 0) {
                tile--;
                rows[selected_row].children[tile].textContent = "";
            }
        }

        // ----- SEND FINAL RESULT TO SERVER -----
        async function sendDailyResult(guesses, didWin) {
            try {
                await fetch('/daily/result', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ guesses, didWin })
                });
            } catch (err) {
                console.error("Failed to send daily result:", err);
            }
        }


        async function submitWord() {
            if (window.inputLocked) return;

            if (guesses >= 6) {
                showMessage("No more guesses!");
                return;
            }

            if (tile != max_tiles) {
                showMessage("Not 5-letters!");
                return;
            }

            let word = "";
            for (let i = 0; i < max_tiles; i++) {
                word += rows[selected_row].children[i].textContent;
            }
            word = word.toLowerCase();

            if (!sowpods.includes(word)) {
                showMessage("Not a word!");
                return;
            }

            guesses++;

            colorRow(word, rows[selected_row]);

            // ----- ALWAYS SAVE PROGRESS -----
            await fetch('/daily/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guess: word,
                    row: selected_row,
                    completed: false
                })
            });

            // ----- WIN -----
            if (word === answer) {
                showMessage("Correct!");
                window.inputLocked = true;

                await sendDailyResult(guesses, true);   // <-- REQUIRED

                return;
            }

            // ----- LOSS -----
            if (guesses === 6) {
                showMessage(`Word is ${answer}`);
                window.inputLocked = true;

                await sendDailyResult(guesses, false);  // <-- REQUIRED

                return;
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
                    const idx = answerArr.indexOf(wordArr[i]);
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

    });
});
