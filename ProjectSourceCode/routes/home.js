const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ---- SIMPLE helper that picks today's word using same logic as WordSelector ----
// pickWord logic identical to WordSelector
function todaysWord() {
    const wordsPath = path.join(__dirname, "../public/resources/words.txt");
    const words = fs.readFileSync(wordsPath, "utf8")
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);

        // Force America/Denver timezone
    const now = new Date().toLocaleString("en-US", { timeZone: "America/Denver" });
    const date = new Date(now);

    const key = `${date.getFullYear()}-${
        String(date.getMonth() + 1).padStart(2, '0')}-${
        String(date.getDate()).padStart(2, '0')}`;

    // identical FNV-1a hash
    let h = 0x811c9dc5 >>> 0;
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }

    // FIX: parentheses
    const index = (h >>> 0) % words.length;

    return words[index];
}


// --------------------- GET /home ---------------------
router.get('/home', (req, res) => {
    const user = req.session.user;
    if (!user) return res.redirect('/login');

    res.render("pages/home.hbs", {
        username: user.username
    });
});


// --------------------- GET /daily ---------------------
router.get('/daily', async (req, res) => {
    const db = req.app.get('db');
    const user = req.session.user;

    if (!user) return res.redirect('/login');

    const answer = todaysWord();
    const progressQuery = `
        SELECT *
        FROM daily_progress
        WHERE username = $1
    `;

    let saved = null;
    try {
        saved = await db.oneOrNone(progressQuery, [user.username]);
        if (saved && saved.answer !== answer) {
            // New day → reset
            saved = null;
            await db.none(
                'DELETE FROM daily_progress WHERE username = $1',
                [user.username]
            );
        }
    } catch (err) {
        console.error("Error loading progress:", err);
    }

    res.render("pages/daily.hbs", {
        answer, // may or may not use client-side
        dailyProgress: saved,
        username: user.username
    });
});

// --------------------- POST /daily/save ---------------------
router.post('/daily/save', async (req, res) => {
    const db = req.app.get('db');
    const user = req.session.user;
    if (!user) return res.status(401).send();

    const { guess, row, completed } = req.body;
    const answer = todaysWord();

    const query = `
        INSERT INTO daily_progress (username, answer, guesses, row, completed)
        VALUES ($1, $2, to_jsonb(ARRAY[$3]::text[]), $4, $5)
        ON CONFLICT (username)
        DO UPDATE SET
            guesses = daily_progress.guesses || to_jsonb($3::text),
            row = $4,
            completed = $5
    `;

    await db.none(query, [user.username, answer, guess, row, completed]);
    res.status(200).send();
});

// --------------------- POST /daily/result ---------------------
router.post('/daily/result', async (req, res) => {
    const db = req.app.get('db');
    const user = req.session.user;
    if (!user) return res.status(401).send();

    const { guesses, didWin } = req.body;

    const query = `
        UPDATE users
        SET 
            daily_plays = daily_plays + 1,
            daily_wins = daily_wins + CASE WHEN $1 THEN 1 ELSE 0 END,
            daily_total_guesses = daily_total_guesses + $2
        WHERE username = $3
    `;

    await db.none(query, [didWin, guesses, user.username]);

    res.json({ success: true });
});

module.exports = router;
