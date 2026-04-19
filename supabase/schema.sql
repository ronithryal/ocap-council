-- OCAP MVP: Supabase Schema
-- Includes RLS (Row Level Security) for B2B Bounty Engine

-- 1. Tables

-- Bounties Table
CREATE TABLE IF NOT EXISTS public.bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Ties to auth.users
    title TEXT NOT NULL,
    description TEXT,
    budget NUMERIC NOT NULL,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, active, completed, cancelled
    agent_phase TEXT NOT NULL DEFAULT 'idle', -- idle, dispatching, navigating, vetting, awaiting_quote, quote_received, settling, completed, failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    credentials TEXT,
    quote_amount NUMERIC NOT NULL,
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    summary TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Logs Table (for real-time tracker)
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escrow Transactions Table
CREATE TABLE IF NOT EXISTS public.escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    tx_hash TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'base-sepolia',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- 3. V2 Forensic Tables

-- Forensic Code Library (The "Gold Standard" Feature Store)
CREATE TABLE IF NOT EXISTS public.forensic_code_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_url TEXT NOT NULL,
    archetype_label TEXT NOT NULL,
    raw_diff_logic TEXT NOT NULL,
    vector_embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Engineer Reports (CTO Diligence pipeline results)
CREATE TABLE IF NOT EXISTS public.engineer_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
    developer_handle TEXT NOT NULL,
    smoking_gun_url TEXT,
    grit_score NUMERIC,
    archetype TEXT,
    dimensions JSONB DEFAULT '{}'::jsonb,
    grit_markers JSONB DEFAULT '[]'::jsonb,
    red_flags JSONB DEFAULT '[]'::jsonb,
    justification TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forensic_code_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_reports ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Bounties: Users can see and manage only their own requests
CREATE POLICY "Users can manage their own bounties" 
ON public.bounties 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Vendors: Users can see vendors for their own bounties
CREATE POLICY "Users can view vendors for their bounties" 
ON public.vendors 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.bounties 
        WHERE bounties.id = vendors.bounty_id AND bounties.user_id = auth.uid()
    )
);

-- Agent Logs: Users can see logs for their own bounties
CREATE POLICY "Users can view logs for their bounties" 
ON public.agent_logs 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.bounties 
        WHERE bounties.id = agent_logs.bounty_id AND bounties.user_id = auth.uid()
    )
);

-- Escrow Transactions: Users can see their own transactions
CREATE POLICY "Users can view their own transactions" 
ON public.escrow_transactions 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.bounties 
        WHERE bounties.id = escrow_transactions.bounty_id AND bounties.user_id = auth.uid()
    )
);

-- Forensic Code Library: Public Read (Gold Standard is visible to everyone)
CREATE POLICY "Public read access to forensic code library"
ON public.forensic_code_library
FOR SELECT
TO authenticated
USING (true);

-- Engineer Reports: Users can view reports for their own bounties
CREATE POLICY "Users can view engineer reports for their bounties"
ON public.engineer_reports
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.bounties
        WHERE bounties.id = engineer_reports.bounty_id AND bounties.user_id = auth.uid()
    )
);

-- 6. Service Role (Bypass RLS for the "Council" Agent API)
-- By default, service_role bypasses RLS, so no dedicated policy needed.
