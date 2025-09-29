/*
  Warnings:

  - You are about to drop the column `Password` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `UserName` on the `Users` table. All the data in the column will be lost.
  - The `Role` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[Username]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Username` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');

-- DropIndex
DROP INDEX "Users_UserName_key";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "Password",
DROP COLUMN "UserName",
ADD COLUMN     "LastProfileUpdate" TIMESTAMP(3),
ADD COLUMN     "PasswordHash" TEXT,
ADD COLUMN     "Status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "Username" TEXT NOT NULL,
DROP COLUMN "Role",
ADD COLUMN     "Role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "Users_Username_key" ON "Users"("Username");
