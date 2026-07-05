-- ==============================================================================
-- OptiForge3D - PostgreSQL Initialization Script
-- ==============================================================================
-- This script runs automatically when PostgreSQL container starts for the first time
-- Files in /docker-entrypoint-initdb.d/ are executed in alphabetical order
-- ==============================================================================

-- Enable UUID extension for generating unique identifiers
-- UUIDs are better than auto-incrementing integers for distributed systems
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing and encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- SCHEMAS (Optional - for future organization)
-- ==============================================================================
-- Uncomment these if you want to organize tables into schemas
-- CREATE SCHEMA IF NOT EXISTS users;
-- CREATE SCHEMA IF NOT EXISTS models;
-- CREATE SCHEMA IF NOT EXISTS jobs;

-- ==============================================================================
-- DATABASE CONFIGURATION
-- ==============================================================================
-- Set timezone to UTC (best practice for multi-region applications)
ALTER DATABASE optiforge_db SET timezone TO 'UTC';

-- ==============================================================================
-- PLACEHOLDER TABLES (Optional - for initial testing)
-- ==============================================================================
-- These tables demonstrate the database is initialized correctly
-- Delete or modify these when implementing your actual schema in Step 3

-- Example: Health check table
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT
);

-- Insert initial health check record
INSERT INTO system_health (service_name, status, message) 
VALUES ('postgres', 'healthy', 'Database initialized successfully');

-- ==============================================================================
-- PERMISSIONS (if needed for restricted users)
-- ==============================================================================
-- Example: Create a read-only user for analytics
-- CREATE USER analytics_user WITH PASSWORD 'your_analytics_password';
-- GRANT CONNECT ON DATABASE optiforge_db TO analytics_user;
-- GRANT USAGE ON SCHEMA public TO analytics_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;

-- ==============================================================================
-- LOGGING
-- ==============================================================================
-- PostgreSQL logs all startup messages, so this confirms script execution
DO $$
BEGIN
    RAISE NOTICE 'OptiForge3D database initialization completed successfully';
END $$;
