#!/usr/bin/env node
/**
 * scrape-campings-advanced.js
 * Advanced scraping with Puppeteer + CSV export
 * Usage: node scripts/scrape-campings-advanced.js [region] [output.csv]
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REGIONS = {
  'Provence': 'provence-alpes-cote-d-azur',
  'Aquitaine': 'aquitaine',
  'Dordogne': 'dordogne',
  'Languedoc': 'languedoc-roussillon',
  'Bretagne': 'bretagne',
  'Loire': 'pays-de-la-loire',
  'Alpes': 'auvergne-rhone-alpes',
  'Normandie': 'normandie'
};

async function scrapeCampings(regionInput = null, outputFile = 'campings.csv') {
  let browser;
  const campings = [];

  try {
    console.log('🚀 Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Determine regions to scrape
    const regions = regionInput
      ? Object.entries(REGIONS)
          .filter(([key]) => key.toLowerCase().includes(regionInput.toLowerCase()))
          .map(([, val]) => val)
      : Object.values(REGIONS);

    if (regions.length === 0) {
      console.log('❌ Region not found. Available:');
      console.log(Object.keys(REGIONS).join(', '));
      process.exit(1);
    }

    console.log(`📍 Scraping regions: ${regions}`);

    for (const region of regions) {
      const searchUrl = `https://www.acamping.fr/camping/search?region=${region}&limit=100`;

      try {
        console.log(`⏳ Scraping: ${region}...`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });

        // Extract campings from page
        const regionCampings = await page.evaluate(() => {
          const results = [];
          const items = document.querySelectorAll('[data-camping-id], .camping-item, .search-result');

          items.forEach(item => {
            const name = item.querySelector('h2, .name, [class*="title"]')?.textContent?.trim() || '';
            const email = item.querySelector('[href^="mailto:"]')?.getAttribute('href')?.replace('mailto:', '') || '';
            const phone = item.querySelector('[href^="tel:"]')?.textContent?.trim() || '';
            const address = item.querySelector('.address, [class*="location"]')?.textContent?.trim() || '';
            const link = item.querySelector('a')?.getAttribute('href') || '';

            if (name) {
              results.push({ name, email, phone, address, link });
            }
          });

          return results;
        });

        campings.push(...regionCampings.map(c => ({
          ...c,
          region: region.replace(/[-_]/g, ' ').toUpperCase()
        })));

        console.log(`  ✅ Found ${regionCampings.length} campings`);

        // Respectful delay
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.log(`⚠️  Error scraping ${region}: ${error.message}`);
      }
    }

    await browser.close();

    if (campings.length > 0) {
      exportToCSV(campings, outputFile);
    } else {
      console.log('⚠️  No campings extracted (may need manual verification of page structure)');
      console.log('💡 Tip: Inspect acamping.fr page and update selectors in script');
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

function exportToCSV(campings, filename) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const csvPath = path.join(dataDir, filename);

  // Remove duplicates
  const unique = Array.from(
    new Map(campings.map(c => [c.name, c])).values()
  );

  // CSV headers
  const headers = ['Nom', 'Région', 'Téléphone', 'Email', 'Adresse', 'Lien'];

  // CSV rows
  const rows = unique.map(c => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.region}"`,
    `"${c.phone}"`,
    `"${c.email}"`,
    `"${c.address.replace(/"/g, '""')}"`,
    `"${c.link}"`
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  fs.writeFileSync(csvPath, csvContent, 'utf-8');

  console.log(`\n✅ Export complete!`);
  console.log(`📊 Total unique campings: ${unique.length}`);
  console.log(`📁 Saved to: ${csvPath}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Open ${filename} in Excel/Google Sheets`);
  console.log(`   2. Verify phone/email data`);
  console.log(`   3. Filter by size/rating`);
  console.log(`   4. Send prospection emails with PDF`);
}

// Run
const region = process.argv[2] || null;
const output = process.argv[3] || 'campings.csv';

scrapeCampings(region, output);
