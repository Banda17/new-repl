import { read, utils } from 'xlsx';
import fs from 'fs';
import { db } from "@db";
import { railwayLoadingOperations } from "@db/schema";

async function importExcelData(startIndex = 0) {
  try {
    console.log('Reading Excel file...');
    const filePath = './attached_assets/LOADING T.xlsx';

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Cache the Excel data for faster processing
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet);

    // Process 2000 records at a time (increased from 1000)
    const chunkSize = 2000;
    const endIndex = Math.min(startIndex + chunkSize, 2000); // Limit to first 2000 records
    const currentChunk = jsonData.slice(startIndex, endIndex);

    console.log(`Processing records ${startIndex + 1} to ${endIndex} of ${jsonData.length} total records`);

    // Convert Excel serial number to Date
    const excelSerialToDate = (serial: number) => {
      return new Date((serial - 25569) * 86400 * 1000);
    };

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 200; // Process 200 records in each transaction

    // Process batches in parallel with a limit of 8 concurrent batches
    const batches = [];
    for (let i = 0; i < currentChunk.length; i += batchSize) {
      const batch = currentChunk.slice(i, Math.min(i + batchSize, currentChunk.length));
      batches.push(batch);
    }

    // Process batches with increased concurrency
    const concurrencyLimit = 8;
    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const currentBatches = batches.slice(i, i + concurrencyLimit);
      await Promise.all(currentBatches.map(async (batch) => {
        try {
          await db.transaction(async (tx) => {
            for (const row of batch) {
              await tx.insert(railwayLoadingOperations).values({
                pDate: row['P DATE'] ? excelSerialToDate(row['P DATE']) : null,
                station: row['STATION'],
                siding: row['SIDING'],
                imported: row['IMPORTED'],
                commodity: row['COMMODITY'],
                commType: row['COMM TYPE'],
                commCg: row['COMM CG'],
                demand: row['DEMAND'],
                state: row['STATE'],
                rly: row['RLY'],
                wagons: row['WAGONS'] ? parseInt(row['WAGONS']) : null,
                type: row['TYPE'],
                units: row['UNITS'] ? parseInt(row['UNITS']) : null,
                loadingType: row['LOADING TYPE'],
                rrNoFrom: row['RR NO FROM'] ? parseInt(row['RR NO FROM']) : null,
                rrNoTo: row['RR NO TO'] ? parseInt(row['RR NO TO']) : null,
                rrDate: row['RR DATE'] ? excelSerialToDate(row['RR DATE']) : null,
                tonnage: row['TONNAGE'] ? parseFloat(row['TONNAGE']) : null,
                freight: row['FREIGHT'] ? parseFloat(row['FREIGHT']) : null,
                tIndents: row['T_INDENTS'] ? parseInt(row['T_INDENTS']) : null,
                osIndents: row['O/S INDENTS'] ? parseInt(row['O/S INDENTS']) : null
              });
            }
          });

          successCount += batch.length;
          const percentComplete = (successCount / currentChunk.length * 100).toFixed(1);
          console.log(`Imported ${successCount}/${currentChunk.length} records in current chunk (${percentComplete}%)`);

          // Force garbage collection more frequently
          if (global.gc && successCount % 400 === 0) {
            global.gc();
          }
        } catch (error) {
          errorCount += batch.length;
          console.error(`Error importing batch:`, error);
        }
      }));
    }

    console.log('Current chunk completed');
    console.log(`Successfully imported: ${successCount} records`);
    console.log(`Failed to import: ${errorCount} records`);

    // Save progress
    fs.writeFileSync('import_progress.json', JSON.stringify({
      lastProcessedIndex: endIndex,
      totalRecords: jsonData.length,
      successCount: successCount,
      errorCount: errorCount,
      timestamp: new Date().toISOString()
    }));

    return successCount;
  } catch (error) {
    console.error('Error in import process:', error);
    throw error;
  }
}

// Clear progress file to start fresh
fs.writeFileSync('import_progress.json', JSON.stringify({
  lastProcessedIndex: 0,
  totalRecords: 0,
  successCount: 0,
  errorCount: 0,
  timestamp: new Date().toISOString()
}));

// Run the import
importExcelData(0)
  .then((count) => {
    console.log(`Import process finished. Total successful imports: ${count}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });