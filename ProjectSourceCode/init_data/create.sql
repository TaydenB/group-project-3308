CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(100) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE IF NOT EXITST scoreboard (
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    score INT,
    FOREIGN KEY(username) REFERENCES users(username)
);

