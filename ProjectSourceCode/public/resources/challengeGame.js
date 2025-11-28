import { createWordGame } from "./gameEngine.js";

createWordGame({
    async getAnswer() {
        return document.getElementById('challenge-word').dataset.word.toLowerCase();
    },
    restore() { return null; }, 
    saveProgress() { },
    async finish(win) {
        await fetch('/profile/social/challenge/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                friendUsername: document.getElementById('friend-username').dataset.friend,
                score: win ? 100 : 0
            })
        });
    }
});
