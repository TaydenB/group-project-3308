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
        res.render('scoreboard', { scoreboard: rows });

    } catch (err) {
        next(err)
    };
});

router.post('/scoreboard', async (req, res, next) => {
    try {
        const db = req.app.get('db');

        // get username from session 
        const username = req.session.user?.username;
        const { score } = req.body;

        if (!username) {
            return res.status(401).json({ error: 'Not logged in' });
        }

        const numericScore = Number(score);
        if (Number.isNaN(numericScore)) {
            return res.status(400).json({ error: 'Invalid score' });
        }

        await db.none(
            `INSERT INTO scoreboard (username, score) VALUES ($1, $2)`,
            [username, numericScore]
        );

        
        res.status(200).json({ success: true });

    } catch (err) {
        next(err);
    };
});

module.exports = router;