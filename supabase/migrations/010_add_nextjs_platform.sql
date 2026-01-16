-- Add nextjs to platform_type enum
-- This migration adds Next.js as a supported platform type

ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'nextjs';
