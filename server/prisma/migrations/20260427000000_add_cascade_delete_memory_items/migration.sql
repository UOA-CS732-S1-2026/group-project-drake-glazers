ALTER TABLE "memory_items" DROP CONSTRAINT "memory_items_memory_id_fkey";
ALTER TABLE "memory_items" ADD CONSTRAINT "memory_items_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
