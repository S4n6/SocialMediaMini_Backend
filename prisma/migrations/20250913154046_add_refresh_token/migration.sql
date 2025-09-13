-- CreateTable
CREATE TABLE "RefreshTokens" (
    "RefreshTokenId" TEXT NOT NULL,
    "Token" TEXT NOT NULL,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsRevoked" BOOLEAN NOT NULL DEFAULT false,
    "UserId" TEXT NOT NULL,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("RefreshTokenId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_Token_key" ON "RefreshTokens"("Token");

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
