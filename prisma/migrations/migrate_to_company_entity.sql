-- =====================================================
-- Migration: Convert company string to Company entity
-- =====================================================
-- This script migrates from static company strings to the Company entity
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS!

-- Step 1: Populate Company table with unique company names from Projects
INSERT INTO `Company` (`name`, `isActive`, `createdAt`, `updatedAt`)
SELECT DISTINCT 
  `company`,
  true as isActive,
  NOW(3) as createdAt,
  NOW(3) as updatedAt
FROM `Projects`
WHERE `company` NOT IN (SELECT `name` FROM `Company`)
  AND `company` IS NOT NULL
  AND `company` != '';

-- Step 2: Update Projects.companyId with correct Company IDs
UPDATE `Projects` p
INNER JOIN `Company` c ON p.`company` = c.`name`
SET p.`companyId` = c.`id`
WHERE p.`companyId` IS NULL;

-- Step 3: Verify all projects have companyId (should return 0)
-- SELECT COUNT(*) as projects_without_company FROM `Projects` WHERE `companyId` IS NULL;

-- Step 4: Make companyId NOT NULL
ALTER TABLE `Projects` 
MODIFY COLUMN `companyId` INT NOT NULL;

-- Step 5: Add foreign key constraint if not exists
ALTER TABLE `Projects` 
ADD CONSTRAINT IF NOT EXISTS `Projects_companyId_fkey` 
  FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Drop old unique constraint
ALTER TABLE `Projects` 
DROP INDEX IF EXISTS `Projects_company_project_key`;

-- Step 7: Add new unique constraint on companyId + project
ALTER TABLE `Projects` 
ADD UNIQUE INDEX IF NOT EXISTS `Projects_companyId_project_key`(`companyId`, `project`);

-- Step 8: Add index on companyId for better query performance
ALTER TABLE `Projects` 
ADD INDEX IF NOT EXISTS `Projects_companyId_idx`(`companyId`);

-- Step 9: Drop the old company column (AFTER VERIFICATION!)
-- Uncomment the next line ONLY after verifying everything works
-- ALTER TABLE `Projects` DROP COLUMN `company`;

-- Step 10: Clean up SidebarProject if needed
-- Remove companyId and companyRel from SidebarProject (not needed)
-- Uncomment the next lines ONLY after verifying everything works
-- ALTER TABLE `SidebarProject` DROP FOREIGN KEY IF EXISTS `SidebarProject_companyId_fkey`;
-- ALTER TABLE `SidebarProject` DROP INDEX IF EXISTS `SidebarProject_companyId_idx`;
-- ALTER TABLE `SidebarProject` DROP COLUMN IF EXISTS `companyId`;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify the migration was successful:

-- Check all companies exist
-- SELECT * FROM Company ORDER BY name;

-- Check all projects have companyId
-- SELECT p.id, p.companyId, c.name as company_name, p.project 
-- FROM Projects p
-- JOIN Company c ON p.companyId = c.id
-- LIMIT 20;

-- Check for any orphaned projects (should return 0)
-- SELECT COUNT(*) as orphaned_projects 
-- FROM Projects p
-- LEFT JOIN Company c ON p.companyId = c.id
-- WHERE c.id IS NULL;

-- =====================================================
-- Rollback (if needed)
-- =====================================================
-- If something goes wrong, restore from your backup!
