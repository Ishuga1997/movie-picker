-- CreateTable
CREATE TABLE "WatchedMovie" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "movieData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchedMovie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchedMovie_userId_idx" ON "WatchedMovie"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchedMovie_userId_tmdbId_key" ON "WatchedMovie"("userId", "tmdbId");
