#!/usr/bin/env node
/**
 * prospection-kit.js
 * All-in-one prospection toolkit:
 * 1. Scrape campings from acamping.fr
 * 2. Generate PDF
 * 3. Output prospection list ready for email
 * Usage: node scripts/prospection-kit.js [region]
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [command, ...args], { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function main() {
  const region = process.argv[2] || null;

  console.log('\n🚀 CampConnect Prospection Kit\n');
  console.log('═'.repeat(50));

  try {
    // Step 1: Scrape campings
    console.log('\n📍 Step 1: Scraping campings from acamping.fr...');
    console.log('─'.repeat(50));
    const csvFile = region ? `campings-${region}.csv` : 'campings.csv';
    await run(path.join(__dirname, 'scrape-campings-advanced.js'), [region || '', csvFile]);

    // Step 2: Generate PDF
    console.log('\n📄 Step 2: Generating prospection PDF...');
    console.log('─'.repeat(50));
    await run(path.join(__dirname, 'generate-pdf.js'));

    // Step 3: Summary
    console.log('\n✅ Step 3: Prospection Kit Ready!\n');
    console.log('═'.repeat(50));

    const dataDir = path.join(__dirname, '..', 'data');
    const docsDir = path.join(__dirname, '..', 'docs');
    const csvPath = path.join(dataDir, csvFile);
    const pdfPath = path.join(docsDir, 'campconnect-prospection.pdf');

    if (fs.existsSync(csvPath)) {
      const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');
      const count = Math.max(0, lines.length - 2); // Exclude header + blank
      console.log(`\n📊 CAMPINGS LIST:`);
      console.log(`   📁 ${csvPath}`);
      console.log(`   📈 Total: ${count} campings à contacter\n`);
    }

    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`📄 PDF PROSPECTION:`);
      console.log(`   📁 ${pdfPath}`);
      console.log(`   💾 Size: ${(stats.size / 1024).toFixed(1)} KB\n`);
    }

    console.log('═'.repeat(50));
    console.log('\n🎯 NEXT STEPS:\n');
    console.log('1. Open campings.csv in Google Sheets / Excel');
    console.log('2. Filter campings by:');
    console.log('   - Region (Provence, Côte d\'Azur...)');
    console.log('   - Size (150-400 emplacements = sweet spot)');
    console.log('   - Email available (exclude blanks)');
    console.log('');
    console.log('3. Use mail merge tools:');
    console.log('   - Gmail → MailMerge extension');
    console.log('   - Google Sheets → Mail Merge');
    console.log('   - HubSpot → Free CRM + automation');
    console.log('');
    console.log('4. Email template (attach campconnect-prospection.pdf):');
    console.log('   Subject: CampConnect — Votre camping mérite une app mobile 📱');
    console.log('   Body: Découvrez comment transformer l\'expérience de vos vacanciers');
    console.log('         en 48h avec une app branded à vos couleurs.');
    console.log('');
    console.log('5. Follow-up:');
    console.log('   - 2 days later: Follow-up email');
    console.log('   - 4 days later: Call + demo invite');
    console.log('   - Target: 5%+ conversion (1% is standard)');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
