CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(20) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),

    -- Daily game stats
    daily_plays INT DEFAULT 0,
    daily_wins INT DEFAULT 0,
    daily_total_guesses INT DEFAULT 0,
    daily_total_time INT DEFAULT 0,
    daily_total_score INT DEFAULT 0,

    -- Challenge stats
    challenge_plays INT DEFAULT 0,
    challenge_wins INT DEFAULT 0
);


CREATE TABLE IF NOT EXISTS scoreboard (
    id SERIAL PRIMARY KEY,
    username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE,
    score INT,
    completed_word VARCHAR(5) -- Make sure last completed word matches current word so leaderboard is updated
);

CREATE TABLE IF NOT EXISTS friends(
    user_username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE,
    friend_username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE,
    user_wins INT DEFAULT 0,
    friend_wins INT DEFAULT 0,
    ties INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    PRIMARY KEY (user_username, friend_username)
);

CREATE TABLE IF NOT EXISTS challenge(
    id SERIAL PRIMARY KEY,
    user_word VARCHAR(5) NOT NULL,
    friend_word VARCHAR(5),
    user_username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
    friend_username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
    user_score INT,
    friend_score INT,
    user_start BIGINT,
    friend_start BIGINT,
    user_progress JSONB DEFAULT '[]',
    friend_progress JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending' 
    -- Status options: pending(friend must accept), play(both need to play), wating_friend(waiting for friend to finish), 
    -- waiting_user(waiting for user to finish)

);

CREATE TABLE IF NOT EXISTS daily_progress (
    username VARCHAR(20) PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    answer VARCHAR(5) NOT NULL,
    guesses JSONB DEFAULT '[]',
    row INT DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    start_time BIGINT,
    last_score INT
);

CREATE TABLE IF NOT EXISTS daily_word_cache (
    day VARCHAR(10) PRIMARY KEY,
    word VARCHAR(5) NOT NULL
);

