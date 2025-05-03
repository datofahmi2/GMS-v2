let dataTable = [];

document.getElementById("importExcel").addEventListener("change", function(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    dataTable = jsonData.map((item, index) => ({
      no: index + 1,
      timestamp: item["Timestamp"],
      distance: item["Distance (cm)"],
      category: item["Category"],
      smoke: item["Smoke Status"]
    }));

    renderTable(dataTable);
    document.getElementById("statusMsg").textContent = "Status: Import berjaya!";
  };
  reader.readAsArrayBuffer(e.target.files[0]);
});

function renderTable(data) {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.no}</td>
      <td>${row.timestamp}</td>
      <td>${row.distance}</td>
      <td>${row.category}</td>
      <td>${row.smoke}</td>
    `;
    tableBody.appendChild(tr);
  });
}

function exportToExcel() {
  if (dataTable.length === 0) {
    alert("Tiada data untuk export!");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(dataTable);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  XLSX.writeFile(wb, "Laporan_Tong_Sampah.xlsx");
}