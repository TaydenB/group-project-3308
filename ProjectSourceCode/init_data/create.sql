CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE IF NOT EXITST scoreboard (
    scoreboard_id INT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    score INT,
    FOREIGN KEY(username) REFERENCES users(username)
);

CREATE TABLE IF NOT EXIST users_to_scoreboard (
    user_id INT,
    scoreboard_id INT;
)



