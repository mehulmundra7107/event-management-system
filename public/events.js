// events.js
// Part 3: Written by Member 3 (Ragini)
// Frontend logic for the Events page (events.html).
// Supports COEP campus venues, categorized clubs, organizers, and event categories.

// Global cache of events to easily populate the edit form
var cachedEvents = [];

// Master lists requested for COEP campus
var COEP_VENUES = [
    'COEP MAIN CAMPUS',
    'COEP NORTH CAMPUS',
    'COEP SPORTS GROUND',
    'COEP HOSTEL',
    'MAIN AUDITORIUM - SOUTH CAMPUS',
    'MINI AUDITORIUM  - NORTH CAMPUS',
    'COGNIZANT LAB - NORTH CAMPUS',
    'WILL BE INFORMED SOON'
];

var COEP_ORGANIZERS = [
    'Student',
    'Faculty',
    'Department',
    'Club / Committee',
    'University Administration',
    'Other'
];

var COEP_CLUB_CATEGORIES = {
    'Technical clubs': [
        'ARSC',
        'DSAI',
        'HAM',
        'Ramanujan Mathematics Science Club',
        'Robot Study Circle (RSC)',
        'SDS',
        'Team Octane Racing Electric',
        'Team Velociracers',
        'COEP ACM',
        'COEP CSI Student Chapter',
        'Quantum Computing Club',
        'BIS Student Chapter'
    ],
    'Academic and co-curricular': [
        'CSAC — Civil Services Aspirants\' Club',
        'History Club',
        'YEC',
        'COEP Consulting Club',
        'COEP Tech E-Cell',
        'Pune Startup Fest (PSF)'
    ],
    'Cultural and creative': [
        'Aarya Raas',
        'Abhijaat Newsletter',
        'Arts and Crafts Club (AnC)',
        'Cultural Club',
        'DnFC',
        'SPIC MACAY',
        'Philomystics'
    ],
    'Social and environmental': [
        'NSS',
        'Spandan',
        'SWE',
        'SWF',
        'NISARG Green Club'
    ],
    'Sports': [
        'Chess Club',
        'Cricket Club',
        'Football Club',
        'Hockey Club',
        'Kabaddi Club',
        'Kho-Kho Club',
        'Table Tennis Club',
        'Volleyball Club',
        'Archery Club',
        'Athletics Club',
        'Yoga Club'
    ],
    'Festivals and other activities': [
        'MindSpark',
        'Impressions',
        'ZEST',
        'i2i',
        'Astronomy Club',
        'Boat Club',
        'Boat Club Quiz Club',
        'CSAT COEP Tech',
        'Abhiyanta',
        'RPC'
    ]
};

var COEP_EVENT_CATEGORIES = [
    'Technical',
    'Workshop',
    'Seminar / Guest Lecture',
    'Cultural',
    'Sports',
    'Competition',
    'Meeting',
    'Fest',
    'Other'
];

// ---------------------------------------------------------------
// Page initialization
// ---------------------------------------------------------------
window.onload = function () {
    // Insert common navbar at the top of the body
    addNavbar();
    // Populate dropdown options
    initDropdowns();
    // Load and render the events table
    loadEvents();
};

// ---------------------------------------------------------------
// Helper: format MySQL date to YYYY-MM-DD
// ---------------------------------------------------------------
function formatDate(dateValue) {
    if (!dateValue) return '';
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
// initDropdowns()
// Populates Venue, Organizer, Club Category, and Event Category dropdowns.
// Also merges existing database items if present.
// ---------------------------------------------------------------
async function initDropdowns() {
    // 1. Venues
    var venueSelect = document.getElementById('event-venue');
    venueSelect.innerHTML = '<option value="">-- select venue --</option>';
    for (var i = 0; i < COEP_VENUES.length; i++) {
        var opt = document.createElement('option');
        opt.value = COEP_VENUES[i];
        opt.textContent = COEP_VENUES[i];
        venueSelect.appendChild(opt);
    }

    // 2. Organizers
    var orgSelect = document.getElementById('event-organizer');
    orgSelect.innerHTML = '<option value="">-- select organizer --</option>';
    for (var j = 0; j < COEP_ORGANIZERS.length; j++) {
        var optOrg = document.createElement('option');
        optOrg.value = COEP_ORGANIZERS[j];
        optOrg.textContent = COEP_ORGANIZERS[j];
        orgSelect.appendChild(optOrg);
    }

    // 3. Event Categories
    var catSelect = document.getElementById('event-category');
    catSelect.innerHTML = '<option value="">-- select category --</option>';
    for (var k = 0; k < COEP_EVENT_CATEGORIES.length; k++) {
        var optCat = document.createElement('option');
        optCat.value = COEP_EVENT_CATEGORIES[k];
        optCat.textContent = COEP_EVENT_CATEGORIES[k];
        catSelect.appendChild(optCat);
    }

    // Initialize Club dropdown with all clubs grouped
    populateClubsDropdown('');
}

// ---------------------------------------------------------------
// onClubCategoryChange()
// Handles dynamic club dropdown updates when the category changes.
// ---------------------------------------------------------------
function onClubCategoryChange() {
    var category = document.getElementById('club-category-select').value;
    populateClubsDropdown(category);
}

// ---------------------------------------------------------------
// populateClubsDropdown(selectedCategory)
// Fills the event-club dropdown based on the chosen category,
// or shows all clubs if no category is picked.
// ---------------------------------------------------------------
function populateClubsDropdown(selectedCategory) {
    var clubSelect = document.getElementById('event-club');
    clubSelect.innerHTML = '<option value="">-- select club / committee --</option>';

    if (selectedCategory && COEP_CLUB_CATEGORIES[selectedCategory]) {
        var list = COEP_CLUB_CATEGORIES[selectedCategory];
        for (var i = 0; i < list.length; i++) {
            var opt = document.createElement('option');
            opt.value = list[i];
            opt.textContent = list[i];
            clubSelect.appendChild(opt);
        }
    } else {
        // Populate all categories using optgroups for clarity
        for (var cat in COEP_CLUB_CATEGORIES) {
            var group = document.createElement('optgroup');
            group.label = cat;
            var clubs = COEP_CLUB_CATEGORIES[cat];
            for (var c = 0; c < clubs.length; c++) {
                var o = document.createElement('option');
                o.value = clubs[c];
                o.textContent = clubs[c];
                group.appendChild(o);
            }
            clubSelect.appendChild(group);
        }
    }
}

// ---------------------------------------------------------------
// loadEvents()
// Fetches the event list from GET /api/events and builds the table.
// Shows joined names and derived status.
// ---------------------------------------------------------------
async function loadEvents() {
    var result = await callApi('GET', '/api/events', null);

    // Clean up any emojis from behind-the-scenes box
    cleanBehindTheScenes();

    if (!result.success) {
        document.getElementById('events-table-container').innerHTML =
            '<p style="color:red;">Error loading events: ' + result.message + '</p>';
        return;
    }

    cachedEvents = result.data;

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

    var displayRows = [];
    for (var i = 0; i < cachedEvents.length; i++) {
        var ev = cachedEvents[i];

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

    buildTable('events-table-container', columnNames, displayRows);
}

// ---------------------------------------------------------------
// submitEvent()
// Handles form submission for both adding a new event (POST)
// and updating an existing event (PUT).
// ---------------------------------------------------------------
async function submitEvent() {
    var editId      = document.getElementById('edit-event-id').value;
    var eventName   = document.getElementById('event-name').value.trim();
    var description = document.getElementById('event-description').value.trim();
    var eventDate   = document.getElementById('event-date').value;
    var eventType   = document.getElementById('event-type').value.trim();
    var startTime   = document.getElementById('event-start-time').value;
    var endTime     = document.getElementById('event-end-time').value;
    var venueVal    = document.getElementById('event-venue').value;
    var organizerVal= document.getElementById('event-organizer').value;
    var clubVal     = document.getElementById('event-club').value;
    var categoryVal = document.getElementById('event-category').value;

    if (!eventName || !eventDate || !venueVal || !organizerVal || !clubVal || !categoryVal) {
        showMessage('event-form-message', 'Please fill in all required fields (Name, Date, Venue, Organizer, Club, Category).', true);
        return;
    }

    var eventPayload = {
        event_name:     eventName,
        description:    description,
        event_date:     eventDate,
        event_type:     eventType,
        start_time:     startTime || null,
        end_time:       endTime || null,
        venue_name:     venueVal,
        organizer_name: organizerVal,
        club_name:      clubVal,
        category_name:  categoryVal
    };

    if (editId) {
        var updateResult = await callApi('PUT', '/api/events/' + editId, eventPayload);
        cleanBehindTheScenes();
        if (updateResult.success) {
            showMessage('event-form-message', 'Event updated successfully!', false);
            cancelEdit();
            loadEvents();
        } else {
            showMessage('event-form-message', updateResult.message, true);
        }
    } else {
        var insertResult = await callApi('POST', '/api/events', eventPayload);
        cleanBehindTheScenes();
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
// Deletes an event by its ID. Demonstrates referential integrity.
// ---------------------------------------------------------------
async function deleteEvent(eventId) {
    var confirmed = confirm(
        'Are you sure you want to delete this event?\n\n' +
        'Note: If registrations exist, deletion will be blocked by referential integrity.\n' +
        'Any schedule entries for this event will be deleted automatically (ON DELETE CASCADE).'
    );
    if (!confirmed) return;

    var result = await callApi('DELETE', '/api/events/' + eventId, null);
    cleanBehindTheScenes();

    if (result.success) {
        showMessage('event-form-message', 'Event deleted successfully.', false);
        loadEvents();
    } else {
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

    document.getElementById('edit-event-id').value       = eventData.event_id;
    document.getElementById('event-name').value          = eventData.event_name;
    document.getElementById('event-description').value   = eventData.description || '';
    document.getElementById('event-date').value          = formatDate(eventData.event_date);
    document.getElementById('event-type').value          = eventData.event_type || '';
    document.getElementById('event-start-time').value    = eventData.start_time ? eventData.start_time.slice(0, 5) : '';
    document.getElementById('event-end-time').value      = eventData.end_time ? eventData.end_time.slice(0, 5) : '';

    // Set Venue (add dynamically if not present)
    ensureSelectOption('event-venue', eventData.venue_name);
    document.getElementById('event-venue').value = eventData.venue_name;

    // Set Organizer
    ensureSelectOption('event-organizer', eventData.organizer_name);
    document.getElementById('event-organizer').value = eventData.organizer_name;

    // Find club category and set club
    var foundCat = '';
    for (var cCategory in COEP_CLUB_CATEGORIES) {
        if (COEP_CLUB_CATEGORIES[cCategory].indexOf(eventData.club_name) !== -1) {
            foundCat = cCategory;
            break;
        }
    }
    if (foundCat) {
        document.getElementById('club-category-select').value = foundCat;
        populateClubsDropdown(foundCat);
    } else {
        document.getElementById('club-category-select').value = '';
        populateClubsDropdown('');
    }
    ensureSelectOption('event-club', eventData.club_name);
    document.getElementById('event-club').value = eventData.club_name;

    // Set Category
    ensureSelectOption('event-category', eventData.category_name);
    document.getElementById('event-category').value = eventData.category_name;

    document.getElementById('form-heading').textContent  = 'Edit Event (ID: ' + eventId + ')';
    document.getElementById('event-submit-btn').textContent = 'Save Changes';
    document.getElementById('event-cancel-btn').style.display = 'inline-block';

    document.getElementById('event-form-card').scrollIntoView({ behavior: 'smooth' });
}

// ---------------------------------------------------------------
// ensureSelectOption(selectId, value)
// Adds value as an option if not already in the select element.
// ---------------------------------------------------------------
function ensureSelectOption(selectId, value) {
    if (!value) return;
    var sel = document.getElementById(selectId);
    for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === value) return;
    }
    var opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    sel.appendChild(opt);
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
    document.getElementById('club-category-select').value = '';
    populateClubsDropdown('');
    document.getElementById('event-club').value        = '';
    document.getElementById('event-category').value    = '';

    var msgDiv = document.getElementById('event-form-message');
    msgDiv.textContent = '';
    msgDiv.className   = 'message';
}

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
