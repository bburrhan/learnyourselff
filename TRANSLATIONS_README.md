# Translation Management Guide

This project uses a CSV-based workflow for managing translations across multiple languages.

## Quick Start

### 1. Export Current Translations to CSV

```bash
npm run translations:export
```

This creates a `translations.csv` file in the root directory with all current translations.

### 2. Edit the CSV File

Open `translations.csv` in Excel, Google Sheets, or any spreadsheet application.

The CSV structure:
- **First column**: Translation keys (don't modify these)
- **Subsequent columns**: One column per language (en, tr, etc.)

#### Adding a New Language

Simply add a new column with the language code as the header:

```csv
key,en,tr,es,de
home,Home,Ana Sayfa,Inicio,Startseite
```

#### Adding New Translation Keys

Add a new row with:
- Translation key in the first column
- Translations for each language in the subsequent columns

```csv
key,en,tr
newFeature,New Feature,Yeni Özellik
```

### 3. Import Updated Translations

After editing the CSV file, import the changes:

```bash
npm run translations:import
```

This will update the `src/lib/i18n.ts` file with your changes.

## Best Practices

### CSV Editing Tips

1. **Use a proper spreadsheet editor** (Excel, Google Sheets, LibreOffice Calc)
   - These handle special characters and quotes correctly
   - Avoid editing in plain text editors

2. **Keep translation keys consistent**
   - Use camelCase for keys (e.g., `heroTitle`, `contactUs`)
   - Don't modify existing keys unless renaming across all languages

3. **Handle special characters**
   - Apostrophes and quotes are automatically escaped
   - No need to worry about commas within text

4. **Empty translations**
   - Leave cells empty if translation is not yet available
   - The system will fall back to English

### Adding a New Language

1. Export current translations: `npm run translations:export`
2. Open `translations.csv`
3. Add a new column with the language code (e.g., `es`, `fr`, `de`)
4. Fill in translations for the new language
5. Import: `npm run translations:import`
6. Update language selector in the application

### Workflow Example

```bash
# Export current state
npm run translations:export

# Edit translations.csv in Excel/Google Sheets
# - Add Spanish column (es)
# - Translate all keys
# - Add new feature keys

# Import changes
npm run translations:import

# Test the application
npm run dev
```

## File Structure

- `translations.csv` - Your working translation file (edit this)
- `src/lib/i18n.ts` - Generated translation file (auto-updated by import)
- `scripts/translation-manager.ts` - The management script

## Troubleshooting

### Import fails after editing CSV

- Check that the first row has language codes
- Ensure no extra commas or formatting issues
- Try re-exporting and re-applying your changes

### Special characters not working

- Make sure you're using a proper CSV editor
- Check that quotes are properly escaped in the CSV

### New language not appearing

- Verify the language code column is added correctly
- Update the language selector component if needed
- Check browser cache and reload

## Current Languages

- **en** - English (default)
- **tr** - Turkish

## Translation Keys Structure

The translations are organized by section:

- **Navigation** - Menu items, links
- **Homepage** - Hero sections, features, testimonials
- **Course** - Course details, pricing, enrollment
- **Filters** - Search and filter options
- **Checkout** - Payment process
- **Dashboard** - User dashboard, courses
- **Admin** - Admin panel sections
- **Common** - Reusable terms and actions
- **Profile & Settings** - User profile management
- **Contact & Support** - Contact page, help
- **Blog** - Blog sections
- **Categories** - Course categories
- **Testimonials** - User testimonials
