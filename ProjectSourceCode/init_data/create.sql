CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(20) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS scoreboard (
    id SERIAL PRIMARY KEY,
    username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE,
    score INT
);

CREATE TABLE IF NOT EXISTS friends(
    user_username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE,
    friend_username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    PRIMARY KEY (user_username, friend_username)
);

-- CREATE TABLE IF NOT EXISTS challenge(
--     id SERIAL PRIMARY KEY,
--     word VARCHAR(5) NOT NULL,
--     username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE
-- );

CREATE TABLE IF NOT EXISTS challenge(
    id SERIAL PRIMARY KEY,
    user_word VARCHAR(5) NOT NULL,
    friend_word VARCHAR(5),
    user_username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
    friend_username VARCHAR(20) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
    user_score INT,
    friend_score INT,
    status VARCHAR(20) DEFAULT 'pending' 
    -- Status options: pending(friend must accept), play(both need to play), wating_friend(waiting for friend to finish), 
    -- waiting_user(waiting for user to finish)

);
