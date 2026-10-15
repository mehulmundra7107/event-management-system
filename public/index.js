// index.js
// Part 4: Written by Member 4
// Frontend logic for the Dashboard page (index.html).
// Loads summary counts and upcoming events list from GET /api/dashboard.

// ---------------------------------------------------------------
// Page load: insert navbar and load dashboard data
// ---------------------------------------------------------------
window.onload = function () {
    // Insert the navbar at the top
    addNavbar();

    // Fetch and display dashboard summary numbers and upcoming events
    loadDashboard();
};

// ---------------------------------------------------------------
// loadDashboard()
// Calls GET /api/dashboard and populates count cards and the upcoming events table.
// ---------------------------------------------------------------
async function loadDashboard() {
    var result = await callApi('GET', '/api/dashboard', null);

    if (!result.success) {
        document.getElementById('upcoming-events-container').innerHTML =
            '<p style="color:red;">Error loading dashboard data: ' + result.message + '</p>';
        return;
    }

    var data = result.data;

    // Update the 4 count cards
    document.getElementById('count-students').textContent      = data.student_count || 0;
    document.getElementById('count-events').textContent        = data.event_count || 0;
    document.getElementById('count-registrations').textContent = data.registration_count || 0;
    document.getElementById('count-feedback').textContent      = data.feedback_count || 0;

    // Build the upcoming events table
    var columnNames = ['ID', 'Event Name', 'Date', 'Start Time', 'Venue'];
    var events = data.upcoming_events || [];

    if (events.length === 0) {
        document.getElementById('upcoming-events-container').innerHTML =
            '<p style="color:#777; font-style:italic;">No upcoming events found.</p>';
        return;
    }

    // Format dates to YYYY-MM-DD
    for (var i = 0; i < events.length; i++) {
        if (events[i].event_date) {
            events[i].event_date = String(events[i].event_date).slice(0, 10);
        }
    }

    buildTable('upcoming-events-container', columnNames, events);
}
