// schedule.js
// Part 3: Written by Member 3 (Ragini)
// Frontend logic for the Event Schedule page (schedule.html).
// Manages activities for the Event_Schedule weak entity.

// Cache of events to retrieve event names
var eventsCache = [];

// ---------------------------------------------------------------
// Page initialization
// ---------------------------------------------------------------
window.onload = function () {
    // 1. Insert common navigation bar at the top
    addNavbar();

    // 2. Check if an eventId was passed as a query parameter (e.g. schedule.html?eventId=2)
    var urlParams = new URLSearchParams(window.location.search);
    var preselectedEventId = urlParams.get('eventId');

    // 3. Load all events into the dropdown and select the requested one if present
    loadEventsDropdown(preselectedEventId);
};

// ---------------------------------------------------------------
// cleanBehindTheScenes()
// Removes any emojis from the Behind the Scenes header.
// ---------------------------------------------------------------
function cleanBehindTheScenes() {
    var box = document.getElementById('behind-the-scenes');
    if (box) {
        box.innerHTML = box.innerHTML.replace('&#128270;', '').replace('🔍', '').trim();
    }
}

// ---------------------------------------------------------------
// loadEventsDropdown(preselectedId)
// Fetches all events from GET /api/events to fill the selector.
// ---------------------------------------------------------------
async function loadEventsDropdown(preselectedId) {
    var result = await callApi('GET', '/api/events', null);
    cleanBehindTheScenes();

    if (!result.success) {
        showMessage('schedule-form-message', 'Failed to load events: ' + result.message, true);
        return;
    }

    eventsCache = result.data;
    var select = document.getElementById('schedule-event-select');
    select.innerHTML = '<option value="">-- select an event --</option>';

    for (var i = 0; i < eventsCache.length; i++) {
        var ev = eventsCache[i];
        var option = document.createElement('option');
        option.value = ev.event_id;
        option.textContent = ev.event_name + ' (ID: ' + ev.event_id + ')';
        select.appendChild(option);
    }

    // If an eventId was passed in the URL, select it and load its schedule automatically
    if (preselectedId) {
        select.value = preselectedId;
        onSelectEvent();
    }
}

// ---------------------------------------------------------------
// onSelectEvent()
// Called whenever the user picks an event from the dropdown.
// ---------------------------------------------------------------
function onSelectEvent() {
    var select = document.getElementById('schedule-event-select');
    var eventId = select.value;

    var formCard  = document.getElementById('schedule-form-card');
    var tableCard = document.getElementById('schedule-table-card');

    if (!eventId) {
        formCard.style.display  = 'none';
        tableCard.style.display = 'none';
        return;
    }

    // Find the event name from cache
    var selectedEventName = 'Selected Event';
    for (var i = 0; i < eventsCache.length; i++) {
        if (eventsCache[i].event_id == eventId) {
            selectedEventName = eventsCache[i].event_name;
            break;
        }
    }

    // Update section titles with the event name
    document.getElementById('activity-form-heading').textContent =
        '2. Add Activity to: ' + selectedEventName + ' (Event ID: ' + eventId + ')';
    document.getElementById('schedule-table-heading').textContent =
        '3. Scheduled Activities for: ' + selectedEventName;

    // Show the form and table cards
    formCard.style.display  = 'block';
    tableCard.style.display = 'block';

    // Clear any previous form messages
    var msgDiv = document.getElementById('schedule-form-message');
    msgDiv.textContent = '';
    msgDiv.className   = 'message';

    // Fetch and display the schedule activities
    loadSchedule(eventId);
}

// ---------------------------------------------------------------
// loadSchedule(eventId)
// Calls GET /api/schedule/:eventId to fetch all schedule rows.
// Displays the composite key (event_id, schedule_id) clearly.
// ---------------------------------------------------------------
async function loadSchedule(eventId) {
    var result = await callApi('GET', '/api/schedule/' + eventId, null);
    cleanBehindTheScenes();

    if (!result.success) {
        document.getElementById('schedule-table-container').innerHTML =
            '<p style="color:red;">Error loading schedule: ' + result.message + '</p>';
        return;
    }

    var rows = result.data;

    // Table columns highlighting the partial key and composite key
    var columnNames = [
        'Schedule ID (Partial Key)',
        'Activity Name',
        'Start Time',
        'End Time',
        'Composite Primary Key (event_id, schedule_id)',
        'Actions'
    ];

    var displayRows = [];
    for (var i = 0; i < rows.length; i++) {
        var act = rows[i];

        var startTimeStr = act.start_time ? act.start_time.slice(0, 5) : '-';
        var endTimeStr   = act.end_time ? act.end_time.slice(0, 5) : '-';

        // Action: Delete this specific activity
        var actionBtn =
            '<button class="btn-danger" onclick="deleteActivity(' + act.event_id + ', ' + act.schedule_id + ')">Delete</button>';

        displayRows.push({
            schedule_id:   '#' + act.schedule_id,
            activity_name: act.activity_name,
            start_time:    startTimeStr,
            end_time:      endTimeStr,
            composite_key: '<code>(' + act.event_id + ', ' + act.schedule_id + ')</code>',
            actions:       actionBtn
        });
    }

    // Render using shared buildTable helper
    buildTable('schedule-table-container', columnNames, displayRows);
}

// ---------------------------------------------------------------
// submitActivity()
// Calls POST /api/schedule/:eventId to add a new activity.
// Backend will calculate the next schedule_id via MAX(schedule_id) + 1.
// ---------------------------------------------------------------
async function submitActivity() {
    var eventId      = document.getElementById('schedule-event-select').value;
    var activityName = document.getElementById('activity-name').value.trim();
    var startTime    = document.getElementById('activity-start-time').value;
    var endTime      = document.getElementById('activity-end-time').value;

    if (!eventId) {
        showMessage('schedule-form-message', 'Please select an event first.', true);
        return;
    }

    if (!activityName) {
        showMessage('schedule-form-message', 'Please enter an activity name.', true);
        return;
    }

    var activityPayload = {
        activity_name: activityName,
        start_time:    startTime || null,
        end_time:      endTime || null
    };

    var result = await callApi('POST', '/api/schedule/' + eventId, activityPayload);
    cleanBehindTheScenes();

    if (result.success) {
        showMessage('schedule-form-message', 'Activity added successfully to schedule!', false);
        // Clear activity inputs
        document.getElementById('activity-name').value       = '';
        document.getElementById('activity-start-time').value = '';
        document.getElementById('activity-end-time').value   = '';
        // Reload schedule table
        loadSchedule(eventId);
    } else {
        showMessage('schedule-form-message', result.message, true);
    }
}

// ---------------------------------------------------------------
// deleteActivity(eventId, scheduleId)
// Calls DELETE /api/schedule/:eventId/:scheduleId.
// ---------------------------------------------------------------
async function deleteActivity(eventId, scheduleId) {
    var confirmed = confirm('Are you sure you want to delete activity #' + scheduleId + ' for Event ' + eventId + '?');
    if (!confirmed) return;

    var result = await callApi('DELETE', '/api/schedule/' + eventId + '/' + scheduleId, null);
    cleanBehindTheScenes();

    if (result.success) {
        showMessage('schedule-form-message', 'Activity #' + scheduleId + ' deleted from schedule.', false);
        loadSchedule(eventId);
    } else {
        showMessage('schedule-form-message', result.message, true);
    }
}
