-- ============================================================================
-- CONSOLIDATED BASELINE MIGRATION
-- Generated: 2026-03-01
-- Matches schema.prisma exactly (single source of truth)
-- ============================================================================

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "PostPrivacy" AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE', 'CLOSE_FRIENDS');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PROCESSING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'ANGRY');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'DELETED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('WEB', 'MOBILE', 'DESKTOP');

-- CreateEnum
CREATE TYPE "NotificationEntity" AS ENUM ('POST', 'COMMENT', 'USER', 'STORY', 'FOLLOW', 'MESSAGE');

-- ============================================================================
-- TABLES
-- ============================================================================

-- CreateTable: Users
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

-- CreateTable: Posts
CREATE TABLE "Posts" (
    "PostId" TEXT NOT NULL,
    "Content" TEXT,
    "Privacy" "PostPrivacy" NOT NULL DEFAULT 'PUBLIC',
    "Status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "AuthorId" TEXT NOT NULL,
    "LocationName" TEXT,
    "Latitude" DOUBLE PRECISION,
    "Longitude" DOUBLE PRECISION,
    "OriginalPostId" TEXT,

    CONSTRAINT "Posts_pkey" PRIMARY KEY ("PostId")
);

-- CreateTable: Reactions
CREATE TABLE "Reactions" (
    "ReactionId" TEXT NOT NULL,
    "Type" "ReactionType" NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ReactorId" TEXT NOT NULL,
    "PostId" TEXT,
    "CommentId" TEXT,

    CONSTRAINT "Reactions_pkey" PRIMARY KEY ("ReactionId")
);

-- CreateTable: Comments
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

-- CreateTable: Follows
CREATE TABLE "Follows" (
    "FollowId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FollowerId" TEXT NOT NULL,
    "FollowingId" TEXT NOT NULL,

    CONSTRAINT "Follows_pkey" PRIMARY KEY ("FollowId")
);

-- CreateTable: Conversations
CREATE TABLE "Conversations" (
    "ConversationId" TEXT NOT NULL,
    "Name" TEXT,
    "IsGroup" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversations_pkey" PRIMARY KEY ("ConversationId")
);

-- CreateTable: Messages (with threading + status)
CREATE TABLE "Messages" (
    "MessageId" TEXT NOT NULL,
    "Content" TEXT NOT NULL,
    "MessageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "Status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "IsRead" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EditedAt" TIMESTAMP(3),
    "DeletedAt" TIMESTAMP(3),
    "SenderId" TEXT NOT NULL,
    "ConversationId" TEXT NOT NULL,
    "ReplyToId" TEXT,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("MessageId")
);

-- CreateTable: MessageReadReceipts
CREATE TABLE "MessageReadReceipts" (
    "MessageReadReceiptId" TEXT NOT NULL,
    "MessageId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "ReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReadReceipts_pkey" PRIMARY KEY ("MessageReadReceiptId")
);

-- CreateTable: UserConversations
CREATE TABLE "UserConversations" (
    "UserConversationId" TEXT NOT NULL,
    "Role" "ConversationRole" NOT NULL DEFAULT 'MEMBER',
    "JoinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastReadAt" TIMESTAMP(3),
    "UserId" TEXT NOT NULL,
    "ConversationId" TEXT NOT NULL,

    CONSTRAINT "UserConversations_pkey" PRIMARY KEY ("UserConversationId")
);

-- CreateTable: Stories
CREATE TABLE "Stories" (
    "StoryId" TEXT NOT NULL,
    "Content" TEXT,
    "MediaUrl" TEXT,
    "MediaType" "MediaType",
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AuthorId" TEXT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stories_pkey" PRIMARY KEY ("StoryId")
);

-- CreateTable: StoryViews
CREATE TABLE "StoryViews" (
    "StoryViewId" TEXT NOT NULL,
    "ViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "StoryId" TEXT NOT NULL,
    "ViewerId" TEXT NOT NULL,

    CONSTRAINT "StoryViews_pkey" PRIMARY KEY ("StoryViewId")
);

-- CreateTable: Reports
CREATE TABLE "Reports" (
    "ReportId" TEXT NOT NULL,
    "Reason" TEXT NOT NULL,
    "Description" TEXT,
    "Status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ResolvedAt" TIMESTAMP(3),
    "ReporterId" TEXT NOT NULL,
    "TargetUserId" TEXT,
    "TargetPostId" TEXT,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("ReportId")
);

-- CreateTable: Notifications
CREATE TABLE "Notifications" (
    "NotificationId" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Content" TEXT NOT NULL,
    "IsRead" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserId" TEXT NOT NULL,
    "EntityId" TEXT,
    "EntityType" "NotificationEntity",

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("NotificationId")
);

-- CreateTable: Hashtags
CREATE TABLE "Hashtags" (
    "HashtagId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "UsageCount" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hashtags_pkey" PRIMARY KEY ("HashtagId")
);

-- CreateTable: PostHashtags
CREATE TABLE "PostHashtags" (
    "PostHashtagId" TEXT NOT NULL,
    "PostId" TEXT NOT NULL,
    "HashtagId" TEXT NOT NULL,

    CONSTRAINT "PostHashtags_pkey" PRIMARY KEY ("PostHashtagId")
);

-- CreateTable: PostMedias (with processing pipeline)
CREATE TABLE "PostMedias" (
    "PostMediaId" TEXT NOT NULL,
    "Url" TEXT NOT NULL,
    "Type" "MediaType" NOT NULL,
    "Order" INTEGER,
    "Status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "ProcessedUrl" TEXT,
    "ThumbnailUrl" TEXT,
    "S3Key" TEXT,
    "ErrorMessage" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "PostId" TEXT NOT NULL,

    CONSTRAINT "PostMedias_pkey" PRIMARY KEY ("PostMediaId")
);

-- CreateTable: Sessions
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
    "ClientType" "ClientType" NOT NULL DEFAULT 'WEB',
    "DeviceName" TEXT,
    "DeviceType" TEXT,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("SessionId")
);

-- CreateTable: SearchHistories
CREATE TABLE "SearchHistories" (
    "SearchHistoryId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchHistories_pkey" PRIMARY KEY ("SearchHistoryId")
);

-- CreateTable: SearchHistoryEntries
CREATE TABLE "SearchHistoryEntries" (
    "SearchHistoryEntryId" TEXT NOT NULL,
    "SearchedUserId" TEXT NOT NULL,
    "SearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "SearchHistoryId" TEXT NOT NULL,

    CONSTRAINT "SearchHistoryEntries_pkey" PRIMARY KEY ("SearchHistoryEntryId")
);

-- CreateTable: SavedPosts
CREATE TABLE "SavedPosts" (
    "SavedPostId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "PostId" TEXT NOT NULL,
    "SavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPosts_pkey" PRIMARY KEY ("SavedPostId")
);

-- CreateTable: Blocks
CREATE TABLE "Blocks" (
    "BlockId" TEXT NOT NULL,
    "BlockerId" TEXT NOT NULL,
    "BlockedId" TEXT NOT NULL,
    "BlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blocks_pkey" PRIMARY KEY ("BlockId")
);

-- CreateTable: PostUserTags
CREATE TABLE "PostUserTags" (
    "PostUserTagId" TEXT NOT NULL,
    "PostId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "XPosition" DOUBLE PRECISION,
    "YPosition" DOUBLE PRECISION,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostUserTags_pkey" PRIMARY KEY ("PostUserTagId")
);

-- CreateTable: CloseFriends
CREATE TABLE "CloseFriends" (
    "CloseFriendId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "FriendId" TEXT NOT NULL,
    "AddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloseFriends_pkey" PRIMARY KEY ("CloseFriendId")
);

-- ============================================================================
-- UNIQUE INDEXES
-- ============================================================================

CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");
CREATE UNIQUE INDEX "Users_GoogleId_key" ON "Users"("GoogleId");
CREATE UNIQUE INDEX "Users_Username_key" ON "Users"("Username");

CREATE UNIQUE INDEX "Reactions_ReactorId_PostId_key" ON "Reactions"("ReactorId", "PostId");
CREATE UNIQUE INDEX "Reactions_ReactorId_CommentId_key" ON "Reactions"("ReactorId", "CommentId");

CREATE UNIQUE INDEX "Follows_FollowerId_FollowingId_key" ON "Follows"("FollowerId", "FollowingId");

CREATE UNIQUE INDEX "MessageReadReceipts_MessageId_UserId_key" ON "MessageReadReceipts"("MessageId", "UserId");

CREATE UNIQUE INDEX "UserConversations_UserId_ConversationId_key" ON "UserConversations"("UserId", "ConversationId");

CREATE UNIQUE INDEX "StoryViews_StoryId_ViewerId_key" ON "StoryViews"("StoryId", "ViewerId");

CREATE UNIQUE INDEX "Hashtags_Name_key" ON "Hashtags"("Name");

CREATE UNIQUE INDEX "PostHashtags_PostId_HashtagId_key" ON "PostHashtags"("PostId", "HashtagId");

CREATE UNIQUE INDEX "Sessions_SessionIdentifier_key" ON "Sessions"("SessionIdentifier");

CREATE UNIQUE INDEX "SearchHistories_UserId_key" ON "SearchHistories"("UserId");

CREATE UNIQUE INDEX "SearchHistoryEntries_SearchHistoryId_SearchedUserId_key" ON "SearchHistoryEntries"("SearchHistoryId", "SearchedUserId");

CREATE UNIQUE INDEX "SavedPosts_UserId_PostId_key" ON "SavedPosts"("UserId", "PostId");

CREATE UNIQUE INDEX "Blocks_BlockerId_BlockedId_key" ON "Blocks"("BlockerId", "BlockedId");

CREATE UNIQUE INDEX "PostUserTags_PostId_UserId_key" ON "PostUserTags"("PostId", "UserId");

CREATE UNIQUE INDEX "CloseFriends_UserId_FriendId_key" ON "CloseFriends"("UserId", "FriendId");

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Posts
CREATE INDEX "Posts_AuthorId_idx" ON "Posts"("AuthorId");

-- Reactions
CREATE INDEX "Reactions_PostId_idx" ON "Reactions"("PostId");
CREATE INDEX "Reactions_CommentId_idx" ON "Reactions"("CommentId");

-- Comments
CREATE INDEX "Comments_PostId_idx" ON "Comments"("PostId");
CREATE INDEX "Comments_AuthorId_idx" ON "Comments"("AuthorId");
CREATE INDEX "Comments_ParentId_idx" ON "Comments"("ParentId");

-- Follows
CREATE INDEX "Follows_FollowerId_idx" ON "Follows"("FollowerId");
CREATE INDEX "Follows_FollowingId_idx" ON "Follows"("FollowingId");

-- Messages (composite for chat pagination)
CREATE INDEX "Messages_ConversationId_CreatedAt_idx" ON "Messages"("ConversationId", "CreatedAt" DESC);
CREATE INDEX "Messages_SenderId_idx" ON "Messages"("SenderId");
CREATE INDEX "Messages_ReplyToId_idx" ON "Messages"("ReplyToId");

-- MessageReadReceipts
CREATE INDEX "MessageReadReceipts_UserId_MessageId_idx" ON "MessageReadReceipts"("UserId", "MessageId");

-- Stories
CREATE INDEX "Stories_AuthorId_idx" ON "Stories"("AuthorId");
CREATE INDEX "Stories_ExpiresAt_idx" ON "Stories"("ExpiresAt");

-- Reports
CREATE INDEX "Reports_ReporterId_idx" ON "Reports"("ReporterId");

-- Notifications (composite for unread badge)
CREATE INDEX "Notifications_UserId_idx" ON "Notifications"("UserId");
CREATE INDEX "Notifications_UserId_IsRead_idx" ON "Notifications"("UserId", "IsRead");

-- PostMedias
CREATE INDEX "PostMedias_PostId_idx" ON "PostMedias"("PostId");

-- Sessions
CREATE INDEX "Sessions_SessionIdentifier_idx" ON "Sessions"("SessionIdentifier");
CREATE INDEX "Sessions_UserId_SessionIdentifier_idx" ON "Sessions"("UserId", "SessionIdentifier");

-- SavedPosts
CREATE INDEX "SavedPosts_UserId_idx" ON "SavedPosts"("UserId");

-- Blocks
CREATE INDEX "Blocks_BlockerId_idx" ON "Blocks"("BlockerId");
CREATE INDEX "Blocks_BlockedId_idx" ON "Blocks"("BlockedId");

-- PostUserTags
CREATE INDEX "PostUserTags_UserId_idx" ON "PostUserTags"("UserId");

-- CloseFriends
CREATE INDEX "CloseFriends_UserId_idx" ON "CloseFriends"("UserId");

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

-- Posts
ALTER TABLE "Posts" ADD CONSTRAINT "Posts_AuthorId_fkey" FOREIGN KEY ("AuthorId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Posts" ADD CONSTRAINT "Posts_OriginalPostId_fkey" FOREIGN KEY ("OriginalPostId") REFERENCES "Posts"("PostId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Reactions
ALTER TABLE "Reactions" ADD CONSTRAINT "Reactions_CommentId_fkey" FOREIGN KEY ("CommentId") REFERENCES "Comments"("CommentId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reactions" ADD CONSTRAINT "Reactions_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reactions" ADD CONSTRAINT "Reactions_ReactorId_fkey" FOREIGN KEY ("ReactorId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comments
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_AuthorId_fkey" FOREIGN KEY ("AuthorId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_ParentId_fkey" FOREIGN KEY ("ParentId") REFERENCES "Comments"("CommentId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Follows
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_FollowerId_fkey" FOREIGN KEY ("FollowerId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_FollowingId_fkey" FOREIGN KEY ("FollowingId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Messages
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_ConversationId_fkey" FOREIGN KEY ("ConversationId") REFERENCES "Conversations"("ConversationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_SenderId_fkey" FOREIGN KEY ("SenderId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_ReplyToId_fkey" FOREIGN KEY ("ReplyToId") REFERENCES "Messages"("MessageId") ON DELETE SET NULL ON UPDATE CASCADE;

-- MessageReadReceipts
ALTER TABLE "MessageReadReceipts" ADD CONSTRAINT "MessageReadReceipts_MessageId_fkey" FOREIGN KEY ("MessageId") REFERENCES "Messages"("MessageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserConversations
ALTER TABLE "UserConversations" ADD CONSTRAINT "UserConversations_ConversationId_fkey" FOREIGN KEY ("ConversationId") REFERENCES "Conversations"("ConversationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserConversations" ADD CONSTRAINT "UserConversations_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Stories
ALTER TABLE "Stories" ADD CONSTRAINT "Stories_AuthorId_fkey" FOREIGN KEY ("AuthorId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- StoryViews
ALTER TABLE "StoryViews" ADD CONSTRAINT "StoryViews_StoryId_fkey" FOREIGN KEY ("StoryId") REFERENCES "Stories"("StoryId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryViews" ADD CONSTRAINT "StoryViews_ViewerId_fkey" FOREIGN KEY ("ViewerId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reports
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_ReporterId_fkey" FOREIGN KEY ("ReporterId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_TargetPostId_fkey" FOREIGN KEY ("TargetPostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_TargetUserId_fkey" FOREIGN KEY ("TargetUserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notifications
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- PostHashtags
ALTER TABLE "PostHashtags" ADD CONSTRAINT "PostHashtags_HashtagId_fkey" FOREIGN KEY ("HashtagId") REFERENCES "Hashtags"("HashtagId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostHashtags" ADD CONSTRAINT "PostHashtags_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- PostMedias
ALTER TABLE "PostMedias" ADD CONSTRAINT "PostMedias_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sessions
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- SearchHistories
ALTER TABLE "SearchHistories" ADD CONSTRAINT "SearchHistories_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- SearchHistoryEntries
ALTER TABLE "SearchHistoryEntries" ADD CONSTRAINT "SearchHistoryEntries_SearchHistoryId_fkey" FOREIGN KEY ("SearchHistoryId") REFERENCES "SearchHistories"("SearchHistoryId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchHistoryEntries" ADD CONSTRAINT "SearchHistoryEntries_SearchedUserId_fkey" FOREIGN KEY ("SearchedUserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedPosts
ALTER TABLE "SavedPosts" ADD CONSTRAINT "SavedPosts_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPosts" ADD CONSTRAINT "SavedPosts_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Blocks
ALTER TABLE "Blocks" ADD CONSTRAINT "Blocks_BlockerId_fkey" FOREIGN KEY ("BlockerId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Blocks" ADD CONSTRAINT "Blocks_BlockedId_fkey" FOREIGN KEY ("BlockedId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- PostUserTags
ALTER TABLE "PostUserTags" ADD CONSTRAINT "PostUserTags_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Posts"("PostId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostUserTags" ADD CONSTRAINT "PostUserTags_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- CloseFriends
ALTER TABLE "CloseFriends" ADD CONSTRAINT "CloseFriends_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CloseFriends" ADD CONSTRAINT "CloseFriends_FriendId_fkey" FOREIGN KEY ("FriendId") REFERENCES "Users"("UserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- CHECK CONSTRAINTS (business integrity rules)
-- ============================================================================

-- Reaction must target exactly one entity: Post XOR Comment
ALTER TABLE "Reactions"
ADD CONSTRAINT reaction_target_check
CHECK (
  (("PostId" IS NOT NULL)::integer + ("CommentId" IS NOT NULL)::integer) = 1
);
