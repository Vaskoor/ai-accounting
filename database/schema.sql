
CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT, role TEXT DEFAULT 'user', created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE accounts (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'asset', balance DECIMAL(15,2) DEFAULT 0, currency TEXT DEFAULT 'USD', created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE transactions (id SERIAL PRIMARY KEY, account_id INT REFERENCES accounts(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')), amount DECIMAL(15,2) NOT NULL, category TEXT, description TEXT, date DATE NOT NULL, status TEXT DEFAULT 'completed', created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE invoices (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), client_name TEXT, amount DECIMAL(15,2), status TEXT DEFAULT 'pending', due_date DATE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE ledger_entries (id SERIAL PRIMARY KEY, transaction_id INT REFERENCES transactions(id), account_id INT REFERENCES accounts(id), debit DECIMAL(15,2), credit DECIMAL(15,2), created_at TIMESTAMP DEFAULT NOW());
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
