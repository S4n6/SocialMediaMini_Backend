-- Migration script for Users Domain Clean Architecture
-- This updates the User model to match with our domain model

-- Add new enums
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');

-- Update Users table structure
ALTER TABLE "Users" 
  -- Rename columns to match domain model
  RENAME COLUMN "UserName" TO "Username";

ALTER TABLE "Users"
  RENAME COLUMN "Password" TO "PasswordHash";

-- Add new columns
ALTER TABLE "Users" 
  ADD COLUMN "Status" "UserStatus" DEFAULT 'ACTIVE' NOT NULL,
  ADD COLUMN "LastProfileUpdate" TIMESTAMP(3);

-- Update role column to use enum (requires careful migration)
-- First, add new column with enum type
ALTER TABLE "Users" 
  ADD COLUMN "RoleEnum" "UserRole" DEFAULT 'USER' NOT NULL;

-- Migrate existing role data
UPDATE "Users" 
SET "RoleEnum" = 
  CASE 
    WHEN "Role" = 'ADMIN' THEN 'ADMIN'::"UserRole"
    WHEN "Role" = 'MODERATOR' THEN 'MODERATOR'::"UserRole"
    WHEN "Role" = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"UserRole"
    ELSE 'USER'::"UserRole"
  END;

-- Drop old role column and rename new one
ALTER TABLE "Users" DROP COLUMN "Role";
ALTER TABLE "Users" RENAME COLUMN "RoleEnum" TO "Role";

-- Update indexes if needed
DROP INDEX IF EXISTS "Users_UserName_key";
CREATE UNIQUE INDEX "Users_Username_key" ON "Users"("Username");

-- Verify the structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Users' 
ORDER BY ordinal_position;