-- Populate Company table from Projects
INSERT INTO `Company` (`name`, `isActive`, `createdAt`, `updatedAt`)
SELECT DISTINCT 
  p.`company`,
  1 as isActive,
  NOW(3) as createdAt,
  NOW(3) as updatedAt
FROM `Projects` p
WHERE p.`company` IS NOT NULL
  AND p.`company` != ''
  AND NOT EXISTS (SELECT 1 FROM `Company` c WHERE c.`name` = p.`company`);

-- Update Projects.companyId
UPDATE `Projects` p
INNER JOIN `Company` c ON p.`company` = c.`name`
SET p.`companyId` = c.`id`
WHERE p.`companyId` IS NULL;

-- Add foreign key constraint
ALTER TABLE `Projects` 
ADD CONSTRAINT IF NOT EXISTS `Projects_companyId_fkey` 
  FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update unique constraint
ALTER TABLE `Projects` DROP INDEX IF EXISTS `Projects_company_project_key`;
ALTER TABLE `Projects` ADD UNIQUE INDEX IF NOT EXISTS `Projects_companyId_project_key`(`companyId`, `project`);
ALTER TABLE `Projects` ADD INDEX IF NOT EXISTS `Projects_companyId_idx`(`companyId`);
