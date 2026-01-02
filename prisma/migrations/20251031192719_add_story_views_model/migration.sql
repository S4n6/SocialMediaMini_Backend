/*
  Warnings:

  - Added the required column `UpdatedAt` to the `Stories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stories" ADD COLUMN     "IsActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "MediaUrl" DROP NOT NULL,
ALTER COLUMN "MediaType" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StoryViews" (
    "StoryViewId" TEXT NOT NULL,
    "ViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "StoryId" TEXT NOT NULL,
    "ViewerId" TEXT NOT NULL,

    CONSTRAINT "StoryViews_pkey" PRIMARY KEY ("StoryViewId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryViews_StoryId_ViewerId_key" ON "StoryViews"("StoryId", "ViewerId");

-- AddForeignKey
ALTER TABLE "StoryViews" ADD CONSTRAINT "StoryViews_StoryId_fkey" FOREIGN KEY ("StoryId") REFERENCES "Stories"("StoryId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryViews" ADD CONSTRAINT "StoryViews_ViewerId_fkey" FOREIGN KEY ("ViewerId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
