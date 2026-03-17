-- CreateEnum
CREATE TYPE "ConsentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "consent_requests" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "requested_fields" TEXT[] NOT NULL,
    "status" "ConsentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "state" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_requests_app_id_idx" ON "consent_requests"("app_id");

-- CreateIndex
CREATE INDEX "consent_requests_status_idx" ON "consent_requests"("status");

-- CreateIndex
CREATE INDEX "consent_requests_expires_at_idx" ON "consent_requests"("expires_at");

-- AddForeignKey
ALTER TABLE "consent_requests" ADD CONSTRAINT "consent_requests_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "third_party_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
