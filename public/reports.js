// reports.js
// Part 4: Written by Member 4
// Frontend logic for the Reports page (reports.html).
// Runs SQL reports, renders result tables, and provides CSV export and PDF printing.

// Keep track of the currently loaded report rows for CSV export
var currentReportRows = [];
var currentReportName = 'report';

// ---------------------------------------------------------------
// Page load: insert navbar and load student dropdown for student-history report
// ---------------------------------------------------------------
window.onload = function () {
    // Insert navbar
    addNavbar();

    // Populate student dropdown in case student-history report is selected
    loadStudentDropdown();
};

// ---------------------------------------------------------------
// loadStudentDropdown()
// Fetches the students list to populate the student filter dropdown.
// ---------------------------------------------------------------
async function loadStudentDropdown() {
    var result = await callApi('GET', '/api/students', null);
    if (result.success && result.data) {
        fillDropdown('student-select', result.data, 'student_id', 'name');
    }
}

// ---------------------------------------------------------------
// onReportChange()
// Shows or hides the student picker depending on whether
// 'student-history' is selected in the report dropdown.
// ---------------------------------------------------------------
function onReportChange() {
    var report = document.getElementById('report-select').value;
    var studentGroup = document.getElementById('student-select-group');

    if (report === 'student-history') {
        studentGroup.style.display = 'block';
    } else {
        studentGroup.style.display = 'none';
    }
}

// ---------------------------------------------------------------
// formatHeader(key)
// Converts database column keys like "event_name" into clean titles like "Event Name".
// ---------------------------------------------------------------
function formatHeader(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, function (char) { return char.toUpperCase(); });
}

// ---------------------------------------------------------------
// runReport()
// Calls GET /api/reports/:reportName, updates header, and renders the table.
// ---------------------------------------------------------------
async function runReport() {
    var reportSelect = document.getElementById('report-select');
    var reportName = reportSelect.value;

    if (!reportName) {
        showMessage('report-message', 'Please select a report first.', true);
        return;
    }

    var url = '/api/reports/' + reportName;

    // Handle student-history query param
    if (reportName === 'student-history') {
        var studentId = document.getElementById('student-select').value;
        if (!studentId) {
            showMessage('report-message', 'Please choose a student for this report.', true);
            return;
        }
        url += '?studentId=' + studentId;
    }

    // Call the reports API
    var result = await callApi('GET', url, null);

    if (!result.success) {
        showMessage('report-message', result.message, true);
        document.getElementById('report-header').style.display = 'none';
        document.getElementById('print-btn').style.display = 'none';
        document.getElementById('csv-btn').style.display = 'none';
        return;
    }

    // Clear message
    var msgDiv = document.getElementById('report-message');
    msgDiv.textContent = '';
    msgDiv.className = 'message';

    var rows = result.data || [];
    currentReportRows = rows;
    currentReportName = reportName;

    // Update report header with title and generation timestamp
    var selectedOptionText = reportSelect.options[reportSelect.selectedIndex].text;
    document.getElementById('report-title').textContent = selectedOptionText;
    document.getElementById('report-date').textContent = 'Report generated on: ' + new Date().toLocaleString();
    document.getElementById('report-header').style.display = 'block';

    if (rows.length === 0) {
        document.getElementById('report-table-container').innerHTML =
            '<p style="color:#777; font-style:italic;">No records found for this report.</p>';
        document.getElementById('print-btn').style.display = 'none';
        document.getElementById('csv-btn').style.display = 'none';
        return;
    }

    // Format any date or decimal average columns for clean display
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        for (var key in row) {
            if (key.includes('date') && row[key]) {
                row[key] = String(row[key]).slice(0, 10);
            }
            if (key === 'average_rating' && row[key] !== null) {
                row[key] = Number(row[key]).toFixed(2) + ' / 5';
            }
        }
    }

    // Create user-friendly column headers
    var keys = Object.keys(rows[0]);
    var columnHeaders = keys.map(formatHeader);

    // Render table
    buildTable('report-table-container', columnHeaders, rows);

    // Show Print and CSV export buttons
    document.getElementById('print-btn').style.display = 'inline-block';
    document.getElementById('csv-btn').style.display = 'inline-block';
}

// ---------------------------------------------------------------
// downloadCSV()
// Builds a CSV string from currentReportRows and triggers a browser file download.
// Implemented in 10-12 lines of plain JavaScript using Blob.
// ---------------------------------------------------------------
function downloadCSV() {
    if (!currentReportRows || currentReportRows.length === 0) return;

    var keys = Object.keys(currentReportRows[0]);
    var csvContent = keys.map(formatHeader).join(',') + '\n';

    for (var i = 0; i < currentReportRows.length; i++) {
        var row = currentReportRows[i];
        var line = keys.map(function (k) {
            var val = (row[k] === null || row[k] === undefined) ? '' : String(row[k]);
            return '"' + val.replace(/"/g, '""') + '"';
        }).join(',');
        csvContent += line + '\n';
    }

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = currentReportName + '.csv';
    link.click();
}

// ---------------------------------------------------------------
// printReport()
// Opens the browser print dialog. Navbar, forms, and behind-the-scenes
// are hidden automatically by @media print in style.css.
// ---------------------------------------------------------------
function printReport() {
    window.print();
}
