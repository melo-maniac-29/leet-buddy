-- LeetBuddy Database Schema
-- PostgreSQL 16+

-- Problems table (main data)
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    title_slug VARCHAR(500) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    acceptance_rate DECIMAL(5,2),
    frontend_id INTEGER,
    is_premium BOOLEAN DEFAULT FALSE,
    problem_url VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Topics table (normalized)
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Problem-Topic relationship (many-to-many)
CREATE TABLE problem_topics (
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, topic_id)
);

-- Companies table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Problem-Company relationship (many-to-many)
CREATE TABLE problem_companies (
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, company_id)
);

-- Solutions table
CREATE TABLE solutions (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'official',  -- 'official' or 'community'
    contributor_github VARCHAR(100),
    contributed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    
    -- Removed unique constraint to allow multiple solutions per language
);

-- User progress tracking
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,  -- GitHub username
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    solved_at TIMESTAMP DEFAULT NOW(),
    language VARCHAR(50),
    runtime VARCHAR(50),
    memory VARCHAR(50),
    solution_code TEXT,
    notes TEXT,
    github_synced BOOLEAN DEFAULT FALSE,
    github_url VARCHAR(500),
    
    UNIQUE(user_id, problem_id, language)  -- Allow multiple solutions per language
);

-- User roadmap selections
CREATE TABLE user_roadmaps (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    roadmap_name VARCHAR(100) NOT NULL,  -- 'fraz', 'arsh', 'strivers', 'array', 'google', etc.
    started_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, roadmap_name)
);

-- Roadmaps metadata (pre-defined learning paths)
CREATE TABLE roadmaps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,  -- 'curated', 'topic', 'company'
    total_problems INTEGER DEFAULT 0,
    problem_ids INTEGER[],  -- Array of problem IDs for curated roadmaps
    difficulty_distribution JSONB,  -- {"easy": 50, "medium": 100, "hard": 50}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User AI settings
CREATE TABLE user_ai_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    api_base_url VARCHAR(500) DEFAULT 'https://api.openai.com/v1',
    api_key_encrypted TEXT,  -- Encrypted API key
    model_name VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pending contributions (review queue)
CREATE TABLE pending_contributions (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    
    -- Contributor info
    contributor_github VARCHAR(100) NOT NULL,
    pr_number INTEGER,  -- GitHub PR number
    pr_url VARCHAR(500),
    
    -- Review status
    status VARCHAR(20) DEFAULT 'pending',  -- pending/approved/rejected
    submitted_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewer_notes TEXT,
    
    -- Performance metrics (from LeetCode)
    runtime VARCHAR(50),
    memory VARCHAR(50)
);

-- Indexes for performance
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_frontend_id ON problems(frontend_id);
CREATE INDEX idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX idx_solutions_language ON solutions(language);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_problem_id ON user_progress(problem_id);
CREATE INDEX idx_user_progress_solved_at ON user_progress(solved_at);
CREATE INDEX idx_user_roadmaps_user_id ON user_roadmaps(user_id);
CREATE INDEX idx_user_roadmaps_active ON user_roadmaps(is_active);
CREATE INDEX idx_pending_contributions_status ON pending_contributions(status);

-- Functions
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_problems_modtime
    BEFORE UPDATE ON problems
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_solutions_modtime
    BEFORE UPDATE ON solutions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Database metadata
CREATE TABLE database_metadata (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO database_metadata (key, value) VALUES 
    ('version', '1.0.0'),
    ('last_sync', NOW()::TEXT),
    ('total_problems', '0'),
    ('total_solutions', '0');
