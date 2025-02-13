ALTER TABLE users
    RENAME TO users_new;
    
-- Copy data from the old table
INSERT INTO users (
        name,
        username,
        email,
        avatar,
        verified,
        emailVerified
    )
SELECT name,
    username,
    email,
    image as avatar,
    verified,
    emailVerified
FROM users_new;

DROP TABLE users_new;

-- Create systems table
INSERT INTO "systems" (name, description, type)
VALUES ('NA', 'Natural Mocap', 'groundtruth'),
    ('BA', 'baseline 1', 'baseline'),
    ('SA', 'System 1', 'system'),
    ('SB', 'Cite Graph 1', 'system');
