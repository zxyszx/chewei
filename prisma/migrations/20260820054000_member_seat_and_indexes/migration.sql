-- Preserve existing members by assigning stable seat numbers within each slot.
ALTER TABLE "members" ADD COLUMN "seatNumber" INTEGER;

WITH ranked_members AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "slotId" ORDER BY "createdAt", "id") AS seat_number
  FROM "members"
  WHERE "status" = 'ACTIVE'
)
UPDATE "members"
SET "seatNumber" = ranked_members.seat_number
FROM ranked_members
WHERE "members"."id" = ranked_members."id";

CREATE UNIQUE INDEX "members_slotId_seatNumber_key" ON "members"("slotId", "seatNumber");
CREATE INDEX "members_slotId_idx" ON "members"("slotId");
CREATE INDEX "parking_slots_platformId_idx" ON "parking_slots"("platformId");
CREATE INDEX "renewals_memberId_idx" ON "renewals"("memberId");
