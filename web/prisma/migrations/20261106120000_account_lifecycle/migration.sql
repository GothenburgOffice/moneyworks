-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "lastSignInAt" TIMESTAMP(3),
ADD COLUMN     "lockedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- Existing members: the newest session they still have is the best known last sign-in.
UPDATE "User" u SET "lastSignInAt" = s.latest
FROM (SELECT "userId", MAX("createdAt") AS latest FROM "Session" GROUP BY "userId") s
WHERE s."userId" = u.id;
