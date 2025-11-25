/*
  Warnings:

  - The values [ASSIGNED,REVIEW,HOLD] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assigneeId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `category` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `Ticket` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'CANCELED');
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "TicketStatus_old";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_assigneeId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "assigneeId",
DROP COLUMN "type",
ADD COLUMN     "assigneeName" TEXT,
ADD COLUMN     "category" TEXT NOT NULL,
ALTER COLUMN "content" SET NOT NULL;

-- DropEnum
DROP TYPE "TicketType";

-- CreateTable
CREATE TABLE "TicketFile" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TicketFile" ADD CONSTRAINT "TicketFile_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
