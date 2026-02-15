-- AlterTable
ALTER TABLE "Sessions" ADD COLUMN     "ClientType" TEXT NOT NULL DEFAULT 'web',
ADD COLUMN     "DeviceName" TEXT,
ADD COLUMN     "DeviceType" TEXT;
