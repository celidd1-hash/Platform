-- AlterTable
ALTER TABLE "ai_knowledge" ADD COLUMN     "module_id" TEXT;

-- CreateIndex
CREATE INDEX "ai_knowledge_module_id_idx" ON "ai_knowledge"("module_id");

-- AddForeignKey
ALTER TABLE "ai_knowledge" ADD CONSTRAINT "ai_knowledge_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
