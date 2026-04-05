/*
  # Set Workbook Course Prices to Zero

  ## Summary
  Updates the price of all courses with "workbook" format type to 0.

  ## Changes
  - Modified Table: `courses`
    - Sets `price = 0` for all rows where `format_types` array contains 'workbook'

  ## Notes
  - Affects 34 courses currently priced at 2.90 USD
  - Only workbook format courses are affected; other formats remain unchanged
*/

UPDATE courses
SET price = 0, updated_at = now()
WHERE 'workbook' = ANY(format_types);
