-- CreateIndex
CREATE INDEX "Sessions_SessionIdentifier_idx" ON "Sessions"("SessionIdentifier");

-- CreateIndex
CREATE INDEX "Sessions_UserId_SessionIdentifier_idx" ON "Sessions"("UserId", "SessionIdentifier");
