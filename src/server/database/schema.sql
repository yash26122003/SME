-- Real Walmart Sales Data Schema
CREATE TABLE IF NOT EXISTS walmart_sales (
    id SERIAL PRIMARY KEY,
    store INTEGER NOT NULL,
    date DATE NOT NULL,
    weekly_sales DECIMAL(12,2) NOT NULL,
    holiday_flag INTEGER NOT NULL,
    temperature DECIMAL(6,2),
    fuel_price DECIMAL(6,3),
    cpi DECIMAL(10,7),
    unemployment DECIMAL(6,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_walmart_sales_store ON walmart_sales(store);
CREATE INDEX IF NOT EXISTS idx_walmart_sales_date ON walmart_sales(date);
CREATE INDEX IF NOT EXISTS idx_walmart_sales_store_date ON walmart_sales(store, date);
CREATE INDEX IF NOT EXISTS idx_walmart_sales_weekly_sales ON walmart_sales(weekly_sales);

-- Query history for NLP processing
CREATE TABLE IF NOT EXISTS query_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    original_query TEXT NOT NULL,
    interpreted_query TEXT,
    sql_query TEXT,
    gemini_response JSONB,
    execution_result JSONB,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics cache for real-time performance
CREATE TABLE IF NOT EXISTS analytics_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store information
CREATE TABLE IF NOT EXISTS store_info (
    store_id INTEGER PRIMARY KEY,
    store_name VARCHAR(100),
    location VARCHAR(100),
    type VARCHAR(50),
    size_sq_ft INTEGER
);

-- Insert sample store data
INSERT INTO store_info (store_id, store_name, location, type, size_sq_ft) VALUES
(1, 'Walmart Store #1', 'Alabama, AL', 'Supercenter', 180000),
(2, 'Walmart Store #2', 'Arkansas, AR', 'Supercenter', 195000),
(3, 'Walmart Store #3', 'California, CA', 'Supercenter', 210000),
(4, 'Walmart Store #4', 'Colorado, CO', 'Neighborhood Market', 42000),
(5, 'Walmart Store #5', 'Florida, FL', 'Supercenter', 185000)
ON CONFLICT (store_id) DO NOTHING;
