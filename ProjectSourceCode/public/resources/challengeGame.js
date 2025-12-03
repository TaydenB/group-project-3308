import { createWordGame } from "./gameEngine.js";

createWordGame({
    async getAnswer() {
        return document.getElementById('challenge-word').dataset.word.toLowerCase();
    },
    restore(rows) {
        if (!window.challengeProgress) return null;
        const saved = window.challengeProgress;
        console.log(saved);
        saved.guesses.forEach((prevWord, r) => {
            // Restore letters
            for (let c = 0; c < prevWord.length; c++)
                rows[r].children[c].textContent = prevWord[c].toUpperCase();
        
        });

        return saved;
    },
    async saveProgress(word, row, completed, startTime) {
        return fetch('/profile/social/challenge/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guess: word, row, completed, friendUsername: document.getElementById('friend-username').dataset.friend, startTime})
        });
    },
    async finish(win, guesses, score) {
        document.getElementById('finalScore').textContent = score;   
        const modal = new bootstrap.Modal(document.getElementById('scoreModal'));
        modal.show();
        await fetch('/profile/social/challenge/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                friendUsername: document.getElementById('friend-username').dataset.friend,
                score: score
            })
        });

        
    },
    showScoreboard(){
        return;
    }
});
