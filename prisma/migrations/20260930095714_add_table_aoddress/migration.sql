-- CreateTable
CREATE TABLE "Aaddress" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "road" TEXT NOT NULL,
    "housenumber" TEXT,
    "observasion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aaddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aaddress_userId_idx" ON "Aaddress"("userId");

-- AddForeignKey
ALTER TABLE "Aaddress" ADD CONSTRAINT "Aaddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
