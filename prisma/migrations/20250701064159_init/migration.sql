-- CreateTable
CREATE TABLE "User" (
    "UserId" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullname" TEXT,
    "profilePicture" TEXT,
    "gender" TEXT,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserId")
);

-- CreateTable
CREATE TABLE "Post" (
    "PostId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "UserId" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("PostId")
);

-- CreateTable
CREATE TABLE "PostMedia" (
    "MediaId" TEXT NOT NULL,
    "MediaUrl" TEXT NOT NULL,
    "mediaType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "PostId" TEXT NOT NULL,

    CONSTRAINT "PostMedia_pkey" PRIMARY KEY ("MediaId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "CommentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "UserId" TEXT NOT NULL,
    "PostId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("CommentId")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "ReactionId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "UserId" TEXT NOT NULL,
    "PostId" TEXT,
    "CommentId" TEXT,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("ReactionId")
);

-- CreateTable
CREATE TABLE "Message" (
    "MessageId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "SenderId" TEXT NOT NULL,
    "ReceiverId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("MessageId")
);

-- CreateTable
CREATE TABLE "Friend" (
    "UserId" TEXT NOT NULL,
    "FriendId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("UserId","FriendId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_UserId_PostId_key" ON "Reaction"("UserId", "PostId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_UserId_CommentId_key" ON "Reaction"("UserId", "CommentId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMedia" ADD CONSTRAINT "PostMedia_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Post"("PostId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Post"("PostId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_PostId_fkey" FOREIGN KEY ("PostId") REFERENCES "Post"("PostId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_CommentId_fkey" FOREIGN KEY ("CommentId") REFERENCES "Comment"("CommentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_SenderId_fkey" FOREIGN KEY ("SenderId") REFERENCES "User"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ReceiverId_fkey" FOREIGN KEY ("ReceiverId") REFERENCES "User"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_FriendId_fkey" FOREIGN KEY ("FriendId") REFERENCES "User"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;
