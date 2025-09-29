-- CreateTable
CREATE TABLE "SearchHistories" (
    "SearchHistoryId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchHistories_pkey" PRIMARY KEY ("SearchHistoryId")
);

-- CreateTable
CREATE TABLE "SearchHistoryEntries" (
    "SearchHistoryEntryId" TEXT NOT NULL,
    "SearchedUserId" TEXT NOT NULL,
    "SearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "SearchHistoryId" TEXT NOT NULL,

    CONSTRAINT "SearchHistoryEntries_pkey" PRIMARY KEY ("SearchHistoryEntryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchHistories_UserId_key" ON "SearchHistories"("UserId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchHistoryEntries_SearchHistoryId_SearchedUserId_key" ON "SearchHistoryEntries"("SearchHistoryId", "SearchedUserId");

-- AddForeignKey
ALTER TABLE "SearchHistories" ADD CONSTRAINT "SearchHistories_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistoryEntries" ADD CONSTRAINT "SearchHistoryEntries_SearchHistoryId_fkey" FOREIGN KEY ("SearchHistoryId") REFERENCES "SearchHistories"("SearchHistoryId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistoryEntries" ADD CONSTRAINT "SearchHistoryEntries_SearchedUserId_fkey" FOREIGN KEY ("SearchedUserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
