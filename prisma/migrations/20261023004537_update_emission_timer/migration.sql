-- CreateTable
CREATE TABLE "EmissionTimer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "region" TEXT NOT NULL DEFAULT 'RU',
    "previousStart" DATETIME,
    "previousEnd" DATETIME,
    "nextPredicted" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
