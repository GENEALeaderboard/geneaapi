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

-- ============================================================
-- Seamless Human-Likeness: per-type inputcodes
-- ============================================================
-- Add a `type` column so each video-type category owns its own set of
-- inputcodes. The existing single row keeps its codes and is tagged
-- 'origin' via the DEFAULT, so existing callers continue to work.
ALTER TABLE inputcode ADD COLUMN type TEXT NOT NULL DEFAULT 'origin';

-- Seed an empty row for the new seamless category. Admins populate it
-- via the Input Codes admin page after selecting the type.
INSERT INTO inputcode (type, code) VALUES ('seamless-origin-humanlikeness', '');

-- ============================================================
-- Seamless Human-Likeness: separate systems and attention-check pools
-- ============================================================
-- A `category` column on `systems` and `attentioncheck` discriminates the
-- video-pool the row belongs to. Existing rows default to 'origin', so the
-- legacy pairwise/mismatch flows keep working untouched.
ALTER TABLE systems ADD COLUMN category TEXT NOT NULL DEFAULT 'origin';
ALTER TABLE attentioncheck ADD COLUMN category TEXT NOT NULL DEFAULT 'origin';
