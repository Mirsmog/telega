-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device_info" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "user_agent" TEXT,
ALTER COLUMN "client_type" DROP NOT NULL;
