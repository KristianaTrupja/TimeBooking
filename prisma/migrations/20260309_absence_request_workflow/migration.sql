-- Add absence request/review workflow fields.
ALTER TABLE `Absence`
  ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN `reviewedById` INTEGER NULL,
  ADD COLUMN `reviewedAt` DATETIME(3) NULL;

DROP INDEX `Absence_userId_type_idx` ON `Absence`;
DROP INDEX `Absence_startDate_endDate_type_idx` ON `Absence`;

-- Keep reads fast for status-aware calendar/list queries.
CREATE INDEX `Absence_userId_type_status_idx` ON `Absence`(`userId`, `type`, `status`);
CREATE INDEX `Absence_startDate_endDate_type_status_idx` ON `Absence`(`startDate`, `endDate`, `type`, `status`);
