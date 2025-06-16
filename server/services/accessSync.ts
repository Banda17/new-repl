import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { db } from "@db";
import { railwayLoadingOperations } from "@db/schema";
import { format, parse } from "date-fns";

// Increase buffer size to 100MB
const execAsync = (command: string, execOptions?: any) => {
  return promisify(exec)(command, execOptions);
};

// Setup Google Drive client using service account credentials file
let auth;
try {
  const credentialsPath = '/home/runner/workspace/nimble-willow-433310-n1-f8d544889cfe.json';
  console.log('Loading credentials from:', credentialsPath);

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Credentials file not found at ${credentialsPath}`);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  console.log('Initializing auth with credentials for:', credentials.client_email);

  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  });
} catch (error) {
  console.error('Error setting up Google auth:', error);
  throw new Error('Failed to initialize Google credentials');
}

const drive = google.drive({ version: 'v3', auth });

async function downloadFileFromDrive(fileId: string, localPath: string) {
  try {
    console.log(`Starting download from Drive: ${fileId}`);
    const dest = fs.createWriteStream(localPath);
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    await new Promise((resolve, reject) => {
      response.data
        .on('end', () => resolve(true))
        .on('error', reject)
        .pipe(dest);
    });

    console.log(`[${new Date().toISOString()}] Successfully downloaded Access database from Google Drive`);
    return true;
  } catch (error) {
    console.error('Error downloading file from Google Drive:', error);
    throw error;
  }
}

async function processTableInChunks(localPath: string, table: string) {
  try {
    console.log(`Starting to process table ${table} with enhanced logging...`);
    console.log('Step 1: Getting column headers...');

    // Add timeout for mdb-export command
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Command timed out')), 60000); // 60 second timeout
    });

    // Increase buffer size to 100MB
    const execOptions = { maxBuffer: 100 * 1024 * 1024 }; // 100MB buffer

    // First, get the column names using mdb-export with timeout
    console.log('Executing mdb-export for headers...');
    const headerPromise = execAsync(`mdb-export "${localPath}" "${table}" -H`, execOptions);
    const { stdout: headerRow } = await Promise.race([headerPromise, timeoutPromise]) as { stdout: string };
    const columns = headerRow.trim().split(',').map(col => col.replace(/"/g, ''));
    console.log(`Found ${columns.length} columns:`, columns);

    // Now export the data in CSV format with timeout
    console.log('Step 2: Exporting data...');
    const dataPromise = execAsync(`mdb-export "${localPath}" "${table}" -Q`, execOptions); // Added -Q for quoted output
    const { stdout: data } = await Promise.race([dataPromise, timeoutPromise]) as { stdout: string };

    console.log('Step 3: Processing data rows...');
    const lines = data.split('\n').filter(line => line.trim());
    const totalRows = lines.length;
    console.log(`Total rows to process: ${totalRows}`);

    // Process in smaller batches to manage memory
    const batchSize = 1000;
    for (let batchStart = 0; batchStart < lines.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, lines.length);
      console.log(`Processing batch ${Math.floor(batchStart/batchSize) + 1}/${Math.ceil(lines.length/batchSize)}`);

      const rows = lines.slice(batchStart, batchEnd).map((line, idx) => {
        if (idx % 100 === 0) {
          console.log(`Processing row ${batchStart + idx} of ${totalRows}`);
        }
        const values = line.split(',').map(val => val.replace(/^"(.*)"$/, '$1').trim());
        const row: any = {};
        columns.forEach((col, idx) => {
          const value = values[idx] ?? null;

          // Convert date fields
          if (col === 'P DATE' || col === 'RR DATE') {
            try {
              row[col] = value ? new Date(value) : null;
            } catch (e) {
              console.error(`Error parsing date for ${col}:`, e);
              row[col] = null;
            }
          }
          // Convert numeric fields
          else if (['WAGONS', 'UNITS', 'RR NO FROM', 'RR NO TO', 'TONNAGE', 'FREIGHT', 'T_INDENTS', 'O/S INDENTS'].includes(col)) {
            row[col] = value ? parseFloat(value) : null;
          }
          else {
            row[col] = value;
          }
        });
        return row;
      });

      console.log(`Step 4: Inserting batch of ${rows.length} rows into database...`);
      // Insert the data into PostgreSQL in smaller chunks
      const chunkSize = 10; // Very small chunk size for better reliability
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        try {
          await Promise.all(chunk.map(row => 
            db.insert(railwayLoadingOperations).values({
              pDate: row['P DATE'],
              station: row['STATION'],
              siding: row['SIDING'],
              imported: row['IMPORTED'],
              commodity: row['COMMODITY'],
              commType: row['COMM TYPE'],
              commCg: row['COMM CG'],
              demand: row['DEMAND'],
              state: row['STATE'],
              rly: row['RLY'],
              wagons: row['WAGONS'],
              type: row['TYPE'],
              units: row['UNITS'],
              loadingType: row['LOADING TYPE'],
              rrNoFrom: row['RR NO FROM'],
              rrNoTo: row['RR NO TO'],
              rrDate: row['RR DATE'],
              tonnage: row['TONNAGE'],
              freight: row['FREIGHT'],
              tIndents: row['T_INDENTS'],
              osIndents: row['O/S INDENTS']
            })
          ));
          if (i % 100 === 0) {
            console.log(`Inserted chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(rows.length/chunkSize)} of current batch`);
          }
        } catch (error) {
          console.error(`Error inserting chunk ${Math.floor(i/chunkSize) + 1}:`, error);
          continue;
        }
      }

      // Force garbage collection between batches
      if (global.gc) {
        global.gc();
      }
    }

    console.log(`Successfully processed all ${totalRows} rows from table ${table}`);
    return totalRows;
  } catch (error) {
    if (error instanceof Error && error.message === 'Command timed out') {
      console.error(`Timeout processing table ${table}`);
      return 0;
    }
    console.error(`Error processing table ${table}:`, error);
    return 0;
  }
}

export async function initConnection(driveFileId: string) {
  try {
    const localPath = path.join('/home/runner/workspace/temp', 'database.mdb');

    // Ensure temp directory exists
    await fs.promises.mkdir('/home/runner/workspace/temp', { recursive: true });

    // Download the file from Google Drive
    await downloadFileFromDrive(driveFileId, localPath);

    // Verify the file exists and is accessible
    if (!fs.existsSync(localPath)) {
      throw new Error(`Access database file not found at: ${localPath}`);
    }

    // Store the paths
    process.env.ACCESS_DB_PATH = localPath;
    process.env.DRIVE_FILE_ID = driveFileId;

    console.log(`[${new Date().toISOString()}] Successfully verified Access database at ${localPath}`);
    return true;
  } catch (error) {
    console.error('Error connecting to Access database:', error);
    throw error;
  }
}

export async function syncAccessData() {
  try {
    const localPath = process.env.ACCESS_DB_PATH;
    const driveFileId = process.env.DRIVE_FILE_ID;

    if (!localPath || !driveFileId) {
      throw new Error('Database path or Drive File ID not set');
    }

    // Re-download the file to get latest version
    await downloadFileFromDrive(driveFileId, localPath);

    if (!fs.existsSync(localPath)) {
      throw new Error('Database file not found');
    }

    // Clear any existing data before new sync
    await db.delete(railwayLoadingOperations);

    // Get list of tables
    const { stdout: tables } = await execAsync(`mdb-tables "${localPath}"`);
    console.log('Available tables:', tables);

    // Only process the LOADING T table
    const targetTable = 'LOADING T';
    if (!tables.includes(targetTable)) {
      throw new Error(`Table "${targetTable}" not found in the database`);
    }

    console.log(`Starting to process table: ${targetTable}`);
    const result = await processTableInChunks(localPath, targetTable);
    console.log(`Completed processing table ${targetTable} with ${result} records`);

    console.log(`[${new Date().toISOString()}] Successfully synced data to PostgreSQL database`);
    return { [targetTable]: result };
  } catch (error) {
    console.error('Error syncing Access data:', error);
    throw error;
  }
}

export async function initializeAccessSync(driveFileId: string) {
  try {
    console.log('Starting Access sync initialization...');

    // Initialize connection
    await initConnection(driveFileId);
    console.log('Connection initialized successfully');

    // Perform initial sync
    const initialResults = await syncAccessData();
    console.log('Initial sync completed with results:', initialResults);

    console.log('Access database sync initialized successfully');
    return initialResults;
  } catch (error) {
    console.error('Failed to initialize Access sync:', error);
    throw error;
  }
}