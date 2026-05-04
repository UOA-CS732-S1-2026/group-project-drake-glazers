-- DropForeignKey
ALTER TABLE "memory_items" DROP CONSTRAINT "memory_items_memory_id_fkey";

-- DropTable
DROP TABLE "memory_items";

-- AlterTable
ALTER TABLE "memories" ADD COLUMN "description" TEXT;
ALTER TABLE "memories" ADD COLUMN "relative_area" TEXT;
