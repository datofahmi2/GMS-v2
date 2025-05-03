// Firebase Configuration
const FIREBASE_URL = "https://garbagemonitoringweb-default-rtdb.asia-southeast1.firebasedatabase.app/";
let allData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setInterval(fetchData, 30000); // Auto-refresh every 30 seconds
});

// Fetch data from Firebase
async function fetchData() {
    try {
        document.getElementById('connectionStatus').className = 'status-indicator online';
        const response = await fetch(`${FIREBASE_URL}.json`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        allData = processData(data);
        renderTable(allData);
        updateLastUpdate();
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('connectionStatus').className = 'status-indicator offline';
        document.getElementById('tableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: red;">
                    Failed to load data. Please check your internet connection.
                </td>
            </tr>
        `;
    }
}

// Process Firebase data
function processData(firebaseData) {
    const result = [];
    let counter = 1;

    for (const timestamp in firebaseData) {
        if (firebaseData[timestamp] && firebaseData[timestamp].distance !== undefined) {
            result.push({
                no: counter++,
                timestamp: new Date(parseInt(timestamp)),
                distance: firebaseData[timestamp].distance,
                smoke: firebaseData[timestamp].smokeDetected === "Yes" ? "Yes" : "No",  // Check smoke status
                category: getCategory(firebaseData[timestamp].distance),
                garbageStatus: firebaseData[timestamp].garbageStatus || "Unknown"  // Garbage status
            });
        }
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
}

// Determine category based on distance
function getCategory(distance) {
    if (distance < 20) return { text: "FULL", class: "full" };
    if (distance < 40) return { text: "MEDIUM", class: "medium" };
    return { text: "LOW", class: "low" };
}

// Render table
function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const dateFilter = document.getElementById('dateFilter').value;
    const filteredData = dateFilter 
        ? data.filter(item => item.timestamp.toISOString().split('T')[0] === dateFilter)
        : data;

    if (filteredData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">
                    No data available
                </td>
            </tr>
        `;
        return;
    }

    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.no}</td>
            <td>${item.timestamp.toLocaleString()}</td>
            <td>${item.distance}</td>
            <td class="${item.category.class}">${item.category.text}</td>
            <td class="${item.smoke === "Yes" ? "smoke-detected" : ""}">
                ${item.smoke === "Yes" ? "🔥 DETECTED" : "Normal"}
            </td>
            <td>${item.garbageStatus}</td>  <!-- Display Garbage Status -->
        `;
        tableBody.appendChild(row);
    });
}

// Export to Excel
function exportToExcel() {
    if (allData.length === 0) {
        alert("No data to export!");
        return;
    }

    const excelData = allData.map(item => ({
        "No.": item.no,
        "Timestamp": item.timestamp.toLocaleString(),
        "Distance (cm)": item.distance,
        "Category": item.category.text,
        "Smoke Status": item.smoke === "Yes" ? "DETECTED" : "Normal",
        "Garbage Status": item.garbageStatus
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Garbage Report");

    const fileName = `Garbage_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Update last update time
function updateLastUpdate() {
    document.getElementById('lastUpdate').textContent = 
        `Last update: ${new Date().toLocaleTimeString()}`;
}

// Make refreshData available globally
window.refreshData = fetchData;

// Add event listener for date filter
document.getElementById('dateFilter').addEventListener('change', function() {
    renderTable(allData);
});
