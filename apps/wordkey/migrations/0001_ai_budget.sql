CREATE TABLE IF NOT EXISTS ai_budget (
  month TEXT PRIMARY KEY,
  reserved_fen INTEGER NOT NULL CHECK (reserved_fen >= 0 AND reserved_fen <= 3000),
  calls INTEGER NOT NULL DEFAULT 0
);
