BEGIN;

-- 1. Create a clean lookup table for System Roles
CREATE TABLE public.user_roles (
    role_name VARCHAR(50) PRIMARY KEY
);

INSERT INTO public.user_roles (role_name) VALUES 
('Super Admin'), 
('Admin'), 
('Guest User'), 
('Developer');

-- 2. Create the core Users tracking matrix
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL UNIQUE, -- Maps directly to Firebase UID string
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL REFERENCES public.user_roles(role_name) DEFAULT 'Guest User',
    api_key VARCHAR(128) UNIQUE,               -- Long-lived static secure string
    
    -- API Rate Metering Metrics
    api_calls_limit INT DEFAULT 1000,          -- Max allowed calls per window. Set to -1 for UNLIMITED
    api_calls_count INT DEFAULT 0,              -- Tracked current usages consumption
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index the access lookups to prevent database lag during rapid script loops
CREATE INDEX idx_users_api_key ON public.users(api_key);
CREATE INDEX idx_users_firebase_uid ON public.users(firebase_uid);

COMMIT;