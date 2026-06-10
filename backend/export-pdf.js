const PDFDocument = require('pdfkit');
const fs = require('fs');
const demoData = require('./dist/demoData').FULL_DEMO_DOC;
const moduleDefs = require('./dist/modules').MODULE_DEFS;

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '').substring(0, 200) : '';
}

async function exportPDF() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream('/tmp/BesiDoc-Beispiel.pdf');
  doc.pipe(stream);
  
  // Title page
  doc.fontSize(36).font('Helvetica-Bold').text('BesiDoc', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(24).text('Online-Banking-Plattform', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(12).text('Vollständig ausgefülltes Beispiel-Dokument', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(11).text('Eine realistische Dokumentation für eine fiktive Kernbanking-Plattform');
  doc.moveDown(1);
  doc.fontSize(10).text('Status: Genehmigt (GENEHMIGT)', { color: '#08a652' });
  doc.text('Erstellt: 2026-06-10');
  
  // Table of contents
  doc.addPage();
  doc.fontSize(14).font('Helvetica-Bold').text('Inhaltsverzeichnis');
  doc.moveDown(0.5);
  doc.fontSize(10);
  moduleDefs.forEach((def, idx) => {
    doc.text(`B.${idx + 1} ${def.title}`);
  });
  
  // Module sections
  moduleDefs.forEach((def, idx) => {
    const data = demoData[def.key] || {};
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text(`B.${idx + 1} ${def.title}`);
    doc.fontSize(10).font('Helvetica').moveDown(0.5);
    
    // Add module content
    const keys = Object.keys(data).slice(0, 10);
    if (keys.length === 0) {
      doc.text('(Keine Daten)');
    } else {
      keys.forEach(key => {
        const value = data[key];
        let displayValue = value;
        if (typeof value === 'object') {
          displayValue = JSON.stringify(value).substring(0, 100);
        } else if (typeof value === 'string') {
          displayValue = stripHtml(value);
        }
        doc.fontSize(9).text(`${key}: `, { continued: true });
        doc.fontSize(9).text(String(displayValue).substring(0, 150));
      });
    }
  });
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log('✅ PDF-Export erstellt: /tmp/BesiDoc-Beispiel.pdf');
      resolve();
    });
    stream.on('error', reject);
  });
}

exportPDF().catch(err => {
  console.error('Fehler:', err);
  process.exit(1);
});
