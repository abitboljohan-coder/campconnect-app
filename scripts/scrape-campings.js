#!/usr/bin/env node
/**
 * scrape-campings.js
 * Scrape campings from acamping.fr and export to CSV
 * Usage: node scripts/scrape-campings.js [region] [output.csv]
 * Example: node scripts/scrape-campings.js "provence" campings.csv
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const BASE_URL = 'https://www.acamping.fr';
const REGIONS = [
  'Auvergne-Rhone-Alpes',
  'Bourgogne-Franche-Comte',
  'Bretagne',
  'Centre-Val-de-Loire',
  'Corse',
  'Grand-Est',
  'Hauts-de-France',
  'Ile-de-France',
  'Nouvelle-Aquitaine',
  'Normandie',
  'Occitanie',
  'Pays-de-la-Loire',
  'Provence-Alpes-Cote-d-Azur',
  'Bourgogne',
  'Alsace',
  'Aquitaine',
  'Champagne-Ardenne',
  'Franche-Comte',
  'Languedoc-Roussillon',
  'Limousin',
  'Lorraine',
  'Midi-Pyrenees',
  'Nord-Pas-de-Calais',
  'Picardie',
  'Poitou-Charentes',
  'Rhone-Alpes'
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function scrapeCampings(regionFilter = null, outputFile = 'campings.csv') {
  const campings = [];
  const regionsToScrape = regionFilter
    ? REGIONS.filter(r => r.toLowerCase().includes(regionFilter.toLowerCase()))
    : REGIONS;

  if (regionsToScrape.length === 0) {
    console.log('❌ Region not found. Available regions:');
    console.log(REGIONS.join(', '));
    process.exit(1);
  }

  console.log(`📍 Scraping campings from: ${regionsToScrape.join(', ')}`);

  for (const region of regionsToScrape) {
    try {
      // This is a placeholder - acamping.fr may require more sophisticated scraping
      // or may have an API. Adjust based on actual website structure.

      const searchUrl = `${BASE_URL}/camping/search?region=${encodeURIComponent(region)}&limit=500`;
      console.log(`⏳ Processing: ${region}...`);

      const response = await fetch(searchUrl, { headers: HEADERS });

      if (!response.ok) {
        console.log(`⚠️  Skipped ${region} (status ${response.status})`);
        continue;
      }

      // Note: This example assumes JSON API response
      // Real implementation may need HTML parsing with cheerio

      const data = await response.json().catch(() => ({ results: [] }));

      if (data.results && Array.isArray(data.results)) {
        data.results.forEach(camping => {
          campings.push({
            nom: camping.name || '',
            region: region,
            telefone: camping.phone || '',
            email: camping.email || '',
            adresse: camping.address || '',
            site: camping.website || '',
            note: camping.rating || '',
            emplacements: camping.slots || '?',
            categorie: camping.category || ''
          });
        });
        console.log(`  ✅ Found ${data.results.length} campings`);
      }

      // Respectful delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`⚠️  Error scraping ${region}: ${error.message}`);
    }
  }

  // Export to CSV
  if (campings.length > 0) {
    exportToCSV(campings, outputFile);
  } else {
    console.log('❌ No campings found');
    process.exit(1);
  }
}

function exportToCSV(campings, filename) {
  const csvPath = path.join(__dirname, '..', 'data', filename);

  // Ensure data directory exists
  const dataDir = path.dirname(csvPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // CSV header
  const headers = ['Nom', 'Région', 'Téléphone', 'Email', 'Adresse', 'Site Web', 'Note', 'Emplacements', 'Catégorie'];

  // CSV rows
  const rows = campings.map(c => [
    `"${c.nom.replace(/"/g, '""')}"`,
    `"${c.region}"`,
    `"${c.telefone}"`,
    `"${c.email}"`,
    `"${c.adresse.replace(/"/g, '""')}"`,
    `"${c.site}"`,
    `"${c.note}"`,
    `"${c.emplacements}"`,
    `"${c.categorie}"`
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  fs.writeFileSync(csvPath, csvContent, 'utf-8');

  console.log(`\n✅ Export complete!`);
  console.log(`📊 Total campings: ${campings.length}`);
  console.log(`📁 File: ${csvPath}`);
  console.log(`\n💡 Next: Open in Excel/Sheets and start prospecting!`);
}

// Run
const region = process.argv[2] || null;
const output = process.argv[3] || 'campings.csv';

scrapeCampings(region, output).catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
