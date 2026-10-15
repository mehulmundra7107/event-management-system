// common.js
// Shared helper functions used by every page of the Event Management System.
// This file is loaded with <script src="common.js"></script> on every HTML page.
// Part 1: Written by Member 1. All other members use these helpers.

// ---------------------------------------------------------------
// NAVBAR LINKS
// If you need to add a new page, add ONE entry to this array.
// The navbar is built automatically from this list.
// ---------------------------------------------------------------
var NAV_LINKS = [
    { href: 'index.html',         label: 'Dashboard' },
    { href: 'students.html',      label: 'Students' },
    { href: 'master.html',        label: 'Master Data' },
    { href: 'events.html',        label: 'Events' },
    { href: 'schedule.html',      label: 'Schedule' },
    { href: 'registrations.html', label: 'Registrations' },
    { href: 'feedback.html',      label: 'Feedback' },
    { href: 'reports.html',       label: 'Reports' }
];

// ---------------------------------------------------------------
// addNavbar()
// Inserts the navbar at the top of the page body.
// Call this at the top of every page's JavaScript file.
// It highlights the link that matches the current page.
// ---------------------------------------------------------------
function addNavbar() {
    // Get the current page file name, e.g. "students.html"
    var currentPage = window.location.pathname.split('/').pop();

    // Build the HTML for each nav link
    var linksHtml = '';
    for (var i = 0; i < NAV_LINKS.length; i++) {
        var link = NAV_LINKS[i];
        // Add the 'active' class to the current page's link
        var activeClass = (link.href === currentPage) ? ' class="active"' : '';
        linksHtml += '<a href="' + link.href + '"' + activeClass + '>' + link.label + '</a>';
    }

    // Build the full navbar HTML
    var navHtml = '<nav>'
        + '<span class="nav-brand">Event Management</span>'
        + linksHtml
        + '</nav>';

    // Insert the navbar as the very first element inside <body>
    document.body.insertAdjacentHTML('afterbegin', navHtml);
}

// ---------------------------------------------------------------
// callApi(method, url, bodyObject)
// A wrapper around the browser's built-in fetch() function.
// What is fetch? fetch() lets JavaScript send an HTTP request
// to the backend server and get a response, without reloading the page.
// What is async/await? 'async' marks a function as asynchronous.
// 'await' pauses the function until a Promise (like fetch) resolves,
// making asynchronous code look like normal step-by-step code.
//
// Returns: the parsed JSON response from the server.
// Also calls showBehindTheScenes() to display the SQL and result.
// ---------------------------------------------------------------
async function callApi(method, url, bodyObject) {
    // Build the fetch options
    var options = {
        method: method,  // 'GET', 'POST', 'PUT', or 'DELETE'
        headers: { 'Content-Type': 'application/json' }
    };

    // For POST and PUT, include the body as a JSON string
    if (bodyObject !== undefined && bodyObject !== null) {
        options.body = JSON.stringify(bodyObject);
    }

    try {
        // Send the request and wait for the response
        var response = await fetch(url, options);
        // Parse the JSON in the response body
        var result = await response.json();
        // Show the SQL and result in the Behind the Scenes box
        showBehindTheScenes(result);
        return result;
    } catch (err) {
        // If the network fails completely, show a generic error
        var errorResult = { success: false, sql: '', params: [], message: 'Network error: ' + err.message };
        showBehindTheScenes(errorResult);
        return errorResult;
    }
}

// ---------------------------------------------------------------
// showBehindTheScenes(result)
// Fills the <div id="behind-the-scenes"> box at the bottom of the page.
// Shows: the SQL query, the parameters, the raw JSON, and row count.
// This helps the teacher see exactly what query ran and what was returned.
// ---------------------------------------------------------------
function showBehindTheScenes(result) {
    var box = document.getElementById('behind-the-scenes');
    if (!box) return;  // do nothing if the box does not exist on this page

    var rowCount = (result.data && Array.isArray(result.data)) ? result.data.length : '-';

    // Build the display text
    var content = '<h3>Behind the Scenes</h3>';
    content += '<span class="label">SQL Query:</span>\n' + (result.sql || '(none)') + '\n\n';
    content += '<span class="label">Parameters (? values):</span>\n' + JSON.stringify(result.params || []) + '\n\n';
    content += '<span class="label">Rows returned:</span> ' + rowCount + '\n\n';
    content += '<span class="label">Raw JSON response:</span>\n' + JSON.stringify(result, null, 2);

    box.innerHTML = content;
}

// ---------------------------------------------------------------
// buildTable(containerId, columnNames, rows)
// Builds an HTML <table> from an array of row objects and inserts
// it into the element with the given id.
//
// containerId  - the id of the <div> where the table will go
// columnNames  - array of column header strings, e.g. ['ID', 'Name', 'Email']
// rows         - array of objects from the database, e.g. [{student_id:1, name:'Asha', ...}]
// ---------------------------------------------------------------
function buildTable(containerId, columnNames, rows) {
    var container = document.getElementById(containerId);
    if (!container) return;

    // If there are no rows, show a simple message instead
    if (!rows || rows.length === 0) {
        container.innerHTML = '<p style="color:#777; font-style:italic;">No records found.</p>';
        return;
    }

    // Build the table header row
    var tableHtml = '<table><thead><tr>';
    for (var i = 0; i < columnNames.length; i++) {
        tableHtml += '<th>' + columnNames[i] + '</th>';
    }
    tableHtml += '</tr></thead><tbody>';

    // Build one table row for each object in the rows array
    // The keys of the first object are used to get values from each row
    var dataKeys = Object.keys(rows[0]);
    for (var r = 0; r < rows.length; r++) {
        tableHtml += '<tr>';
        for (var k = 0; k < dataKeys.length; k++) {
            var cellValue = rows[r][dataKeys[k]];
            // Show null/undefined as an empty string
            if (cellValue === null || cellValue === undefined) cellValue = '';
            tableHtml += '<td>' + cellValue + '</td>';
        }
        tableHtml += '</tr>';
    }

    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
}

// ---------------------------------------------------------------
// showMessage(elementId, text, isError)
// Displays a success (green) or error (red) message inside the
// element with the given id, using the CSS classes from style.css.
//
// elementId - id of the <div> where the message will appear
// text      - the message string to display
// isError   - true for red error message, false for green success
// ---------------------------------------------------------------
function showMessage(elementId, text, isError) {
    var element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = text;
    // Remove both classes first, then add the right one
    element.className = 'message ' + (isError ? 'error' : 'success');
}

// ---------------------------------------------------------------
// fillDropdown(selectId, rows, valueField, textField)
// Populates a <select> element with <option> tags built from
// an array of database rows.
//
// selectId   - the id of the <select> element
// rows       - array of objects, e.g. [{venue_id:1, venue_name:'Main Auditorium'}, ...]
// valueField - which key to use as the option's value, e.g. 'venue_id'
// textField  - which key to use as the option's visible text, e.g. 'venue_name'
// ---------------------------------------------------------------
function fillDropdown(selectId, rows, valueField, textField) {
    var selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    // Keep the first default "-- select --" option if it exists
    selectElement.innerHTML = '<option value="">-- select --</option>';

    for (var i = 0; i < rows.length; i++) {
        var option = document.createElement('option');
        option.value = rows[i][valueField];
        option.textContent = rows[i][textField];
        selectElement.appendChild(option);
    }
}
