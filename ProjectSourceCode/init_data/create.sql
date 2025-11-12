CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS scoreboard (
    id SERIAL PRIMARY KEY,
    user_id INT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    score INT,
    username VARCHAR(100),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS users_to_scoreboard (
    user_id INT,
    scoreboard_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (scoreboard_id) REFERENCES scoreboard(id)
);

CREATE TABLE IF NOT EXISTS friends(
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS challenge(
    id SERIAL PRIMARY KEY,
    word VARCHAR(5) NOT NULL,
    username VARCHAR(100),
    FOREIGN KEY (username) REFERENCES users(username)
);

