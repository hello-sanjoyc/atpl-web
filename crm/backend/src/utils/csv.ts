const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * RFC 4180 CSV encoding with spreadsheet formula-injection protection: any cell that begins with
 * a formula trigger character is prefixed with an apostrophe so it cannot execute in Excel/Sheets.
 */
export function toCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const encode = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '';
    let text = String(cell);
    if (typeof cell === 'string' && FORMULA_PREFIX.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.map(encode).join(',')];
  for (const row of rows) lines.push(row.map(encode).join(','));
  return `${lines.join('\r\n')}\r\n`;
}
