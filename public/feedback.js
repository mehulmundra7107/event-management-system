// feedback.js
// Part 4: Written by Member 4
// Frontend logic for the Feedback page (feedback.html).
// Follows the flow: form -> read values -> callApi(fetch) -> show result -> reload table

// ---------------------------------------------------------------
// Page load: insert navbar, populate dropdowns, and load all feedback
// ---------------------------------------------------------------
window.onload = function () {
    // Insert the navbar at the top of the page
    addNavbar();

    // Populate student and event dropdown lists
    loadDropdowns();

    // Load and display all feedback records
    loadFeedback();
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

    // Fetch events list for event dropdown and event filter dropdown
    var eventsResult = await callApi('GET', '/api/events', null);
    var eventList = [];

    if (eventsResult.success && eventsResult.data && eventsResult.data.length > 0) {
        eventList = eventsResult.data;
    } else {
        var fallbackResult = await callApi('GET', '/api/feedback/events-list', null);
        if (fallbackResult.success && fallbackResult.data) {
            eventList = fallbackResult.data;
        }
    }

    // Populate form event dropdown
    fillDropdown('event-id', eventList, 'event_id', 'event_name');

    // Populate filter dropdown with "-- All Events --" as first option
    var filterSelect = document.getElementById('filter-event-id');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">-- All Events --</option>';
        for (var i = 0; i < eventList.length; i++) {
            var opt = document.createElement('option');
            opt.value = eventList[i].event_id;
            opt.textContent = eventList[i].event_name;
            filterSelect.appendChild(opt);
        }
    }
}

// ---------------------------------------------------------------
// loadFeedback()
// Calls GET /api/feedback and displays all feedback rows in the table.
// ---------------------------------------------------------------
async function loadFeedback() {
    var result = await callApi('GET', '/api/feedback', null);

    if (!result.success) {
        document.getElementById('feedback-table-container').innerHTML =
            '<p style="color:red;">Error loading feedback: ' + result.message + '</p>';
        return;
    }

    displayFeedbackRows(result.data);
}

// ---------------------------------------------------------------
// filterFeedback()
// Triggered when user selects an event from the filter dropdown.
// Calls GET /api/feedback/event/:eventId or loads all feedback if none selected.
// ---------------------------------------------------------------
async function filterFeedback() {
    var eventId = document.getElementById('filter-event-id').value;

    if (!eventId) {
        loadFeedback();
        return;
    }

    var result = await callApi('GET', '/api/feedback/event/' + eventId, null);

    if (!result.success) {
        document.getElementById('feedback-table-container').innerHTML =
            '<p style="color:red;">Error filtering feedback: ' + result.message + '</p>';
        return;
    }

    displayFeedbackRows(result.data);
}

// ---------------------------------------------------------------
// displayFeedbackRows(rows)
// Formats and displays an array of feedback records inside the table container.
// ---------------------------------------------------------------
function displayFeedbackRows(rows) {
    var columnNames = ['ID', 'Student Name', 'Event Name', 'Rating', 'Comments', 'Date'];

    if (!rows || rows.length === 0) {
        document.getElementById('feedback-table-container').innerHTML =
            '<p style="color:#777; font-style:italic;">No feedback recorded for this selection.</p>';
        return;
    }

    // Clean up dates and format rating
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].feedback_date) {
            rows[i].feedback_date = String(rows[i].feedback_date).slice(0, 10);
        }
        if (rows[i].rating) {
            rows[i].rating = rows[i].rating + ' / 5';
        }
    }

    buildTable('feedback-table-container', columnNames, rows);
}

// ---------------------------------------------------------------
// submitFeedback()
// Reads inputs from the form, validates rating between 1 and 5,
// and submits new feedback via POST /api/feedback.
// ---------------------------------------------------------------
async function submitFeedback() {
    var studentId = document.getElementById('student-id').value;
    var eventId   = document.getElementById('event-id').value;
    var rating    = document.getElementById('rating').value;
    var comments  = document.getElementById('comments').value.trim();

    // Basic frontend validation
    if (!studentId || !eventId || !rating) {
        showMessage('form-message', 'Please select a student, an event, and a rating.', true);
        return;
    }

    var feedbackObject = {
        student_id: parseInt(studentId, 10),
        event_id:   parseInt(eventId, 10),
        rating:     parseInt(rating, 10),
        comments:   comments
    };

    var result = await callApi('POST', '/api/feedback', feedbackObject);

    if (result.success) {
        showMessage('form-message', 'Feedback submitted successfully!', false);
        // Reset form inputs
        document.getElementById('student-id').value = '';
        document.getElementById('event-id').value = '';
        document.getElementById('rating').value = '';
        document.getElementById('comments').value = '';

        // Reload the feedback list
        loadFeedback();
    } else {
        showMessage('form-message', result.message, true);
    }
}
