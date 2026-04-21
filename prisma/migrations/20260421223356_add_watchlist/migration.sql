-- CreateTable
CREATE TABLE "WatchlistMovie" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "movieData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistMovie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchlistMovie_userId_idx" ON "WatchlistMovie"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistMovie_userId_tmdbId_key" ON "WatchlistMovie"("userId", "tmdbId");
