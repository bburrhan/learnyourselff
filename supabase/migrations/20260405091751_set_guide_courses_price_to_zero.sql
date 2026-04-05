/*
  # Set Guide Course Prices to Zero

  ## Summary
  Updates the price of all courses with "guide" format type to 0.

  ## Changes
  - Modified Table: `courses`
    - Sets `price = 0` for all rows where `format_types` array contains 'guide'
*/

UPDATE courses
SET price = 0, updated_at = now()
WHERE 'guide' = ANY(format_types);
