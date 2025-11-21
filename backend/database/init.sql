-- CoursePath Database Schema
-- This script initializes the PostgreSQL database with all required tables

-- Create the coursepath_user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'coursepath_user') THEN
        CREATE ROLE coursepath_user LOGIN PASSWORD 'coursepath_password';
    END IF;
END
$$;

-- Grant privileges to coursepath_user
GRANT ALL PRIVILEGES ON DATABASE coursepath TO coursepath_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO coursepath_user;

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Programs table (reference data from scraped programs.json)
CREATE TABLE IF NOT EXISTS programs (
    program_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'major' or 'minor'
    requirements JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses table (reference data from scraped courses.json)
CREATE TABLE IF NOT EXISTS courses (
    course_code VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL,
    description TEXT,
    prereqs TEXT[],
    terms_offered TEXT[], -- e.g., ['Fall', 'Spring']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plans table (user's academic plans)
CREATE TABLE IF NOT EXISTS plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    catalog_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plan items table (courses in user's plan)
CREATE TABLE IF NOT EXISTS plan_items (
    plan_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL REFERENCES courses(course_code),
    semester VARCHAR(20) NOT NULL, -- e.g., 'Fall 2024', 'Spring 2025'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_course_code ON plan_items(course_code);
CREATE INDEX IF NOT EXISTS idx_plan_items_semester ON plan_items(semester);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_items_updated_at BEFORE UPDATE ON plan_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
