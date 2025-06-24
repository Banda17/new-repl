import { read, utils } from "xlsx";
import { readFileSync } from "fs";
import { db } from "./db/index.js";
import { railwayLoadingOperations } from "./db/schema.js";

async function updateDatabaseFromExcel() {
  try {
    console.log("Starting database update from Excel file...");

    // Read the Excel file
    const filePath = "./attached_assets/new.xlsx";
    const fileBuffer = readFileSync(filePath);
    const workbook = read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet);

    console.log(`Found ${jsonData.length} rows in Excel file`);
    console.log("Sample data:", JSON.stringify(jsonData.slice(0, 2), null, 2));

    // Removed the step to clear existing data to preserve records
    // Previously: await db.delete(railwayLoadingOperations);
    // console.log("Clearing existing railway loading operations data...");

    // Filter rows with P DATE
    const validRows = jsonData.filter((row: any) => row["P DATE"]);
    console.log(`Processing ${validRows.length} rows with P DATE`);

    let successCount = 0;
    let errorCount = 0;

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(
        i,
        Math.min(i + batchSize, validRows.length),
      );

      for (const row of batch) {
        try {
          // Convert Excel serial date to JavaScript Date
          let pDate = null;
          if (row["P DATE"]) {
            const dateValue = row["P DATE"];

            if (typeof dateValue === "number") {
              // Handle Excel serial number dates
              const excelEpoch = new Date(1900, 0, 1);
              pDate = new Date(
                excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000,
              );

              // Adjust for Excel's leap year bug
              if (dateValue > 59) {
                pDate = new Date(pDate.getTime() - 24 * 60 * 60 * 1000);
              }
            } else {
              pDate = new Date(dateValue);
            }
          }

          // Parse RR DATE similarly
          let rrDate = null;
          if (row["RR DATE"]) {
            const dateValue = row["RR DATE"];

            if (typeof dateValue === "number") {
              const excelEpoch = new Date(1900, 0, 1);
              rrDate = new Date(
                excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000,
              );

              if (dateValue > 59) {
                rrDate = new Date(rrDate.getTime() - 24 * 60 * 60 * 1000);
              }
            } else {
              rrDate = new Date(dateValue);
            }
          }

          // Append record to the database
          await db.insert(railwayLoadingOperations).values({
            pDate: pDate,
            station: row["STATION"] || null,
            siding: row["SIDING"] || null,
            imported: row["IMPORTED"] || null,
            commodity: row["COMMODITY"] || null,
            commType: row["COMM TYPE"] || null,
            commCg: row["COMM CG"] || null,
            demand: row["DEMAND"] || null,
            state: row["STATE"] || null,
            rly: row["RLY"] || null,
            wagons: Math.floor(parseFloat(row["WAGONS"]) || 0),
            type: row["TYPE"] || null,
            units: parseFloat(row["UNITS"]) || 0,
            loadingType: row["LOADING TYPE"] || null,
            rrNoFrom: Math.floor(parseFloat(row["RR NO FROM"]) || 0),
            rrNoTo: Math.floor(parseFloat(row["RR NO TO"]) || 0),
            rrDate: rrDate,
            tonnage: parseFloat(row["TONNAGE"]) || 0,
            freight: parseFloat(row["FREIGHT"]) || 0,
            tIndents: parseInt(row["T_INDENTS"]) || 0,
            osIndents: parseInt(row["O/S INDENTS"]) || 0,
          });

          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error inserting row:`, error);
        }
      }

      console.log(
        `Processed batch ${Math.floor(i / batchSize) + 1}, Success: ${successCount}, Errors: ${errorCount}`,
      );
    }

    console.log(`\nDatabase update completed:`);
    console.log(`- Successfully imported: ${successCount} records`);
    console.log(`- Errors: ${errorCount} records`);
    console.log(`- Total rows processed: ${validRows.length}`);
  } catch (error) {
    console.error("Error updating database from Excel:", error);
  }
}

// Run the update
updateDatabaseFromExcel();
