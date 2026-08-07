/**
 * Export data to a downloadable CSV file.
 * @param {string} filename - e.g. "products_export.csv"
 * @param {Array<string>} headers - e.g. ["ID", "Name", "SKU", "Price", "Stock"]
 * @param {Array<Array<any>>} rows - e.g. [[1, "Headphones", "WH-1001", 149.99, 50]]
 */
export function exportToCSV(filename, headers, rows) {
  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const stringified = String(str).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const csvLines = [];
  csvLines.push(headers.map(escapeCSV).join(','));

  rows.forEach((row) => {
    csvLines.push(row.map(escapeCSV).join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvLines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Open a formatted printable document window for saving as PDF or printing.
 * @param {string} title - Document title
 * @param {Array<string>} columns - Table column header names
 * @param {Array<Array<any>>} rows - Table row values
 */
export function exportToPDF(title, columns, rows) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups to export as PDF.');
    return;
  }

  const tableHeaders = columns.map((col) => `<th>${col}</th>`).join('');
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell !== null && cell !== undefined ? cell : ''}</td>`).join('')}</tr>`
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
          p.subtitle { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background-color: #f1f5f9; text-align: left; padding: 8px 12px; font-weight: 600; border-bottom: 2px solid #cbd5e1; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: right; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="subtitle">Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} · StockFlow Inventory Suite</p>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">Page 1 of 1 · Confidentially generated from StockFlow</div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
