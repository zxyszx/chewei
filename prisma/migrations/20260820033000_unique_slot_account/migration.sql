DROP INDEX IF EXISTS "parking_slots_accountEmail_idx";

CREATE UNIQUE INDEX "parking_slots_accountEmail_key" ON "parking_slots"("accountEmail");
