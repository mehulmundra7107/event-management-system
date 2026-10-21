// registrations.js
// Part 4: Written by Member 4
// Frontend logic for the Registrations page (registrations.html).
// Follows the flow: form -> read values -> callApi(fetch) -> show result -> reload table

// ---------------------------------------------------------------
// Page load: insert navbar, initialize date, populate dropdowns, and load registrations
// ---------------------------------------------------------------
window.onload = function () {
    // Insert the navbar at the top (helper from common.js)
    addNavbar();

    // Default registration date to today's date (YYYY-MM-DD)
    var today = new Date().toISOString().slice(0, 10);
    var dateInput = document.getElementById('registration-date');
    if (dateInput) {
        dateInput.value = today;
    }

    // Populate the student and event dropdown lists
    loadDropdowns();

    // Load and display all existing registrations
    loadRegistrations();
};

// ---------------------------------------------------------------
// loadDropdowns()
// Fetches students and events from the backend to populate <select> options.
// ---------------------------------------------------------------
async function loadDropdowns() {
    // Fetch students list for student dropdown
    var studentsResult = await callApi('GET', '/api/students', null);
    if (studentsResult.success && studentsResult.data) {
        fillDropdown('student-id', studentsResult.data, 'student_id', 'name');
    }

    // Fetch events list for event dropdown
    // Try /api/events first; if not available, fallback to /api/registrations/events-list
    var eventsResult = await callApi('GET', '/api/events', null);
    if (eventsResult.success && eventsResult.data && eventsResult.data.length > 0) {
        fillDropdown('event-id', eventsResult.data, 'event_id', 'event_name');
    } else {
        var fallbackResult = await callApi('GET', '/api/registrations/events-list', null);
        if (fallbackResult.success && fallbackResult.data) {
            fillDropdown('event-id', fallbackResult.data, 'event_id', 'event_name');
        }
    }
}

// ---------------------------------------------------------------
// loadRegistrations()
// Calls GET /api/registrations and builds the registrations table.
// ---------------------------------------------------------------
async function loadRegistrations() {
    var result = await callApi('GET', '/api/registrations', null);

    if (!result.success) {
        document.getElementById('registrations-table-container').innerHTML =
            '<p style="color:red;">Error loading registrations: ' + result.message + '</p>';
        return;
    }

    // Column headers for the table
    var columnNames = ['ID', 'Student Name', 'Event Name', 'Date', 'Status', 'Actions'];
    var rows = result.data;

    // Attach Delete action button to each row
    for (var i = 0; i < rows.length; i++) {
        var regId = rows[i].registration_id;

        // Format date string to YYYY-MM-DD for clean display
        if (rows[i].registration_date) {
            rows[i].registration_date = String(rows[i].registration_date).slice(0, 10);
        }

        rows[i].actions =
            '<button class="btn-danger" onclick="deleteRegistration(' + regId + ')">Delete</button>';
    }

    // buildTable() is defined in common.js
    buildTable('registrations-table-container', columnNames, rows);
}

// ---------------------------------------------------------------
// submitRegistration()
// Reads inputs from the form, validates them, and sends a POST request.
// Demonstrates capacity check and UNIQUE constraint error handling.
// ---------------------------------------------------------------
async function submitRegistration() {
    var studentId        = document.getElementById('student-id').value;
    var eventId          = document.getElementById('event-id').value;
    var registrationDate = document.getElementById('registration-date').value;

    // Basic frontend validation
    if (!studentId || !eventId) {
        showMessage('form-message', 'Please select both a student and an event.', true);
        return;
    }

    var registrationObject = {
        student_id:        parseInt(studentId, 10),
        event_id:          parseInt(eventId, 10),
        registration_date: registrationDate
    };

    // Send the POST request to Express
    var result = await callApi('POST', '/api/registrations', registrationObject);

    if (result.success) {
        showMessage('form-message', 'Student registered successfully!', false);
        // Reset dropdowns to default
        document.getElementById('student-id').value = '';
        document.getElementById('event-id').value = '';
        // Reload registrations table to show new registration
        loadRegistrations();
    } else {
        // Displays friendly errors such as "Event is full." or "This student is already registered for this event."
        showMessage('form-message', result.message, true);
    }
}

// ---------------------------------------------------------------
// deleteRegistration(registrationId)
// Sends a DELETE request to remove a registration.
// ---------------------------------------------------------------
async function deleteRegistration(registrationId) {
    if (!confirm('Are you sure you want to cancel this registration?')) {
        return;
    }

    var result = await callApi('DELETE', '/api/registrations/' + registrationId, null);

    if (result.success) {
        showMessage('form-message', 'Registration cancelled successfully.', false);
        loadRegistrations();
    } else {
        showMessage('form-message', result.message, true);
    }
}
