/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VaultCategory" AS ENUM ('PROFILE', 'CONTACT', 'DOCUMENT', 'CREDENTIAL', 'NOTE', 'OTHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "encrypted_master_key" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "vault_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" "VaultCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_fields" (
    "id" TEXT NOT NULL,
    "vault_entry_id" TEXT NOT NULL,
    "fieldKey" VARCHAR(100) NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "field_type" VARCHAR(50) NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vault_entries_user_id_idx" ON "vault_entries"("user_id");

-- CreateIndex
CREATE INDEX "vault_entries_category_idx" ON "vault_entries"("category");

-- CreateIndex
CREATE INDEX "vault_entries_user_id_category_idx" ON "vault_entries"("user_id", "category");

-- CreateIndex
CREATE INDEX "vault_fields_vault_entry_id_idx" ON "vault_fields"("vault_entry_id");

-- CreateIndex
CREATE INDEX "vault_fields_fieldKey_idx" ON "vault_fields"("fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "vault_entries" ADD CONSTRAINT "vault_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_fields" ADD CONSTRAINT "vault_fields_vault_entry_id_fkey" FOREIGN KEY ("vault_entry_id") REFERENCES "vault_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
