-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');

-- CreateTable
CREATE TABLE "Users" (
    "UserId" TEXT NOT NULL,
    "FullName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "GoogleId" TEXT,
    "DateOfBirth" TIMESTAMP(3),
    "PhoneNumber" TEXT,
    "Avatar" TEXT,
    "Bio" TEXT,
    "Location" TEXT,
    "Gender" TEXT,
    "IsEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "EmailVerifiedAt" TIMESTAMP(3),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "WebsiteUrl" TEXT,
    "LastProfileUpdate" TIMESTAMP(3),
    "PasswordHash" TEXT,
    "Status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "Username" TEXT NOT NULL,
    "Role" "UserRole" NOT NULL DEFAULT 'USER',
    "LastVerificationSentAt" TIMESTAMP(3),
    "LastPasswordResetSentAt" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("UserId")
);

-- CreateTable
CREATE TABLE "Posts" (
    "PostId" TEXT NOT NULL,
    "Content" TEXT,
    "Privacy" TEXT NOT NULL DEFAULT 'public',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "AuthorId" TEXT NOT NULL,

    CONSTRAINT "Posts_pkey" PRIMARY KEY ("PostId")
);

-- CreateTable
CREATE TABLE "Reactions" (
    "ReactionId" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ReactorId" TEXT NOT NULL,
    "PostId" TEXT,
    "CommentId" TEXT,

    CONSTRAINT "Reactions_pkey" PRIMARY KEY ("ReactionId")
);

-- CreateTable
CREATE TABLE "Comments" (
    "CommentId" TEXT NOT NULL,
    "Content" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "AuthorId" TEXT NOT NULL,
    "PostId" TEXT NOT NULL,
    "ParentId" TEXT,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("CommentId")
);

-- CreateTable
CREATE TABLE "Follows" (
    "FollowId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FollowerId" TEXT NOT NULL,
    "FollowingId" TEXT NOT NULL,

    CONSTRAINT "Follows_pkey" PRIMARY KEY ("FollowId")
);

-- CreateTable
CREATE TABLE "Conversations" (
    "ConversationId" TEXT NOT NULL,
    "Name" TEXT,
    "IsGroup" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversations_pkey" PRIMARY KEY ("ConversationId")
);

-- CreateTable
CREATE TABLE "Messages" (
    "MessageId" TEXT NOT NULL,
    "Content" TEXT NOT NULL,
    "MessageType" TEXT NOT NULL DEFAULT 'text',
    "IsRead" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "SenderId" TEXT NOT NULL,
    "ConversationId" TEXT NOT NULL,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("MessageId")
);

-- CreateTable
CREATE TABLE "UserConversations" (
    "UserConversationId" TEXT NOT NULL,
    "Role" TEXT NOT NULL DEFAULT 'member',
    "JoinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastReadAt" TIMESTAMP(3),
    "UserId" TEXT NOT NULL,
    "ConversationId" TEXT NOT NULL,

    CONSTRAINT "UserConversations_pkey" PRIMARY KEY ("UserConversationId")
);

-- CreateTable
CREATE TABLE "Stories" (
    "StoryId" TEXT NOT NULL,
    "Content" TEXT,
    "MediaUrl" TEXT,
    "MediaType" TEXT,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AuthorId" TEXT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stories_pkey" PRIMARY KEY ("StoryId")
);

-- CreateTable
CREATE TABLE "StoryViews" (
    "StoryViewId" TEXT NOT NULL,
    "ViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "StoryId" TEXT NOT NULL,
    "ViewerId" TEXT NOT NULL,

    CONSTRAINT "StoryViews_pkey" PRIMARY KEY ("StoryViewId")
);

-- CreateTable
CREATE TABLE "Reports" (
    "ReportId" TEXT NOT NULL,
    "Reason" TEXT NOT NULL,
    "Description" TEXT,
    "Status" TEXT NOT NULL DEFAULT 'pending',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ResolvedAt" TIMESTAMP(3),
    "ReporterId" TEXT NOT NULL,
    "TargetUserId" TEXT,
    "TargetPostId" TEXT,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("ReportId")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "NotificationId" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Content" TEXT NOT NULL,
    "IsRead" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserId" TEXT NOT NULL,
    "EntityId" TEXT,
    "EntityType" TEXT,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("NotificationId")
);

-- CreateTable
CREATE TABLE "Hashtags" (
    "HashtagId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "UsageCount" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hashtags_pkey" PRIMARY KEY ("HashtagId")
);

-- CreateTable
CREATE TABLE "PostHashtags" (
    "PostHashtagId" TEXT NOT NULL,
    "PostId" TEXT NOT NULL,
    "HashtagId" TEXT NOT NULL,

    CONSTRAINT "PostHashtags_pkey" PRIMARY KEY ("PostHashtagId")
);

-- CreateTable
CREATE TABLE "PostMedias" (
    "PostMediaId" TEXT NOT NULL,
    "Url" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "Order" INTEGER,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "PostId" TEXT NOT NULL,

    CONSTRAINT "PostMedias_pkey" PRIMARY KEY ("PostMediaId")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "SessionId" TEXT NOT NULL,
    "SessionIdentifier" TEXT NOT NULL,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsRevoked" BOOLEAN NOT NULL DEFAULT false,
    "RevokedAt" TIMESTAMP(3),
    "UserAgent" TEXT,
    "IpAddress" TEXT,
    "UserId" TEXT NOT NULL,
    "ClientType" TEXT NOT NULL DEFAULT 'web',
    "DeviceName" TEXT,
    "DeviceType" TEXT,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("SessionId")
);

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
CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_GoogleId_key" ON "Users"("GoogleId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_Username_key" ON "Users"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "Reactions_ReactorId_PostId_key" ON "Reactions"("ReactorId", "PostId");

-- CreateIndex
CREATE UNIQUE INDEX "Reactions_ReactorId_CommentId_key" ON "Reactions"("ReactorId", "CommentId");

-- CreateIndex
CREATE UNIQUE INDEX "Follows_FollowerId_FollowingId_key" ON "Follows"("FollowerId", "FollowingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConversations_UserId_ConversationId_key" ON "UserConversations"("UserId", "ConversationId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryViews_StoryId_ViewerId_key" ON "StoryViews"("StoryId", "ViewerId");

-- CreateIndex
CREATE UNIQUE INDEX "Hashtags_Name_key" ON "Hashtags"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "PostHashtags_PostId_HashtagId_key" ON "PostHashtags"("PostId", "HashtagId");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_SessionIdentifier_key" ON "Sessions"("SessionIdentifier");

-- CreateIndex
CREATE INDEX "Sessions_SessionIdentifier_idx" ON "Sessions"("SessionIdentifier");

-- CreateIndex
CREATE INDEX "Sessions_UserId_SessionIdentifier_idx" ON "Sessions"("UserId", "SessionIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "SearchHistories_UserId_key" ON "SearchHistories"("UserId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchHistoryEntries_SearchHistoryId_SearchedUserId_key" ON "SearchHistoryEntries"("SearchHistoryId", "SearchedUserId");

-- AddForeignKey
ALTER TABLE "Posts" ADD CONSTRAINT "Posts_AuthorId_fkey" FOREIGN KEY ("AuthorId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "Reactions_CommentId_fkey" FOREIGN KEY ("CommentId") REFERENCES "Comments"("CommentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "Reactions_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "Reactions_ReactorId_fkey" FOREIGN KEY ("ReactorId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_AuthorId_fkey" FOREIGN KEY ("AuthorId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_ParentId_fkey" FOREIGN KEY ("ParentId") REFERENCES "Comments"("CommentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_FollowerId_fkey" FOREIGN KEY ("FollowerId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_FollowingId_fkey" FOREIGN KEY ("FollowingId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_ConversationId_fkey" FOREIGN KEY ("ConversationId") REFERENCES "Conversations"("ConversationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_SenderId_fkey" FOREIGN KEY ("SenderId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConversations" ADD CONSTRAINT "UserConversations_ConversationId_fkey" FOREIGN KEY ("ConversationId") REFERENCES "Conversations"("ConversationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConversations" ADD CONSTRAINT "UserConversations_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stories" ADD CONSTRAINT "Stories_AuthorId_fkey" FOREIGN KEY ("AuthorId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryViews" ADD CONSTRAINT "StoryViews_StoryId_fkey" FOREIGN KEY ("StoryId") REFERENCES "Stories"("StoryId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryViews" ADD CONSTRAINT "StoryViews_ViewerId_fkey" FOREIGN KEY ("ViewerId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_ReporterId_fkey" FOREIGN KEY ("ReporterId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_TargetPostId_fkey" FOREIGN KEY ("TargetPostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_TargetUserId_fkey" FOREIGN KEY ("TargetUserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostHashtags" ADD CONSTRAINT "PostHashtags_HashtagId_fkey" FOREIGN KEY ("HashtagId") REFERENCES "Hashtags"("HashtagId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostHashtags" ADD CONSTRAINT "PostHashtags_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMedias" ADD CONSTRAINT "PostMedias_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistories" ADD CONSTRAINT "SearchHistories_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistoryEntries" ADD CONSTRAINT "SearchHistoryEntries_SearchHistoryId_fkey" FOREIGN KEY ("SearchHistoryId") REFERENCES "SearchHistories"("SearchHistoryId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistoryEntries" ADD CONSTRAINT "SearchHistoryEntries_SearchedUserId_fkey" FOREIGN KEY ("SearchedUserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
