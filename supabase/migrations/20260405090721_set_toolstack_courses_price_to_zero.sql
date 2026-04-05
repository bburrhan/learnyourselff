/*
  # Set Toolstack Course Prices to Zero

  ## Summary
  Updates the price of all courses with "toolstack" format type to 0.

  ## Changes
  - Modified Table: `courses`
    - Sets `price = 0` for all rows where `format_types` array contains 'toolstack'
*/

UPDATE courses
SET price = 0, updated_at = now()
WHERE 'toolstack' = ANY(format_types);
