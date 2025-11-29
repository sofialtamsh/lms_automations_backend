import { getSheetsClient } from "../configs/googleSheetClient.js";

// Update one specific column in one row based on redisId
export const updateSheetCell = async (
  sheetId,
  sheetName,
  redisId,
  columnName,
  value
) => {
  try {
    const sheets = getSheetsClient();

    // 1. Read sheet data
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) throw new Error("Sheet is empty");

    const header = rows[0];

    // 2. Find redisId column index
    const redisColIndex = header.indexOf("redisId");
    if (redisColIndex === -1) throw new Error("redisId column NOT found");

    // 3. Find target row where redisId matches
    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][redisColIndex] === redisId) {
        targetRow = i + 1; // Google sheet row number (1-based)
        break;
      }
    }

    if (targetRow === -1) {
      throw new Error(`redisId '${redisId}' not found in sheet`);
    }

    // 4. Find column index for columnName
    const colIndex = header.indexOf(columnName);
    if (colIndex === -1) {
      throw new Error(`Column '${columnName}' not found`);
    }

    // 5. Prepare update range (example: F12)
    const cellRange = `${sheetName}!${colLetter(colIndex)}${targetRow}`;

    // 6. Update that single cell
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cellRange,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[value]],
      },
    });

    console.log(`✅ Sheet updated: ${columnName} → ${value} for redisId ${redisId}`);
  } catch (err) {
    console.error("❌ Google Sheet Update Error:", err.message);
  }
};


// Convert column index → A, B, C...
function colLetter(index) {
  let str = "";
  while (index >= 0) {
    str = String.fromCharCode((index % 26) + 65) + str;
    index = Math.floor(index / 26) - 1;
  }
  return str;
}
