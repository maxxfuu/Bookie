-- Bookie SQLite schema
--
-- Mirrors the frontend data model in lib/types.ts one-to-one:
--   Account      -> accounts (+ account_addons for the addons array)
--   Transaction  -> transactions (single event ledger, one time series)
--   Expense      -> expenses
--   Note         -> notes
--   TaxYearSettings (Record<year, {treatment}>) -> tax_year_settings
--   taxLocationId (store-wide setting)          -> settings key/value
--
-- Conventions:
--   * ids are TEXT (crypto.randomUUID() from the app), matching the store.
--   * Dates are ISO "YYYY-MM-DD" TEXT, same as the frontend; enforced by GLOB.
--   * Money is REAL in the account currency, matching the frontend's numbers.
--   * Booleans are INTEGER 0/1 with CHECK constraints.
--   * String-union types in lib/types.ts become CHECK (col IN (...)) — keep
--     these lists in sync with FIRM_NAMES, FeeType, Phase, TaxCategory, etc.
--
-- Everything is IF NOT EXISTS so `bun run db:migrate` is idempotent.

-- Static account fields captured in the Add modal (lib/types.ts Account).
-- Everything after purchase lives in `transactions`.
CREATE TABLE IF NOT EXISTS accounts (
  id                TEXT PRIMARY KEY,
  firm              TEXT NOT NULL CHECK (firm IN (
                      'Topstep', 'Apex Trader Funding', 'My Funded Futures',
                      'FundedNext', 'TradeDay', 'Tradeify', 'Earn2Trade',
                      'Lucid Trading', 'AquaFutures')),
  nickname          TEXT NOT NULL,
  -- Firm-issued identifier; '' when the user hasn't provided it. The paste
  -- importer backfills this with the payout table's Account ID.
  external_id       TEXT NOT NULL DEFAULT '',
  account_size      INTEGER NOT NULL CHECK (account_size > 0),
  program_type      TEXT NOT NULL CHECK (program_type IN ('one-step', 'two-step', 'instant')),
  start_date        TEXT NOT NULL CHECK (start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  currency          TEXT NOT NULL DEFAULT 'USD',
  list_price        REAL NOT NULL CHECK (list_price >= 0),
  discount_code     TEXT NOT NULL DEFAULT '',
  discount          REAL NOT NULL DEFAULT 0 CHECK (discount >= 0),
  amount_paid       REAL NOT NULL CHECK (amount_paid >= 0),
  refundable        INTEGER NOT NULL DEFAULT 0 CHECK (refundable IN (0, 1)),
  refund_condition  TEXT NOT NULL DEFAULT '',
  recurring_fee     REAL NOT NULL DEFAULT 0 CHECK (recurring_fee >= 0),
  recurring_cadence TEXT NOT NULL DEFAULT 'none' CHECK (recurring_cadence IN ('none', 'monthly')),

  -- AccountRules (1:1 with the account, so embedded; feeds the firm radar)
  rule_profit_target_pct        REAL NOT NULL DEFAULT 0 CHECK (rule_profit_target_pct >= 0),
  rule_max_drawdown_pct         REAL NOT NULL DEFAULT 0 CHECK (rule_max_drawdown_pct >= 0),
  rule_daily_drawdown_pct       REAL NOT NULL DEFAULT 0 CHECK (rule_daily_drawdown_pct >= 0),
  rule_min_trading_days         INTEGER NOT NULL DEFAULT 0 CHECK (rule_min_trading_days >= 0),
  rule_payout_frequency_days    INTEGER NOT NULL DEFAULT 0 CHECK (rule_payout_frequency_days >= 0),
  rule_consistency_strictness   INTEGER NOT NULL DEFAULT 1 CHECK (rule_consistency_strictness BETWEEN 1 AND 10),

  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_accounts_firm ON accounts (firm);
CREATE INDEX IF NOT EXISTS idx_accounts_external_id ON accounts (external_id) WHERE external_id != '';

-- Account.addons: add-ons bought with the account (name + cost).
CREATE TABLE IF NOT EXISTS account_addons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id  TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  cost        REAL NOT NULL DEFAULT 0 CHECK (cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_account_addons_account ON account_addons (account_id);

-- The single event ledger (lib/types.ts Transaction). Fees, resets,
-- activations, recurring accruals, payouts, refunds, and zero-dollar
-- phase-change rows all live here so the dashboard reads one time series.
CREATE TABLE IF NOT EXISTS transactions (
  id                TEXT PRIMARY KEY,
  account_id        TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  date              TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  -- Denormalized from accounts.firm (the frontend Transaction carries it);
  -- lets the dashboard group by firm without a join.
  firm              TEXT NOT NULL CHECK (firm IN (
                      'Topstep', 'Apex Trader Funding', 'My Funded Futures',
                      'FundedNext', 'TradeDay', 'Tradeify', 'Earn2Trade',
                      'Lucid Trading', 'AquaFutures')),
  fee_type          TEXT NOT NULL CHECK (fee_type IN (
                      'eval', 'reset', 'activation', 'addon', 'recurring',
                      'payout', 'refund', 'phase-change')),
  list_price        REAL NOT NULL DEFAULT 0 CHECK (list_price >= 0),
  discount          REAL NOT NULL DEFAULT 0 CHECK (discount >= 0),
  amount_paid       REAL NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  -- Account phase as of this row ("phase2" kept for historical rows; the UI
  -- renders phase1/phase2 as "Evaluation").
  phase_reached     TEXT NOT NULL CHECK (phase_reached IN ('phase1', 'phase2', 'funded', 'breached')),
  refundable        INTEGER NOT NULL DEFAULT 0 CHECK (refundable IN (0, 1)),
  refund_status     TEXT NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'received')),
  refund_amount     REAL NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  -- Inflow on this row, 0 if none (only payout/refund rows carry inflows).
  payout            REAL NOT NULL DEFAULT 0 CHECK (payout >= 0),
  -- NULL when not applicable (context on payout rows only).
  profit_split_pct  REAL CHECK (profit_split_pct BETWEEN 0 AND 100),
  -- NULL unless a phase-change row to "breached".
  breach_reason     TEXT CHECK (breach_reason IN ('daily-drawdown', 'max-drawdown', 'consistency', 'other')),
  -- Tax overlay: whether this row counts as a deductible business expense.
  deductible        INTEGER NOT NULL DEFAULT 0 CHECK (deductible IN (0, 1)),
  tax_category      TEXT CHECK (tax_category IN (
                      'fees_commissions', 'software_data', 'education_research',
                      'equipment_hardware', 'home_office', 'business_meals',
                      'professional_services', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transactions_fee_type ON transactions (fee_type);

-- Standalone business expenses NOT tied to any account (lib/types.ts
-- Expense). Account fees are never re-entered here — the Tax tab unions
-- these with deductible transactions.
CREATE TABLE IF NOT EXISTS expenses (
  id                TEXT PRIMARY KEY,
  -- Determines which tax year the expense falls in.
  date              TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  vendor            TEXT NOT NULL,
  amount            REAL NOT NULL CHECK (amount >= 0),
  tax_category      TEXT NOT NULL CHECK (tax_category IN (
                      'fees_commissions', 'software_data', 'education_research',
                      'equipment_hardware', 'home_office', 'business_meals',
                      'professional_services', 'other')),
  -- 0-100; mixed-use items (internet, phone, home office) aren't 100%.
  deductible_pct    REAL NOT NULL DEFAULT 100 CHECK (deductible_pct BETWEEN 0 AND 100),
  receipt_url       TEXT,
  -- One-line "why this is a business expense" — audit substantiation.
  business_purpose  TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);

-- Daily trading notes / reflections (lib/types.ts Note).
CREATE TABLE IF NOT EXISTS notes (
  id       TEXT PRIMARY KEY,
  date     TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  content  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_date ON notes (date);

-- Per-tax-year filing treatment (store's taxSettings map). Years absent
-- from this table default to 'unsure' in the app.
CREATE TABLE IF NOT EXISTS tax_year_settings (
  year       TEXT PRIMARY KEY CHECK (year GLOB '[0-9][0-9][0-9][0-9]'),
  treatment  TEXT NOT NULL DEFAULT 'unsure' CHECK (treatment IN (
               'business_schedule_c', 'hobby', 'trader_tax_status', 'unsure'))
);

-- App-wide key/value settings (currently just the tax location).
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('tax_location_id', 'california');
