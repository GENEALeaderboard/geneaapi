-- inputcode
CREATE TABLE inputcode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT
) 

-- configs
CREATE TABLE configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    completion_code TEXT NOT NULL,
    fail_code TEXT NOT NULL,
    "type" TEXT NOT NULL,
    options TEXT NOT NULL,
    "question" TEXT
)

-- pages
CREATE TABLE pages (
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
    video2 INTEGER NOT NULL,
    studyid INTEGER NOT NULL,
    FOREIGN KEY (studyid) REFERENCES studies(id)
)

-- studies
CREATE TABLE studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    time_start TEXT NOT NULL,
    "type" TEXT NOT NULL,
    global_actions TEXT NOT NULL
, "file_created" TEXT, "prolific_sessionid" TEXT, "prolific_studyid" TEXT, "prolific_userid" TEXT, "completion_code" TEXT, "fail_code" TEXT)

-- submissions
CREATE TABLE "submissions" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    teamname VARCHAR(255) NOT NULL,
    "teamid" CHAR(24) NOT NULL
, "status" TEXT DEFAULT 'null')

-- systems
CREATE TABLE "systems" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(255)
, submissionid INTEGER)

-- videos
CREATE TABLE "videos" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inputcode VARCHAR(255) NOT NULL,
    systemname VARCHAR(255),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    path TEXT NOT NULL,
		url TEXT NOT NULL,
    systemid CHAR(24) NOT NULL
)

-- users
CREATE TABLE "users" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NULL,
  avatar TEXT,
  exp TIMESTAMP NULL,
 githubid INTEGER)
