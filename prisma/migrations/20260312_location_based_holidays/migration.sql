-- Create table for holiday/user location mapping
CREATE TABLE `Location` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Location_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add location columns as nullable first so we can backfill existing rows.
ALTER TABLE `User` ADD COLUMN `locationId` INTEGER NULL;
ALTER TABLE `Holidays` ADD COLUMN `locationId` INTEGER NULL;

-- Ensure there is at least one default location for existing data.
-- Existing records are mapped to Albania per product requirement.
SET @default_location_name := 'Albania';
INSERT INTO `Location` (`name`, `createdAt`, `updatedAt`)
SELECT @default_location_name, NOW(3), NOW(3)
WHERE NOT EXISTS (
  SELECT 1
  FROM `Location`
  WHERE `name` COLLATE utf8mb4_unicode_ci = @default_location_name COLLATE utf8mb4_unicode_ci
);

SET @default_location_id := (
  SELECT `id` FROM `Location` WHERE `name` = @default_location_name LIMIT 1
);

-- Backfill historical records into the default location.
UPDATE `User`
SET `locationId` = @default_location_id
WHERE `locationId` IS NULL;

UPDATE `Holidays`
SET `locationId` = @default_location_id
WHERE `locationId` IS NULL;

-- Enforce non-null location ownership.
ALTER TABLE `User` MODIFY `locationId` INTEGER NOT NULL;
ALTER TABLE `Holidays` MODIFY `locationId` INTEGER NOT NULL;

-- Replace global holiday uniqueness with per-location uniqueness.
DROP INDEX `Holidays_date_key` ON `Holidays`;
DROP INDEX `Holidays_date_idx` ON `Holidays`;
CREATE UNIQUE INDEX `Holidays_date_locationId_key` ON `Holidays`(`date`, `locationId`);
CREATE INDEX `Holidays_locationId_date_idx` ON `Holidays`(`locationId`, `date`);

-- Add indexes and foreign keys for relations.
CREATE INDEX `User_locationId_idx` ON `User`(`locationId`);

ALTER TABLE `User`
  ADD CONSTRAINT `User_locationId_fkey`
  FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Holidays`
  ADD CONSTRAINT `Holidays_locationId_fkey`
  FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
