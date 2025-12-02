import { createWordGame } from "./gameEngine.js";
import { WordSelector } from "./hash.js";

document.addEventListener("DOMContentLoaded", () => {
    createWordGame({
        async getAnswer() {
            if (window.dailyProgress?.answer) return window.dailyProgress.answer;
            const selector = new WordSelector('/resources/words.txt');
            return await selector.pickWord();
        },
        restore(rows) {
            if (!window.dailyProgress) return null;
            const saved = window.dailyProgress;

            saved.guesses.forEach((prevWord, r) => {
                // Restore letters
                for (let c = 0; c < prevWord.length; c++)
                    rows[r].children[c].textContent = prevWord[c].toUpperCase();

            });

            return saved;
        },
        async saveProgress(word, row, completed, startTime) {
            return fetch('/daily/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guess: word, row, completed, startTime })
            });
        },
        async finish(win, guesses, score, elapsedTime) {
            //
            await fetch('/daily/result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ didWin: win, guesses, score, elapsedTime })
            });

            // Update the scoreboard for wins only
            await fetch('/scoreboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score })
            });
            const modal = new bootstrap.Modal(document.getElementById('scoreboardModal'));
            modal.show();
        },
        showScoreboard(){
            const modal = new bootstrap.Modal(document.getElementById('scoreboardModal'));
            modal.show();
        }

    });
});
