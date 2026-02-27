-- Add check constraint to ensure Reaction targets exactly one entity (Post OR Comment, not both, not neither)
-- This prevents invalid states where a reaction has:
-- 1. Both PostId and CommentId set (reacting to two things)
-- 2. Neither PostId nor CommentId set (reacting to nothing)

ALTER TABLE "Reactions" 
ADD CONSTRAINT reaction_target_check 
CHECK (
  (("PostId" IS NOT NULL)::integer + ("CommentId" IS NOT NULL)::integer) = 1
);

-- Note: Run this manually after generating your Prisma migration with:
-- npx prisma migrate dev --name schema_improvements
