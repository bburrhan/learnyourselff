/*
  # Set Checklist Course Prices to Zero

  ## Summary
  Updates the price of all courses with "checklist" format type to 0.

  ## Changes
  - Modified Table: `courses`
    - Sets `price = 0` for all rows where `format_types` array contains 'checklist'
*/

UPDATE courses
SET price = 0, updated_at = now()
WHERE 'checklist' = ANY(format_types);
