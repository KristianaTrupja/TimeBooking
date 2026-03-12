-- Hotfix for partially applied 20260312_location_based_holidays migration.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS `Location` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Location_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `locationId` INTEGER NULL;
ALTER TABLE `Holidays` ADD COLUMN IF NOT EXISTS `locationId` INTEGER NULL;

INSERT INTO `Location` (`name`, `createdAt`, `updatedAt`)
SELECT 'Albania', NOW(3), NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Location` WHERE LOWER(`name`) = LOWER('Albania')
);

SET @albania_id := (
  SELECT `id` FROM `Location`
  WHERE LOWER(`name`) = LOWER('Albania')
  ORDER BY `id`
  LIMIT 1
);

UPDATE `User`
SET `locationId` = @albania_id
WHERE `locationId` IS NULL;

UPDATE `Holidays`
SET `locationId` = @albania_id
WHERE `locationId` IS NULL;

ALTER TABLE `User` MODIFY `locationId` INTEGER NOT NULL;
ALTER TABLE `Holidays` MODIFY `locationId` INTEGER NOT NULL;

SET @drop_holidays_date_key := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'Holidays'
        AND index_name = 'Holidays_date_key'
    ),
    'DROP INDEX `Holidays_date_key` ON `Holidays`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @drop_holidays_date_key;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_holidays_date_idx := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'Holidays'
        AND index_name = 'Holidays_date_idx'
    ),
    'DROP INDEX `Holidays_date_idx` ON `Holidays`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @drop_holidays_date_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_holidays_unique := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'Holidays'
        AND index_name = 'Holidays_date_locationId_key'
    ),
    'SELECT 1',
    'CREATE UNIQUE INDEX `Holidays_date_locationId_key` ON `Holidays`(`date`, `locationId`)'
  )
);
PREPARE stmt FROM @create_holidays_unique;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_holidays_idx := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'Holidays'
        AND index_name = 'Holidays_locationId_date_idx'
    ),
    'SELECT 1',
    'CREATE INDEX `Holidays_locationId_date_idx` ON `Holidays`(`locationId`, `date`)'
  )
);
PREPARE stmt FROM @create_holidays_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_user_location_idx := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'User'
        AND index_name = 'User_locationId_idx'
    ),
    'SELECT 1',
    'CREATE INDEX `User_locationId_idx` ON `User`(`locationId`)'
  )
);
PREPARE stmt FROM @create_user_location_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_user_location_fk := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'User'
        AND constraint_name = 'User_locationId_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE `User` ADD CONSTRAINT `User_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE'
  )
);
PREPARE stmt FROM @add_user_location_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_holidays_location_fk := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'Holidays'
        AND constraint_name = 'Holidays_locationId_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE `Holidays` ADD CONSTRAINT `Holidays_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
  )
);
PREPARE stmt FROM @add_holidays_location_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
