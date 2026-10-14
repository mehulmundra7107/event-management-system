// master.js
// Part 2: Written by Member 2
// Frontend logic for Master Data page (master.html).
// Manages Venues, Organizers (with phones), Clubs, and Event Categories.

// ---------------------------------------------------------------
// Page load: insert navbar and load all master data tables
// ---------------------------------------------------------------
window.onload = function () {
    // Add the shared navigation bar at top of page (from common.js)
    addNavbar();

    // Fetch and display data for all four master tables
    loadVenues();
    loadOrganizers();
    loadClubs();
    loadCategories();
};

// ===============================================================
// 1. VENUES
// ===============================================================

// loadVenues()
// Fetches the list of all venues from GET /api/venues and builds the table.
async function loadVenues() {
    var result = await callApi('GET', '/api/venues', null);

    if (!result.success) {
        document.getElementById('venues-table-container').innerHTML =
            '<p style="color:red;">Error loading venues: ' + result.message + '</p>';
        return;
    }

    var columnNames = ['ID', 'Venue Name', 'Location', 'Capacity', 'Actions'];
    var rows = result.data;

    // Attach a Delete button to each venue row
    for (var i = 0; i < rows.length; i++) {
        var venueId = rows[i].venue_id;
        rows[i].actions =
            '<button class="btn-danger" onclick="deleteVenue(' + venueId + ')">Delete</button>';
    }

    buildTable('venues-table-container', columnNames, rows);
}

// submitVenue()
// Reads the venue form inputs, validates capacity > 0, and sends POST /api/venues.
async function submitVenue() {
    var venueName = document.getElementById('venue-name').value.trim();
    var location  = document.getElementById('venue-location').value.trim();
    var capacityText = document.getElementById('venue-capacity').value.trim();
    var capacity  = parseInt(capacityText, 10);

    // Frontend validation: venue name cannot be empty
    if (!venueName) {
        showMessage('venue-message', 'Please enter a venue name.', true);
        return;
    }

    // Frontend validation: capacity must be greater than 0
    if (isNaN(capacity) || capacity <= 0) {
        showMessage('venue-message', 'Capacity must be a number greater than 0.', true);
        return;
    }

    var venueObject = {
        venue_name: venueName,
        location:   location,
        capacity:   capacity
    };

    var result = await callApi('POST', '/api/venues', venueObject);

    if (result.success) {
        showMessage('venue-message', 'Venue added successfully!', false);
        // Clear input fields
        document.getElementById('venue-name').value = '';
        document.getElementById('venue-location').value = '';
        document.getElementById('venue-capacity').value = '';
        // Reload venue table to show the new record
        loadVenues();
    } else {
        showMessage('venue-message', result.message, true);
    }
}

// deleteVenue(venueId)
// Sends DELETE /api/venues/:id. If events use this venue, foreign key prevents deletion.
async function deleteVenue(venueId) {
    if (!confirm('Are you sure you want to delete this venue?')) {
        return;
    }

    var result = await callApi('DELETE', '/api/venues/' + venueId, null);

    if (result.success) {
        showMessage('venue-message', 'Venue deleted successfully.', false);
        loadVenues();
    } else {
        showMessage('venue-message', result.message, true);
    }
}

// ===============================================================
// 2. ORGANIZERS
// ===============================================================

// loadOrganizers()
// Fetches all organizers from GET /api/organizers and displays them in a table.
async function loadOrganizers() {
    var result = await callApi('GET', '/api/organizers', null);

    if (!result.success) {
        document.getElementById('organizers-table-container').innerHTML =
            '<p style="color:red;">Error loading organizers: ' + result.message + '</p>';
        return;
    }

    var columnNames = ['ID', 'Name', 'Email', 'Department / Club', 'Actions'];
    var rows = result.data;

    // Attach View Phones and Delete buttons to each organizer row
    for (var i = 0; i < rows.length; i++) {
        var organizerId = rows[i].organizer_id;
        rows[i].actions =
            '<button class="btn-secondary" onclick="viewOrganizerPhones(' + organizerId + ')">View Phones</button> ' +
            '<button class="btn-danger" onclick="deleteOrganizer(' + organizerId + ')">Delete</button>';
    }

    buildTable('organizers-table-container', columnNames, rows);

    // Hide any previous phone list display when table reloads
    var phoneDisplay = document.getElementById('organizer-phone-display');
    if (phoneDisplay) {
        phoneDisplay.style.display = 'none';
    }
}

// submitOrganizer()
// Reads organizer details including primary and optional secondary phone numbers.
// Calls POST /api/organizers to create the organizer and phone entries.
async function submitOrganizer() {
    var organizerName  = document.getElementById('organizer-name').value.trim();
    var organizerEmail = document.getElementById('organizer-email').value.trim();
    var departmentClub = document.getElementById('organizer-dept').value.trim();
    var phone1         = document.getElementById('organizer-phone1').value.trim();
    var phone2         = document.getElementById('organizer-phone2').value.trim();

    // Required field validation
    if (!organizerName || !organizerEmail || !departmentClub || !phone1) {
        showMessage('organizer-message', 'Please fill in Name, Email, Department/Club, and Primary Phone.', true);
        return;
    }

    var organizerObject = {
        name:            organizerName,
        email:           organizerEmail,
        department_club: departmentClub,
        phone1:          phone1,
        phone2:          phone2
    };

    var result = await callApi('POST', '/api/organizers', organizerObject);

    if (result.success) {
        showMessage('organizer-message', 'Organizer and phone(s) added successfully!', false);
        // Clear input fields
        document.getElementById('organizer-name').value = '';
        document.getElementById('organizer-email').value = '';
        document.getElementById('organizer-dept').value = '';
        document.getElementById('organizer-phone1').value = '';
        document.getElementById('organizer-phone2').value = '';
        loadOrganizers();
    } else {
        showMessage('organizer-message', result.message, true);
    }
}

// viewOrganizerPhones(organizerId)
// Fetches and displays phone numbers for a specific organizer.
// Demonstrates multivalued attributes in DBMS.
async function viewOrganizerPhones(organizerId) {
    var result = await callApi('GET', '/api/organizers/' + organizerId + '/phones', null);
    var phoneBox = document.getElementById('organizer-phone-display');

    if (!result.success) {
        phoneBox.innerHTML = '<span style="color:red;">Error fetching phones: ' + result.message + '</span>';
        phoneBox.style.display = 'block';
        return;
    }

    var phoneRows = result.data;
    if (!phoneRows || phoneRows.length === 0) {
        phoneBox.innerHTML = '<strong>Organizer ID ' + organizerId + ':</strong> No phone numbers registered.';
    } else {
        var phoneListText = '';
        for (var i = 0; i < phoneRows.length; i++) {
            phoneListText += phoneRows[i].phone;
            if (i < phoneRows.length - 1) {
                phoneListText += ', ';
            }
        }
        phoneBox.innerHTML = '<strong>Phone Numbers for Organizer #' + organizerId + ':</strong> ' + phoneListText;
    }

    phoneBox.style.display = 'block';
}

// deleteOrganizer(organizerId)
// Deletes an organizer by ID via DELETE /api/organizers/:id.
async function deleteOrganizer(organizerId) {
    if (!confirm('Are you sure you want to delete this organizer?')) {
        return;
    }

    var result = await callApi('DELETE', '/api/organizers/' + organizerId, null);

    if (result.success) {
        showMessage('organizer-message', 'Organizer deleted successfully.', false);
        loadOrganizers();
    } else {
        showMessage('organizer-message', result.message, true);
    }
}

// ===============================================================
// 3. CLUBS & COMMITTEES
// ===============================================================

// loadClubs()
// Fetches all clubs from GET /api/clubs and renders the table.
async function loadClubs() {
    var result = await callApi('GET', '/api/clubs', null);

    if (!result.success) {
        document.getElementById('clubs-table-container').innerHTML =
            '<p style="color:red;">Error loading clubs: ' + result.message + '</p>';
        return;
    }

    var columnNames = ['ID', 'Club Name', 'Description', 'Contact Email', 'Actions'];
    var rows = result.data;

    // Attach Delete button to each club row
    for (var i = 0; i < rows.length; i++) {
        var clubId = rows[i].club_id;
        rows[i].actions =
            '<button class="btn-danger" onclick="deleteClub(' + clubId + ')">Delete</button>';
    }

    buildTable('clubs-table-container', columnNames, rows);
}

// submitClub()
// Reads the club form and sends POST /api/clubs.
async function submitClub() {
    var clubName     = document.getElementById('club-name').value.trim();
    var description  = document.getElementById('club-desc').value.trim();
    var contactEmail = document.getElementById('club-email').value.trim();

    if (!clubName) {
        showMessage('club-message', 'Please enter a club name.', true);
        return;
    }

    var clubObject = {
        club_name:     clubName,
        description:   description,
        contact_email: contactEmail
    };

    var result = await callApi('POST', '/api/clubs', clubObject);

    if (result.success) {
        showMessage('club-message', 'Club added successfully!', false);
        document.getElementById('club-name').value = '';
        document.getElementById('club-desc').value = '';
        document.getElementById('club-email').value = '';
        loadClubs();
    } else {
        showMessage('club-message', result.message, true);
    }
}

// deleteClub(clubId)
// Deletes a club by ID via DELETE /api/clubs/:id.
async function deleteClub(clubId) {
    if (!confirm('Are you sure you want to delete this club?')) {
        return;
    }

    var result = await callApi('DELETE', '/api/clubs/' + clubId, null);

    if (result.success) {
        showMessage('club-message', 'Club deleted successfully.', false);
        loadClubs();
    } else {
        showMessage('club-message', result.message, true);
    }
}

// ===============================================================
// 4. EVENT CATEGORIES
// ===============================================================

// loadCategories()
// Fetches all event categories from GET /api/categories and renders the table.
async function loadCategories() {
    var result = await callApi('GET', '/api/categories', null);

    if (!result.success) {
        document.getElementById('categories-table-container').innerHTML =
            '<p style="color:red;">Error loading categories: ' + result.message + '</p>';
        return;
    }

    var columnNames = ['ID', 'Category Name', 'Description', 'Actions'];
    var rows = result.data;

    // Attach Delete button to each category row
    for (var i = 0; i < rows.length; i++) {
        var categoryId = rows[i].category_id;
        rows[i].actions =
            '<button class="btn-danger" onclick="deleteCategory(' + categoryId + ')">Delete</button>';
    }

    buildTable('categories-table-container', columnNames, rows);
}

// submitCategory()
// Reads category form inputs and sends POST /api/categories.
async function submitCategory() {
    var categoryName = document.getElementById('category-name').value.trim();
    var description  = document.getElementById('category-desc').value.trim();

    if (!categoryName) {
        showMessage('category-message', 'Please enter a category name.', true);
        return;
    }

    var categoryObject = {
        category_name: categoryName,
        description:   description
    };

    var result = await callApi('POST', '/api/categories', categoryObject);

    if (result.success) {
        showMessage('category-message', 'Category added successfully!', false);
        document.getElementById('category-name').value = '';
        document.getElementById('category-desc').value = '';
        loadCategories();
    } else {
        showMessage('category-message', result.message, true);
    }
}

// deleteCategory(categoryId)
// Deletes an event category by ID via DELETE /api/categories/:id.
async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) {
        return;
    }

    var result = await callApi('DELETE', '/api/categories/' + categoryId, null);

    if (result.success) {
        showMessage('category-message', 'Category deleted successfully.', false);
        loadCategories();
    } else {
        showMessage('category-message', result.message, true);
    }
}
