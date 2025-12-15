/*
  Warnings:

  - Made the column `firebaseUid` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "minBidIncrement" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "originalEndTime" TIMESTAMP(3),
ADD COLUMN     "reserveMet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "snipeExtensionMinutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "snipeThresholdMinutes" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "isAutoBid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxBid" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Pigeon" ADD COLUMN     "back" TEXT,
ADD COLUMN     "balance" TEXT,
ADD COLUMN     "endurance" TEXT,
ADD COLUMN     "eyeColor" TEXT,
ADD COLUMN     "featherColor" TEXT,
ADD COLUMN     "forkAlignment" TEXT,
ADD COLUMN     "forkStrength" TEXT,
ADD COLUMN     "length" TEXT,
ADD COLUMN     "muscles" TEXT,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "vitality" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLogin" TIMESTAMP(3),
ALTER COLUMN "firebaseUid" SET NOT NULL;

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionGalleryItem" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChampionGalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "ChampionGalleryItem_order_idx" ON "ChampionGalleryItem"("order");

-- CreateIndex
CREATE INDEX "ChampionGalleryItem_isActive_idx" ON "ChampionGalleryItem"("isActive");

-- CreateIndex
CREATE INDEX "Bid_auctionId_maxBid_idx" ON "Bid"("auctionId", "maxBid");
