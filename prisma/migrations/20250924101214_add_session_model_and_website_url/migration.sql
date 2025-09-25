/*
  Warnings:

  - You are about to drop the `RefreshTokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RefreshTokens" DROP CONSTRAINT "RefreshTokens_UserId_fkey";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "WebsiteUrl" TEXT;

-- DropTable
DROP TABLE "RefreshTokens";

-- CreateTable
CREATE TABLE "Sessions" (
    "SessionId" TEXT NOT NULL,
    "SessionIdentifier" TEXT NOT NULL,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsRevoked" BOOLEAN NOT NULL DEFAULT false,
    "UserAgent" TEXT,
    "IpAddress" TEXT,
    "UserId" TEXT NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("SessionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_SessionIdentifier_key" ON "Sessions"("SessionIdentifier");

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
