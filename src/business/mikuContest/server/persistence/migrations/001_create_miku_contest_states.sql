CREATE TABLE IF NOT EXISTS miku_contest_configs (
  contest_id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS miku_contest_submissions (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  serial_no TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_nickname TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  tags JSONB NOT NULL,
  content JSONB NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS miku_contest_votes (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  voted_at TEXT NOT NULL,
  day_key TEXT NOT NULL,
  device_id TEXT,
  ip TEXT
);

CREATE TABLE IF NOT EXISTS miku_contest_notices (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS miku_contest_voter_restrictions (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_miku_contest_submissions_contest_id ON miku_contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_miku_contest_votes_contest_id ON miku_contest_votes(contest_id);
CREATE INDEX IF NOT EXISTS idx_miku_contest_votes_submission_id ON miku_contest_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_miku_contest_notices_contest_id ON miku_contest_notices(contest_id);
CREATE INDEX IF NOT EXISTS idx_miku_contest_voter_restrictions_contest_id ON miku_contest_voter_restrictions(contest_id);
