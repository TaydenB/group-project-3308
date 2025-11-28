const express = require('express');
const router = express.Router();

// auth middleware
function auth(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}
router.use(auth);

/* ----------------------------------------
   GET /daily → load saved progress
----------------------------------------- */
router.get('/daily', async (req, res) => {
    const db = req.app.get('db');
    const username = req.session.user.username;

    const progress = await db.oneOrNone(
        `SELECT answer, guesses, row, completed 
         FROM daily_progress 
         WHERE username = $1`,
        [username]
    );

    res.render('pages/daily.hbs', {
        dailyProgress: progress ? {
            answer: progress.answer,
            guesses: progress.guesses,
            row: progress.row,
            completed: progress.completed
        } : null
    });
});

/* ----------------------------------------
   POST /daily/save → save each guess
----------------------------------------- */
router.post('/daily/save', async (req, res) => {
    console.log("saving");
    const db = req.app.get('db');
    const user = req.session.user;
    if (!user) return res.status(401).send();

    const { guess, row, completed } = req.body;
    const answer = todaysWord();

    const query = `
        INSERT INTO daily_progress (username, answer, guesses, row, completed)
        VALUES ($1, $2, to_jsonb(ARRAY[$3]), $4, $5)
        ON CONFLICT (username)
        DO UPDATE SET
            guesses = (
                CASE 
                    WHEN daily_progress.answer = $2 THEN daily_progress.guesses || to_jsonb($3)
                    ELSE to_jsonb(ARRAY[$3])
                END
            ),
            answer = $2,
            row = $4,
            completed = $5
    `;

    await db.none(query, [user.username, answer, guess, row, completed]);
    res.status(200).send();
});


/* POST /daily/result → update stats */
router.post('/daily/result', async (req, res) => {
    const db = req.app.get('db');
    const username = req.session.user.username;

    const { guesses, didWin } = req.body;

    const update = `
        UPDATE users
        SET
            daily_plays = daily_plays + 1,
            daily_wins = daily_wins + (CASE WHEN $1 THEN 1 ELSE 0 END),
            daily_total_guesses = daily_total_guesses + $2
        WHERE username = $3
    `;

    await db.none(update, [didWin, guesses, username]);

    res.json({ ok: true });
});

module.exports = router;
