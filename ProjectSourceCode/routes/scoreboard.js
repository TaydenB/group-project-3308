const express = require('express');
const router = express.Router();


router.get('/scoreboard', async (req, res, next) => {
    try {
        const db = req.app.get('db');
        const rows = await db.any(
            `
            SELECT s.username, s.score
            FROM scoreboard AS s 
            LEFT JOIN users u ON u.username = s.username
            ORDER BY s.score DESC, s.username ASC
            LIMIT 100
            `
        );
        res.render('pages/scoreboardPage.hbs', { entries: rows, active: {scoreboard: true} });

    } catch (err) {
        next(err)
    };
});
router.get('/api/scoreboard', async (req, res) => {
  try {
        const db = req.app.get('db');
        const entries = await db.any(
            `
            SELECT s.username, s.score
            FROM scoreboard AS s 
            LEFT JOIN users u ON u.username = s.username
            ORDER BY s.score DESC, s.username ASC
            LIMIT 100
            `
        );
        res.json(entries);

    } catch (err) {
        next(err)
    };
  
});
router.post('/scoreboard', async (req, res, next) => {
    try {
        const db = req.app.get('db');

        // Get username from session (adjust to your session shape)
        const username = req.session.user?.username;
        const { score, answer } = req.body;

        if (!username) {
            return res.status(401).json({ error: 'Not logged in' });
        }

        const numericScore = Number(score);
        if (Number.isNaN(numericScore)) {
            return res.status(400).json({ error: 'Invalid score' });
        }

        await db.none(
            `INSERT INTO scoreboard (username, score, completed_word) VALUES ($1, $2, $3)`,
            [username, numericScore, answer]
        );

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;