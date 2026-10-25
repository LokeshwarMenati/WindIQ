/**
 * Utility to generate and trigger browser CSV downloads for energy analysts and traders.
 */

export function exportToCSV(filename, rows, headers) {
  if (!rows || !rows.length) {
    console.warn("No data rows available to export to CSV");
    return false;
  }

  const keys = headers ? headers.map(h => h.key) : Object.keys(rows[0]);
  const headerLabels = headers ? headers.map(h => `"${h.label.replace(/"/g, '""')}"`) : keys.map(k => `"${k}"`);

  const csvRows = [headerLabels.join(',')];

  rows.forEach(row => {
    const values = keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'number') return val.toString();
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
