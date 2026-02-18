/*
  # Remove difficulty_level from courses

  1. Changes
    - Drop the `idx_courses_difficulty` index on `courses(difficulty_level)`
    - Drop the `difficulty_level` column from the `courses` table

  2. Reason
    - Course level/difficulty is being removed from all modules
*/

DROP INDEX IF EXISTS idx_courses_difficulty;

ALTER TABLE courses DROP COLUMN IF EXISTS difficulty_level;
