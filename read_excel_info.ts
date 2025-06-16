import { read, utils } from 'xlsx';
import fs from 'fs';

try {
  console.log('Reading Excel file...');
  const filePath = './attached_assets/LOADING T.xlsx';
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = read(fileBuffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = utils.sheet_to_json(worksheet);

  console.log(`File contains ${jsonData.length} rows`);
  console.log('Sample of first row:', JSON.stringify(jsonData[0], null, 2));
} catch (error) {
  console.error('Error reading Excel file:', error);
}
