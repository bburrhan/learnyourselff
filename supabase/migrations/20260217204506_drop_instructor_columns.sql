/*
  # Drop instructor columns from courses table

  1. Modified Tables
    - `courses`
      - Dropped `instructor_name` (text, was NOT NULL)
      - Dropped `instructor_bio` (text, was NOT NULL)

  2. Reason
    - Instructor fields are no longer used in the application
    - All UI references to instructor name and bio are being removed

  3. Important Notes
    - This is a destructive migration that removes data permanently
    - Existing instructor_name and instructor_bio values will be lost
*/

ALTER TABLE courses DROP COLUMN IF EXISTS instructor_name;
ALTER TABLE courses DROP COLUMN IF EXISTS instructor_bio;
