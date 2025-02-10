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
-- submission
CREATE TABLE "submission" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    teamname VARCHAR(255) NOT NULL,
    userid CHAR(24) NOT NULL
);
-- comparisons
CREATE TABLE "pages" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    question TEXT NOT NULL,
    selected JSON NOT NULL,
    actions JSON NOT NULL,
    options JSON NOT NULL,
    system1 TEXT NOT NULL,
    system2 TEXT NOT NULL,
    video1 INTEGER NOT NULL,
    video2 INTEGER NOT NULL
);
-- 
CREATE VIEW "user_studies" AS SELECT * FROM studies s, configs c, pages p WHERE s.type = c.type and p.studyid = s.id;
