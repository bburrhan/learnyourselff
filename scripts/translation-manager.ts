import fs from 'fs';
import path from 'path';

const translationsFilePath = path.join(process.cwd(), 'src', 'lib', 'i18n.ts');
const csvFilePath = path.join(process.cwd(), 'translations.csv');

function parseTranslationsFile() {
  const content = fs.readFileSync(translationsFilePath, 'utf-8');

  const resourcesMatch = content.match(/const resources = \{([\s\S]*?)\n\}/);
  if (!resourcesMatch) {
    throw new Error('Could not find resources object in i18n.ts');
  }

  const resourcesContent = resourcesMatch[1];
  const languages: { [key: string]: { [key: string]: string } } = {};

  const langRegex = /(\w+):\s*\{[\s\S]*?translation:\s*\{([\s\S]*?)\n\s*\},?\s*\},?/g;
  let langMatch;

  while ((langMatch = langRegex.exec(resourcesContent)) !== null) {
    const lang = langMatch[1];
    const translationContent = langMatch[2];

    languages[lang] = {};

    const keyValueRegex = /(\w+):\s*'([^']*(?:\\.[^']*)*)'/g;
    let keyMatch;

    while ((keyMatch = keyValueRegex.exec(translationContent)) !== null) {
      const key = keyMatch[1];
      const value = keyMatch[2].replace(/\\'/g, "'");
      languages[lang][key] = value;
    }
  }

  return languages;
}

function exportToCSV() {
  console.log('📤 Exporting translations to CSV...');

  const languages = parseTranslationsFile();
  const langCodes = Object.keys(languages);

  if (langCodes.length === 0) {
    throw new Error('No languages found');
  }

  const allKeys = new Set<string>();
  langCodes.forEach(lang => {
    Object.keys(languages[lang]).forEach(key => allKeys.add(key));
  });

  const sortedKeys = Array.from(allKeys).sort();

  let csv = 'key,' + langCodes.join(',') + '\n';

  sortedKeys.forEach(key => {
    const values = langCodes.map(lang => {
      const value = languages[lang][key] || '';
      return `"${value.replace(/"/g, '""')}"`;
    });
    csv += `"${key}",${values.join(',')}\n`;
  });

  fs.writeFileSync(csvFilePath, csv, 'utf-8');
  console.log(`✅ Exported ${sortedKeys.length} translation keys to translations.csv`);
  console.log(`📊 Languages: ${langCodes.join(', ')}`);
}

function parseCSV(csvContent: string): { keys: string[], languages: string[], data: string[][] } {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    cells.push(currentCell);
    return cells;
  };

  const header = parseLine(lines[0]);
  const keys = header[0];
  const languages = header.slice(1);

  const data = lines.slice(1).map(line => parseLine(line));

  return { keys, languages, data };
}

function importFromCSV() {
  console.log('📥 Importing translations from CSV...');

  if (!fs.existsSync(csvFilePath)) {
    throw new Error('translations.csv not found. Run export first.');
  }

  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const { languages, data } = parseCSV(csvContent);

  const translationData: { [lang: string]: { [key: string]: string } } = {};

  languages.forEach(lang => {
    translationData[lang] = {};
  });

  data.forEach(row => {
    const key = row[0];
    if (!key) return;

    languages.forEach((lang, index) => {
      const value = row[index + 1] || '';
      translationData[lang][key] = value;
    });
  });

  let output = `import i18n from 'i18next'\nimport { initReactI18next } from 'react-i18next'\nimport { getCurrentLanguageFromUrl } from '../components/Layout/LanguageRouter'\n\nconst resources = {\n`;

  languages.forEach((lang, langIndex) => {
    output += `  ${lang}: {\n    translation: {\n`;

    const keys = Object.keys(translationData[lang]).sort();
    keys.forEach((key, keyIndex) => {
      const value = translationData[lang][key]
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      output += `      ${key}: '${value}'`;
      if (keyIndex < keys.length - 1) {
        output += ',';
      }
      output += '\n';
    });

    output += `    },\n  }`;
    if (langIndex < languages.length - 1) {
      output += ',';
    }
    output += '\n';
  });

  output += `}\n\ni18n\n  .use(initReactI18next)\n  .init({\n    resources,\n    lng: getCurrentLanguageFromUrl(),\n    fallbackLng: 'en',\n    interpolation: {\n      escapeValue: false,\n    },\n  })\n\nexport default i18n\n`;

  fs.writeFileSync(translationsFilePath, output, 'utf-8');
  console.log(`✅ Imported translations for ${languages.length} languages`);
  console.log(`📊 Total keys: ${data.length}`);
}

const command = process.argv[2];

if (command === 'export') {
  exportToCSV();
} else if (command === 'import') {
  importFromCSV();
} else {
  console.log('Usage:');
  console.log('  npm run translations:export  - Export translations to CSV');
  console.log('  npm run translations:import  - Import translations from CSV');
}
