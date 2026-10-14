// events.js
// Part 3: Written by Member 3 (Ragini)
// Frontend logic for the Events page (events.html).
// Follows the standard flow:
// 1. User fills form
// 2. JS reads input values
// 3. Calls callApi() with fetch
// 4. Express backend runs SQL
// 5. Friendly message is displayed and table is reloaded
// 6. Behind the Scenes box displays the query, parameters, and response

// Global cache of events to easily populate the edit form
var cachedEvents = [];

// ---------------------------------------------------------------
// Page initialization
// ---------------------------------------------------------------
window.onload = function () {
    // Insert common navbar at the top of the body
    addNavbar();
    // Load dropdown options for Venue, Organizer, Club, Category (from Part 2 routes)
    loadDropdowns();
    // Load and render the events table
    loadEvents();
};

// ---------------------------------------------------------------
// Helper: format MySQL date to YYYY-MM-DD
// ---------------------------------------------------------------
function formatDate(dateValue) {
    if (!dateValue) return '';
    // If it's an ISO string like "2026-10-15T00:00:00.000Z", extract date portion
    if (typeof dateValue === 'string') {
        return dateValue.split('T')[0];
    }
    var d = new Date(dateValue);
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// ---------------------------------------------------------------
// loadDropdowns()
// Populates foreign key dropdowns for Venue, Organizer, Club, Category.
// These endpoints were built by Member 2 in routes/master.js.
// ---------------------------------------------------------------
async function loadDropdowns() {
    try {
        // 1. Venues dropdown
        var venueRes = await callApi('GET', '/api/venues', null);
        if (venueRes.success) {
            fillDropdown('event-venue', venueRes.data, 'venue_id', 'venue_name');
        }

        // 2. Organizers dropdown
        var orgRes = await callApi('GET', '/api/organizers', null);
        if (orgRes.success) {
            fillDropdown('event-organizer', orgRes.data, 'organizer_id', 'name');
        }

        // 3. Clubs dropdown
        var clubRes = await callApi('GET', '/api/clubs', null);
        if (clubRes.success) {
            fillDropdown('event-club', clubRes.data, 'club_id', 'club_name');
        }

        // 4. Categories dropdown
        var catRes = await callApi('GET', '/api/categories', null);
        if (catRes.success) {
            fillDropdown('event-category', catRes.data, 'category_id', 'category_name');
        }
    } catch (err) {
        showMessage('event-form-message', 'Failed to load master dropdown data: ' + err.message, true);
    }
}

// ---------------------------------------------------------------
// loadEvents()
// Fetches the event list from GET /api/events and builds the table.
// Shows joined names and derived status.
// ---------------------------------------------------------------
async function loadEvents() {
    var result = await callApi('GET', '/api/events', null);

    if (!result.success) {
        document.getElementById('events-table-container').innerHTML =
            '<p style="color:red;">Error loading events: ' + result.message + '</p>';
        return;
    }

    cachedEvents = result.data;

    // Define table columns matching our mapped display objects
    var columnNames = [
        'ID',
        'Event Name',
        'Date',
        'Time',
        'Type',
        'Venue',
        'Organizer',
        'Club',
        'Category',
        'Status (Derived)',
        'Actions'
    ];

    // Build array of display rows formatted for buildTable()
    var displayRows = [];
    for (var i = 0; i < cachedEvents.length; i++) {
        var ev = cachedEvents[i];

        // Format status badge color for quick visual clarity
        var statusColor = '#2980b9';
        if (ev.status === 'Completed') statusColor = '#7f8c8d';
        if (ev.status === 'Ongoing')   statusColor = '#27ae60';
        if (ev.status === 'Upcoming')  statusColor = '#e67e22';

        var statusBadge = '<span style="font-weight:bold; color:' + statusColor + ';">' + ev.status + '</span>';

        var timeString = '';
        if (ev.start_time && ev.end_time) {
            timeString = ev.start_time.slice(0, 5) + ' - ' + ev.end_time.slice(0, 5);
        } else if (ev.start_time) {
            timeString = ev.start_time.slice(0, 5);
        }

        // Action buttons: Edit, Delete, and a link to manage its weak-entity Schedule
        var actionButtons =
            '<button class="btn-edit" onclick="startEdit(' + ev.event_id + ')">Edit</button> ' +
            '<button class="btn-danger" onclick="deleteEvent(' + ev.event_id + ')">Delete</button> ' +
            '<a href="schedule.html?eventId=' + ev.event_id + '" class="btn-secondary" ' +
            'style="text-decoration:none; display:inline-block; padding:5px 12px; font-size:13px; border-radius:4px; vertical-align:middle;">Schedule</a>';

        displayRows.push({
            id: ev.event_id,
            name: ev.event_name,
            date: formatDate(ev.event_date),
            time: timeString,
            type: ev.event_type || '-',
            venue: ev.venue_name,
            organizer: ev.organizer_name,
            club: ev.club_name,
            category: ev.category_name,
            status: statusBadge,
            actions: actionButtons
        });
    }

    // Call buildTable helper from common.js
    buildTable('events-table-container', columnNames, displayRows);
}

// ---------------------------------------------------------------
// submitEvent()
// Handles form submission for both adding a new event (POST)
// and updating an existing event (PUT).
// ---------------------------------------------------------------
async function submitEvent() {
    // 1. Read input values from the DOM
    var editId      = document.getElementById('edit-event-id').value;
    var eventName   = document.getElementById('event-name').value.trim();
    var description = document.getElementById('event-description').value.trim();
    var eventDate   = document.getElementById('event-date').value;
    var eventType   = document.getElementById('event-type').value.trim();
    var startTime   = document.getElementById('event-start-time').value;
    var endTime     = document.getElementById('event-end-time').value;
    var venueId     = document.getElementById('event-venue').value;
    var organizerId = document.getElementById('event-organizer').value;
    var clubId      = document.getElementById('event-club').value;
    var categoryId  = document.getElementById('event-category').value;

    // 2. Validate mandatory fields
    if (!eventName || !eventDate || !venueId || !organizerId || !clubId || !categoryId) {
        showMessage('event-form-message', 'Please fill in all required fields (Name, Date, Venue, Organizer, Club, Category).', true);
        return;
    }

    // 3. Assemble event payload object
    var eventPayload = {
        event_name:   eventName,
        description:  description,
        event_date:   eventDate,
        event_type:   eventType,
        start_time:   startTime || null,
        end_time:     endTime || null,
        venue_id:     parseInt(venueId, 10),
        organizer_id: parseInt(organizerId, 10),
        club_id:      parseInt(clubId, 10),
        category_id:  parseInt(categoryId, 10)
    };

    if (editId) {
        // --- EDIT MODE: PUT /api/events/:id ---
        var updateResult = await callApi('PUT', '/api/events/' + editId, eventPayload);
        if (updateResult.success) {
            showMessage('event-form-message', 'Event updated successfully!', false);
            cancelEdit();
            loadEvents();
        } else {
            showMessage('event-form-message', updateResult.message, true);
        }
    } else {
        // --- ADD MODE: POST /api/events ---
        var insertResult = await callApi('POST', '/api/events', eventPayload);
        if (insertResult.success) {
            showMessage('event-form-message', 'Event added successfully!', false);
            clearForm();
            loadEvents();
        } else {
            showMessage('event-form-message', insertResult.message, true);
        }
    }
}

// ---------------------------------------------------------------
// deleteEvent(eventId)
// Deletes an event by its ID. Demonstrates referential integrity:
// if students are registered or feedback is recorded, the deletion is rejected.
// ---------------------------------------------------------------
async function deleteEvent(eventId) {
    var confirmed = confirm(
        'Are you sure you want to delete this event?\n\n' +
        'Note: If registrations exist, deletion will be blocked by referential integrity.\n' +
        'Any schedule entries for this event will be deleted automatically (ON DELETE CASCADE).'
    );
    if (!confirmed) return;

    var result = await callApi('DELETE', '/api/events/' + eventId, null);

    if (result.success) {
        showMessage('event-form-message', 'Event deleted successfully.', false);
        loadEvents();
    } else {
        // Demonstrates referential integrity to teacher when foreign key RESTRICT triggers
        showMessage('event-form-message', result.message, true);
    }
}

// ---------------------------------------------------------------
// startEdit(eventId)
// Populates the form with existing event values for updating.
// ---------------------------------------------------------------
function startEdit(eventId) {
    var eventData = null;
    for (var i = 0; i < cachedEvents.length; i++) {
        if (cachedEvents[i].event_id === eventId) {
            eventData = cachedEvents[i];
            break;
        }
    }
    if (!eventData) return;

    // Populate form fields
    document.getElementById('edit-event-id').value       = eventData.event_id;
    document.getElementById('event-name').value          = eventData.event_name;
    document.getElementById('event-description').value   = eventData.description || '';
    document.getElementById('event-date').value          = formatDate(eventData.event_date);
    document.getElementById('event-type').value          = eventData.event_type || '';
    document.getElementById('event-start-time').value    = eventData.start_time ? eventData.start_time.slice(0, 5) : '';
    document.getElementById('event-end-time').value      = eventData.end_time ? eventData.end_time.slice(0, 5) : '';
    document.getElementById('event-venue').value         = eventData.venue_id;
    document.getElementById('event-organizer').value     = eventData.organizer_id;
    document.getElementById('event-club').value          = eventData.club_id;
    document.getElementById('event-category').value      = eventData.category_id;

    // Switch form UI to Edit mode
    document.getElementById('form-heading').textContent  = 'Edit Event (ID: ' + eventId + ')';
    document.getElementById('event-submit-btn').textContent = 'Save Changes';
    document.getElementById('event-cancel-btn').style.display = 'inline-block';

    // Scroll smoothly to form
    document.getElementById('event-form-card').scrollIntoView({ behavior: 'smooth' });
}

// ---------------------------------------------------------------
// cancelEdit()
// Resets form back to "Add New Event" mode.
// ---------------------------------------------------------------
function cancelEdit() {
    document.getElementById('edit-event-id').value = '';
    document.getElementById('form-heading').textContent = 'Add New Event';
    document.getElementById('event-submit-btn').textContent = 'Add Event';
    document.getElementById('event-cancel-btn').style.display = 'none';
    clearForm();
}

// ---------------------------------------------------------------
// clearForm()
// Clears all form input and dropdown fields.
// ---------------------------------------------------------------
function clearForm() {
    document.getElementById('event-name').value        = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-date').value        = '';
    document.getElementById('event-type').value        = '';
    document.getElementById('event-start-time').value  = '';
    document.getElementById('event-end-time').value    = '';
    document.getElementById('event-venue').value       = '';
    document.getElementById('event-organizer').value   = '';
    document.getElementById('event-club').value        = '';
    document.getElementById('event-category').value    = '';

    var msgDiv = document.getElementById('event-form-message');
    msgDiv.textContent = '';
    msgDiv.className   = 'message';
}
