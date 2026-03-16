-- CreateEnum
CREATE TYPE "ThirdPartyAppStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "third_party_apps" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "client_id" VARCHAR(64) NOT NULL,
    "secret_hash" VARCHAR(255) NOT NULL,
    "status" "ThirdPartyAppStatus" NOT NULL DEFAULT 'ACTIVE',
    "redirect_uris" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "secret_rotated_at" TIMESTAMP(3),

    CONSTRAINT "third_party_apps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "third_party_apps_client_id_key" ON "third_party_apps"("client_id");

-- CreateIndex
CREATE INDEX "third_party_apps_owner_id_idx" ON "third_party_apps"("owner_id");

-- CreateIndex
CREATE INDEX "third_party_apps_status_idx" ON "third_party_apps"("status");

-- AddForeignKey
ALTER TABLE "third_party_apps" ADD CONSTRAINT "third_party_apps_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
