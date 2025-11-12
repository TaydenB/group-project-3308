const express = require('express');
const router = express.Router();


router.get('/scoreboard', async (req, res, next) => {
    try {
        const db = req.app.get('db');
        const rows = await db.any(
            `
            SELECT s.username, s.score
            FROM scoreboard AS s 
                COALESCE(u.first_name, s.first_name) AS first_name,
                COALESCE(u.last_name,  s.last_name)  AS last_name
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

module.exports = router;