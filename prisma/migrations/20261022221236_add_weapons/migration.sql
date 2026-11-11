-- CreateTable
CREATE TABLE "Weapon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "damage" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "range" INTEGER NOT NULL,
    "fireRate" INTEGER NOT NULL,
    "recoil" INTEGER NOT NULL,
    CONSTRAINT "Weapon_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeaponModule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "damageMod" INTEGER NOT NULL DEFAULT 0,
    "accuracyMod" INTEGER NOT NULL DEFAULT 0,
    "recoilMod" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "_WeaponToWeaponModule" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_WeaponToWeaponModule_A_fkey" FOREIGN KEY ("A") REFERENCES "Weapon" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_WeaponToWeaponModule_B_fkey" FOREIGN KEY ("B") REFERENCES "WeaponModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Weapon_itemId_key" ON "Weapon"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "_WeaponToWeaponModule_AB_unique" ON "_WeaponToWeaponModule"("A", "B");

-- CreateIndex
CREATE INDEX "_WeaponToWeaponModule_B_index" ON "_WeaponToWeaponModule"("B");
