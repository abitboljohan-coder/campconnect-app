#!/usr/bin/env node
/**
 * generate-pdf.js
 * Converts pdf-template.html → CampConnect prospection PDF
 * Usage: npm run generate:pdf
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, 'pdf-template.html');
const outputPath = path.join(__dirname, '..', 'docs', 'campconnect-prospection.pdf');

async function generatePDF() {
  let browser;
  try {
    console.log('📄 Génération du PDF CampConnect...');

    browser = await puppeteer.launch({
      headless: 'new',
    });

    const page = await browser.newPage();

    // Set viewport for A4
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // Load HTML template
    const htmlContent = fs.readFileSync(templatePath, 'utf-8');
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      printBackground: true,
    });

    console.log(`✅ PDF généré : ${outputPath}`);
    console.log(`📊 Taille : ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

generatePDF();
