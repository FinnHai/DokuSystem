const ExcelJS = require('exceljs');
const demoData = require('./dist/demoData').FULL_DEMO_DOC;
const moduleDefs = require('./dist/modules').MODULE_DEFS;

async function exportExample() {
  const workbook = new ExcelJS.Workbook();
  
  // Overview sheet
  const overview = workbook.addWorksheet('Übersicht');
  overview.columns = [
    { header: 'Modul', key: 'module', width: 15 },
    { header: 'Titel', key: 'title', width: 30 },
    { header: 'Status', key: 'status', width: 15 }
  ];
  
  moduleDefs.forEach((def, idx) => {
    const data = demoData[def.key] || {};
    overview.addRow({
      module: `B.${idx + 1}`,
      title: def.title,
      status: 'Ausgefüllt'
    });
  });
  
  // Individual module sheets
  moduleDefs.forEach((def, idx) => {
    const data = demoData[def.key] || {};
    const sheet = workbook.addWorksheet(`B.${idx + 1} ${def.title.substring(0, 20)}`);
    
    sheet.columns = [
      { header: 'Feld', key: 'field', width: 25 },
      { header: 'Wert', key: 'value', width: 50 }
    ];
    
    // Add fields
    Object.entries(data).forEach(([key, value]) => {
      let displayValue = value;
      if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      }
      sheet.addRow({
        field: key,
        value: String(displayValue).substring(0, 200)
      });
    });
  });
  
  await workbook.xlsx.writeFile('/tmp/BesiDoc-Beispiel.xlsx');
  console.log('✅ Excel-Export erstellt: /tmp/BesiDoc-Beispiel.xlsx');
}

exportExample().catch(err => {
  console.error('Fehler:', err);
  process.exit(1);
});
