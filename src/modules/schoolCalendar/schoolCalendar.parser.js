
/**
 * School Calendar — Excel Parser
 *
 * Parses the uploaded .xlsx file into CalendarEvent-compatible objects.
 *
 * Handles real-world Excel format from TalentGym/BrainBuilder:
 *   - Rows 1–N  : merged title/logo rows (skip until actual header found)
 *   - Header row: Day | Date | Time | Class | Event Name
 *   - Data rows : actual events
 *
 * ExcelJS cell types:
 *   1 = null/empty  2 = number  3 = string  4 = Date  6 = formula  8 = richText
 *
 * Row highlight colors extracted for holiday (red) / special (green) detection.
 */

const ExcelJS = require("exceljs");
const logger = require("../../config/logger");

// ── Cell value extractor ──────────────────────────────────────────────────────

/**
 * Extract a clean string from any ExcelJS cell value type.
 * Handles: string, number, Date, richText object, formula result.
 */
function getCellText(cell) {
  if (!cell) return "";
  const val = cell.value;
  if (val === null || val === undefined) return "";

  // richText object: { richText: [{ text: "..." }, ...] }
  if (val && typeof val === "object" && Array.isArray(val.richText)) {
    return val.richText.map((r) => r.text || "").join("").trim();
  }

  // Formula cell: { formula: "...", result: ... }
  if (val && typeof val === "object" && val.formula !== undefined) {
    return getCellTextFromRaw(val.result);
  }

  // Shared string / hyperlink
  if (val && typeof val === "object" && val.text !== undefined) {
    return String(val.text).trim();
  }

  return String(val).trim();
}

function getCellTextFromRaw(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && Array.isArray(v.richText)) {
    return v.richText.map((r) => r.text || "").join("").trim();
  }
  return String(v).trim();
}

// ── Date extraction ───────────────────────────────────────────────────────────

/**
 * Extract a JS Date from an ExcelJS cell.
 * ExcelJS gives type=4 cells as actual JS Date objects — just use them directly.
 * Also handles string dates like "13-04-2026".
 */
function getCellDate(cell) {
  if (!cell) return null;
  const val = cell.value;
  if (val === null || val === undefined) return "";

  // ExcelJS type 4 = Date — value IS a JS Date already
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // String date: "13-04-2026" or "13/04/2026"
  const str = String(val).trim();
  if (!str || str === "[object Object]") return null;

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const dt = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
    return isNaN(dt.getTime()) ? null : dt;
  }

  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const dt = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
    return isNaN(dt.getTime()) ? null : dt;
  }

  // ISO string from JSON.stringify of Date e.g. "2026-04-13T00:00:00.000Z"
  if (str.includes("T") && str.includes("Z")) {
    const dt = new Date(str);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Excel numeric serial
  const num = parseFloat(str);
  if (!isNaN(num) && num > 1000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const dt = new Date(excelEpoch.getTime() + num * 86400000);
    return isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

/**
 * Format a Date to "DD-MM-YYYY" string.
 */
function formatDateStr(d) {
  if (!d) return "";
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
}

// ── Header detection ──────────────────────────────────────────────────────────

/**
 * Check if a row is the actual column header row.
 * Looks for "Day" or "Date" in first 2 cols (case-insensitive).
 */
function isHeaderRow(row) {
  const col1 = getCellText(row.getCell(1)).toLowerCase();
  const col2 = getCellText(row.getCell(2)).toLowerCase();
  return col1 === "day" || col2 === "date";
}

/**
 * Check if a row looks like a title/logo row (merged rich-text, no real date).
 * These should be skipped.
 */
function isTitleRow(row) {
  const col2 = row.getCell(2);
  const text = getCellText(col2).toLowerCase();
  // Title rows have richText containing "upcoming events" or blank date col
  return (
    text.includes("upcoming") ||
    text.includes("events & workshops") ||
    text.includes("kids club") && text.length > 30
  );
}

// ── Color extraction ──────────────────────────────────────────────────────────

function getCellColor(cell) {
  try {
    const fill = cell?.fill;
    if (!fill || fill.type !== "pattern" || !fill.fgColor) return null;
    const argb = fill.fgColor.argb;
    if (!argb || typeof argb !== "string") return null;
    if (argb.length === 8) return `#${argb.slice(2).toUpperCase()}`;
    if (argb.length === 6) return `#${argb.toUpperCase()}`;
    return null;
  } catch {
    return null;
  }
}

function classifyColor(hex) {
  if (!hex) return { isHoliday: false, isHighlighted: false };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (r > 180 && g < 100 && b < 100) return { isHoliday: true,  isHighlighted: false };
  if (g > 180 && r < 200 && b < 100) return { isHoliday: false, isHighlighted: true  };
  if (r > 200 && g > 100 && g < 200 && b < 60) return { isHoliday: false, isHighlighted: true };
  return { isHoliday: false, isHighlighted: false };
}

// ── CalType inference ─────────────────────────────────────────────────────────

function inferCalType(eventName, explicitCalType) {
  if (
    explicitCalType &&
    ["SCHOOL_CAL", "KIDS_CLUB_CAL"].includes(explicitCalType.toUpperCase())
  ) {
    return explicitCalType.toUpperCase();
  }
  const name = String(eventName || "").toLowerCase();
  if (
    name.includes("talentgym") ||
    name.includes("talent gym") ||
    name.includes("kids club") ||
    name.includes("kids -") ||
    name.includes("talentgym kids")
  ) {
    return "KIDS_CLUB_CAL";
  }
  return "SCHOOL_CAL";
}

// ── Main parser ───────────────────────────────────────────────────────────────

/**
 * Parse an Excel buffer into CalendarEvent-shaped objects.
 *
 * Strategy:
 * 1. Scan rows until we find the header row (contains "Day" / "Date")
 * 2. Parse all rows after the header as data rows
 * 3. Skip rows with missing date or event name
 */
async function parseCalendarExcel(buffer, defaultCalType, session, uploadBatchId) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Excel file has no worksheets");
  }

  const events   = [];
  const errors   = [];
  let skipped    = 0;
  let headerFound = false;
  let dataRowCount = 0;

  worksheet.eachRow((row, rowNumber) => {
    // ── Skip until we find the actual header row ──────────────────────────────
    if (!headerFound) {
      if (isHeaderRow(row)) {
        headerFound = true;
        logger.info(`[Calendar] Header row found at row ${rowNumber}`);
      } else {
        skipped++;
      }
      return; // skip header row itself too
    }

    dataRowCount++;

    // ── Skip fully empty rows ─────────────────────────────────────────────────
    const col1Text = getCellText(row.getCell(1));
    const col2Raw  = row.getCell(2);
    const col5Text = getCellText(row.getCell(5));

    if (!col1Text && !col5Text) {
      skipped++;
      return;
    }

    // ── Parse date ────────────────────────────────────────────────────────────
    const dateObj = getCellDate(col2Raw);

    if (!dateObj) {
      const raw = col2Raw?.value;
      errors.push(
        `Row ${rowNumber}: Invalid or missing date "${
          raw instanceof Object ? JSON.stringify(raw) : raw
        }" — skipped`
      );
      skipped++;
      return;
    }

    // ── Parse event name ──────────────────────────────────────────────────────
    const eventName = col5Text;
    if (!eventName) {
      errors.push(`Row ${rowNumber}: Empty event name — skipped`);
      skipped++;
      return;
    }

    // ── Extract other fields ──────────────────────────────────────────────────
    const day       = col1Text;
    const time      = getCellText(row.getCell(3));
    const className = getCellText(row.getCell(4));
    const calTypeCol = getCellText(row.getCell(6)) || null;

    // ── Colors ────────────────────────────────────────────────────────────────
    const rowColor = getCellColor(row.getCell(1)) ||
                     getCellColor(row.getCell(5)) ||
                     null;
    const { isHoliday, isHighlighted } = classifyColor(rowColor);

    // ── Infer calType ─────────────────────────────────────────────────────────
    const calType = inferCalType(eventName, calTypeCol || defaultCalType);

    events.push({
      day,
      date:       dateObj,
      dateStr:    formatDateStr(dateObj),
      time,
      className,
      eventName,
      calType,
      rowColor,
      isHoliday,
      isHighlighted,
      visibleToAll: true,
      visibleTo:    [],
      session:      session || "",
      uploadBatchId,
      isActive:     true,
    });
  });

  if (!headerFound) {
    throw new Error(
      "Could not find header row in Excel file. " +
      "Make sure the sheet has a row with 'Day' and 'Date' column headers."
    );
  }

  logger.info(
    `[Calendar] Excel parsed — ${events.length} events, ${skipped} skipped, ${errors.length} errors`
  );

  return { events, errors, skipped };
}

module.exports = { parseCalendarExcel };