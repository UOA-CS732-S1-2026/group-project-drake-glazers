-- CreateTable
CREATE TABLE "saved_collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_memories" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_memories_collection_id_memory_id_key" ON "saved_memories"("collection_id", "memory_id");

-- AddForeignKey
ALTER TABLE "saved_collections" ADD CONSTRAINT "saved_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_memories" ADD CONSTRAINT "saved_memories_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "saved_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_memories" ADD CONSTRAINT "saved_memories_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
