CREATE TABLE inputcode (
    id CHAR(24) PRIMARY KEY,
    code TEXT NOT NULL
);
-- Accounts
CREATE TABLE "accounts" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    token_type VARCHAR(20) NOT NULL,
    providerAccountId VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    userId CHAR(24) NOT NULL,
    FOREIGN KEY (userId) REFERENCES "users"(id) ON DELETE CASCADE
) CREATE TABLE "users" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    verified BOOLEAN DEFAULT FALSE,
    emailVerified TIMESTAMP NULL
) CREATE TABLE sessions (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL,
    user_id CHAR(24) NOT NULL,
    expires DATETIME NOT NULL
) CREATE TABLE "systems" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(255)
);
CREATE TABLE "videos" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inputcode VARCHAR(255) NOT NULL,
    systemname VARCHAR(255),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    path TEXT NOT NULL,
    url TEXT NOT NULL,
    systemid CHAR(24) NOT NULL
);
CREATE TABLE "submission" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    teamname VARCHAR(255) NOT NULL,
    userid CHAR(24) NOT NULL
);
INSERT INTO "submission" (email, teamname, userid)
VALUES (
        'zeroyy@gmail.com',
        'Youngwoo Yoon',
        '66a1f25304700478c83db822'
    );
INSERT INTO "submission" (email, teamname, teamid)
VALUES (
        'hmthanhgm@gmail.com',
        'Thanh Hoang-Minh',
        'hmthanh'
    ),
    (
        'petsonalai@gmail.com',
        'Petsonal',
        'petsonal'
    ),
    (
        "zeroyy@gmail.com",
        "Youngwoo Yoon",
        "zeroyy"
    ),
    (
        'millionscopes@gmail.com',
        'MillionScope',
        'millionscope'
    );
