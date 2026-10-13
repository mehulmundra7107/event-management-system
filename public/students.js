// students.js
// Part 1: Written by Member 1
// Frontend logic for the Students page (students.html).
// Follows the flow: form -> read values -> callApi(fetch) -> show result -> reload table

// ---------------------------------------------------------------
// Page load: insert navbar and load the student list
// ---------------------------------------------------------------
// When the page finishes loading, run this function
window.onload = function () {
    // Insert the navbar at the top (function defined in common.js)
    addNavbar();
    // Load and display the current list of students
    loadStudents();
};

// ---------------------------------------------------------------
// loadStudents()
// Calls GET /api/students and builds the table.
// ---------------------------------------------------------------
async function loadStudents() {
    // callApi is defined in common.js. It wraps fetch() and also
    // calls showBehindTheScenes() to fill the panel at the bottom.
    var result = await callApi('GET', '/api/students', null);

    if (!result.success) {
        document.getElementById('students-table-container').innerHTML =
            '<p style="color:red;">Error loading students: ' + result.message + '</p>';
        return;
    }

    // Build a table from the returned rows.
    // Column header names must match the order of keys returned by the API.
    var columnNames = ['ID', 'Name', 'Email', 'Department', 'Year', 'Actions'];

    // The data rows from the database (array of objects)
    var rows = result.data;

    // We need to add Action buttons (Edit, Delete, View Phones) to each row.
    // We do this by adding an 'actions' key to each row object.
    for (var i = 0; i < rows.length; i++) {
        var studentId = rows[i].student_id;
        // Build the HTML for the action buttons for this row
        rows[i].actions =
            '<button class="btn-edit" onclick="startEdit(' + studentId + ')">Edit</button> ' +
            '<button class="btn-danger" onclick="deleteStudent(' + studentId + ')">Delete</button> ' +
            '<button class="btn-secondary" onclick="viewPhones(' + studentId + ')">View Phones</button>';
    }

    // buildTable() is defined in common.js
    buildTable('students-table-container', columnNames, rows);

    // Hide the phone display panel when table reloads
    var phoneDiv = document.getElementById('phone-display');
    phoneDiv.style.display = 'none';
}

// ---------------------------------------------------------------
// submitStudent()
// Called when the user clicks the "Add Student" or "Save Changes" button.
// Decides whether to INSERT or UPDATE based on whether edit mode is active.
// ---------------------------------------------------------------
async function submitStudent() {
    // Step 1: Read all input values from the form
    var studentName  = document.getElementById('student-name').value.trim();
    var studentEmail = document.getElementById('student-email').value.trim();
    var department   = document.getElementById('student-department').value.trim();
    var year         = document.getElementById('student-year').value.trim();
    var phone1       = document.getElementById('student-phone1').value.trim();
    var phone2       = document.getElementById('student-phone2').value.trim();
    var editId       = document.getElementById('edit-student-id').value;

    // Simple validation: required fields must not be empty
    if (!studentName || !studentEmail || !department || !year) {
        showMessage('form-message', 'Please fill in Name, Email, Department and Year.', true);
        return;
    }

    if (editId) {
        // ---- EDIT MODE: Send a PUT request to update the student ----
        // Step 2: Build the object to send to the backend
        var updateObject = {
            name:       studentName,
            email:      studentEmail,
            department: department,
            year:       year
        };
        // Step 3: Call the API using fetch (via callApi in common.js)
        var result = await callApi('PUT', '/api/students/' + editId, updateObject);

        if (result.success) {
            showMessage('form-message', 'Student updated successfully!', false);
            cancelEdit();       // reset the form back to Add mode
            loadStudents();     // reload the table
        } else {
            showMessage('form-message', result.message, true);
        }

    } else {
        // ---- ADD MODE: Send a POST request to insert a new student ----
        // Step 2: Build the object to send
        var newStudent = {
            name:       studentName,
            email:      studentEmail,
            department: department,
            year:       year,
            phone1:     phone1,
            phone2:     phone2
        };
        // Step 3: Call the API
        var result = await callApi('POST', '/api/students', newStudent);

        // Step 4: Show success or error message
        if (result.success) {
            showMessage('form-message', 'Student added successfully!', false);
            clearForm();
            // Step 5: Reload the table to show the new row
            loadStudents();
        } else {
            showMessage('form-message', result.message, true);
        }
    }
}

// ---------------------------------------------------------------
// deleteStudent(studentId)
// Sends a DELETE request for the given student.
// If MySQL rejects it (student has registrations), shows a friendly error.
// ---------------------------------------------------------------
async function deleteStudent(studentId) {
    // Ask the user to confirm before deleting
    if (!confirm('Are you sure you want to delete this student?')) return;

    var result = await callApi('DELETE', '/api/students/' + studentId, null);

    if (result.success) {
        showMessage('form-message', 'Student deleted.', false);
        loadStudents();
    } else {
        // This could be "Cannot delete: other records depend on this one."
        // which demonstrates referential integrity to the teacher
        showMessage('form-message', result.message, true);
    }
}

// ---------------------------------------------------------------
// startEdit(studentId)
// When the user clicks Edit on a row, this function reads the row's
// data from the table and fills the form so the user can change values.
// ---------------------------------------------------------------
async function startEdit(studentId) {
    // Load the full student list to find the student's current data
    var result = await callApi('GET', '/api/students', null);
    if (!result.success) return;

    // Find the one student that matches the id we want to edit
    var studentData = null;
    for (var i = 0; i < result.data.length; i++) {
        if (result.data[i].student_id == studentId) {
            studentData = result.data[i];
            break;
        }
    }
    if (!studentData) return;

    // Fill the form fields with the current values
    document.getElementById('student-name').value       = studentData.name;
    document.getElementById('student-email').value      = studentData.email;
    document.getElementById('student-department').value = studentData.department;
    document.getElementById('student-year').value       = studentData.year;
    // Note: we don't pre-fill phones for edit (phones are a separate table)
    document.getElementById('student-phone1').value = '';
    document.getElementById('student-phone2').value = '';

    // Store the id in the hidden field so submitStudent() knows we are editing
    document.getElementById('edit-student-id').value = studentId;

    // Update button and heading to show Edit mode
    document.getElementById('form-heading').textContent  = 'Edit Student (ID: ' + studentId + ')';
    document.getElementById('submit-btn').textContent    = 'Save Changes';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';

    // Scroll up to the form
    document.getElementById('student-form-card').scrollIntoView({ behavior: 'smooth' });
}

// ---------------------------------------------------------------
// cancelEdit()
// Resets the form back to "Add" mode.
// ---------------------------------------------------------------
function cancelEdit() {
    document.getElementById('edit-student-id').value = '';
    document.getElementById('form-heading').textContent = 'Add New Student';
    document.getElementById('submit-btn').textContent   = 'Add Student';
    document.getElementById('cancel-edit-btn').style.display = 'none';
    clearForm();
}

// ---------------------------------------------------------------
// clearForm()
// Clears all input fields in the form.
// ---------------------------------------------------------------
function clearForm() {
    document.getElementById('student-name').value       = '';
    document.getElementById('student-email').value      = '';
    document.getElementById('student-department').value = '';
    document.getElementById('student-year').value       = '';
    document.getElementById('student-phone1').value     = '';
    document.getElementById('student-phone2').value     = '';
    // Clear the message div
    var msgDiv = document.getElementById('form-message');
    msgDiv.textContent = '';
    msgDiv.className   = 'message';
}

// ---------------------------------------------------------------
// viewPhones(studentId)
// Calls GET /api/students/:id/phones and shows the phone numbers
// in the phone-display panel below the table.
// This DEMONSTRATES the MULTIVALUED ATTRIBUTE concept:
// a student can have more than one phone stored in a separate table.
// ---------------------------------------------------------------
async function viewPhones(studentId) {
    var result = await callApi('GET', '/api/students/' + studentId + '/phones', null);

    var phoneDiv = document.getElementById('phone-display');
    phoneDiv.style.display = 'block';

    if (!result.success) {
        phoneDiv.innerHTML = '<strong>Error:</strong> ' + result.message;
        return;
    }

    if (result.data.length === 0) {
        phoneDiv.innerHTML = '<strong>Student ID ' + studentId + ':</strong> No phone numbers on record.';
        return;
    }

    // Build a simple list of phone numbers
    var html = '<strong>Phone numbers for Student ID ' + studentId + ':</strong><ul style="margin-top:6px;">';
    for (var i = 0; i < result.data.length; i++) {
        html += '<li>' + result.data[i].phone + '</li>';
    }
    html += '</ul>';
    phoneDiv.innerHTML = html;
}
