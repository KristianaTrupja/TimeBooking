-- Extend absence types with additional leave categories.
ALTER TABLE `Absence`
  MODIFY COLUMN `type` ENUM(
    'VACATION',
    'SICK',
    'PERSONAL',
    'PARENTAL',
    'MARRIAGE',
    'BEREAVEMENT'
  ) NOT NULL;
