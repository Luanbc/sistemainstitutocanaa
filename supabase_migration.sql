/* 
  SQL Migration for Mercado Pago Integration
  Run this in your Supabase SQL Editor:
*/

-- Add columns for Mercado Pago tracking
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS mp_id TEXT;
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS mp_qr_code TEXT;
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS mp_qr_code_64 TEXT;
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS mp_status TEXT DEFAULT 'pending';
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMPTZ;
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS is_bolsista BOOLEAN DEFAULT FALSE;

-- Enable Realtime for the financeiro table if not already enabled
-- Note: You might need to do this via the Supabase Dashboard UI 
-- under Database > Replication > Source: public, Table: financeiro
