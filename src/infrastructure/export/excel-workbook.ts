type Row = (string | number)[];

export async function buildWorkbookBytes(
  sheetName: string,
  rows: Row[],
): Promise<Uint8Array> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  for (const row of rows) {
    worksheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
