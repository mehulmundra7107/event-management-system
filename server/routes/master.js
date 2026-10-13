// routes/master.js
// Part 2: Built by Member 2
// Handles API routes for Master Data: Venues, Organizers, Clubs, and Event Categories.

const express = require('express');
const router = express.Router();

// Import the database connection pool from db.js
const db = require('../db');

// ---------------------------------------------------------------
// Helper: convert MySQL error codes to friendly messages.
// This ensures students and teachers see human-readable messages
// instead of raw MySQL database error codes.
// ---------------------------------------------------------------
function getFriendlyError(err) {
    if (err.code === 'ER_DUP_ENTRY')                 return 'This record already exists.';
    if (err.code === 'ER_ROW_IS_REFERENCED_2')       return 'Cannot delete: other records depend on this one.';
    if (err.code === 'ER_NO_REFERENCED_ROW_2')       return 'Selected related record does not exist.';
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return 'Value is not allowed (check the rules).';
    return err.message;
}

// ===============================================================
// 1. VENUES (venue table)
// ===============================================================

// GET /api/venues
// Retrieves all venues ordered by venue_id.
// Part 3 uses this endpoint to populate the Venue dropdown.
// SQL concept: simple SELECT with ORDER BY
router.get('/venues', async function (req, res) {
    const sql = `
SELECT
    venue_id,
    venue_name,
    location,
    capacity
FROM venue
ORDER BY venue_id`;
    const params = [];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// POST /api/venues
// Inserts a new venue. Capacity must be greater than 0.
// SQL concept: parameterized INSERT to prevent SQL injection
router.post('/venues', async function (req, res) {
    const venueName = req.body.venue_name;
    const location  = req.body.location;
    const capacity  = parseInt(req.body.capacity, 10);

    // Backend validation: capacity must be greater than 0
    if (!capacity || capacity <= 0) {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Venue capacity must be a number greater than 0.'
        });
    }

    const sql = `
INSERT INTO venue
    (venue_name, location, capacity)
VALUES
    (?, ?, ?)`;
    const params = [venueName, location, capacity];

    try {
        const [result] = await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ venue_id: result.insertId, message: 'Venue added successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// DELETE /api/venues/:id
// Deletes a venue by its ID.
// If an event is scheduled at this venue, MySQL RESTRICT blocks deletion.
// SQL concept: parameterized DELETE with WHERE
router.delete('/venues/:id', async function (req, res) {
    const venueId = req.params.id;
    const sql = `
DELETE FROM venue
WHERE venue_id = ?`;
    const params = [venueId];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Venue deleted successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ===============================================================
// 2. ORGANIZERS (organizer and organizer_phone tables)
// ===============================================================

// GET /api/organizers
// Retrieves all organizers ordered by organizer_id.
// Part 3 uses this endpoint to populate the Organizer dropdown.
// SQL concept: simple SELECT with ORDER BY
router.get('/organizers', async function (req, res) {
    const sql = `
SELECT
    organizer_id,
    name,
    email,
    department_club
FROM organizer
ORDER BY organizer_id`;
    const params = [];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// GET /api/organizers/:id/phones
// Retrieves all phone numbers for a specific organizer.
// Demonstrates how multivalued attributes are fetched from their own table.
// SQL concept: SELECT with WHERE using a parameter
router.get('/organizers/:id/phones', async function (req, res) {
    const organizerId = req.params.id;
    const sql = `
SELECT
    phone_id,
    organizer_id,
    phone
FROM organizer_phone
WHERE organizer_id = ?`;
    const params = [organizerId];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// POST /api/organizers
// Inserts a new organizer and their phone numbers.
// Demonstrates multivalued attributes: parent row inserted first,
// then child rows inserted using the generated insertId.
// SQL concept: INSERT with insertId and foreign key linkage
router.post('/organizers', async function (req, res) {
    const organizerName    = req.body.name;
    const organizerEmail   = req.body.email;
    const departmentClub   = req.body.department_club;
    const phone1           = req.body.phone1;
    const phone2           = req.body.phone2; // optional second phone

    const sql = `
INSERT INTO organizer
    (name, email, department_club)
VALUES
    (?, ?, ?)`;
    const params = [organizerName, organizerEmail, departmentClub];

    try {
        const [result] = await db.query(sql, params);
        const newOrganizerId = result.insertId;

        // Insert first phone number if provided
        if (phone1) {
            const phoneSql = `
INSERT INTO organizer_phone
    (organizer_id, phone)
VALUES
    (?, ?)`;
            await db.query(phoneSql, [newOrganizerId, phone1]);
        }

        // Insert optional second phone number if provided
        if (phone2) {
            const phoneSql = `
INSERT INTO organizer_phone
    (organizer_id, phone)
VALUES
    (?, ?)`;
            await db.query(phoneSql, [newOrganizerId, phone2]);
        }

        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ organizer_id: newOrganizerId, message: 'Organizer and phone(s) added successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// DELETE /api/organizers/:id
// Deletes an organizer by ID.
// Deletes child phone records first, then the organizer record.
// If an event references this organizer, MySQL RESTRICT will prevent deletion.
// SQL concept: DELETE with WHERE clause
router.delete('/organizers/:id', async function (req, res) {
    const organizerId = req.params.id;

    try {
        // Step 1: Remove associated phone numbers for this organizer
        const deletePhoneSql = `
DELETE FROM organizer_phone
WHERE organizer_id = ?`;
        await db.query(deletePhoneSql, [organizerId]);

        // Step 2: Delete the organizer record
        const sql = `
DELETE FROM organizer
WHERE organizer_id = ?`;
        const params = [organizerId];
        await db.query(sql, params);

        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Organizer deleted successfully.' }]
        });
    } catch (err) {
        res.json({
            success: false,
            sql: 'DELETE FROM organizer WHERE organizer_id = ?',
            params: [organizerId],
            message: getFriendlyError(err)
        });
    }
});

// ===============================================================
// 3. CLUBS (club table)
// ===============================================================

// GET /api/clubs
// Retrieves all clubs ordered by club_id.
// Part 3 uses this endpoint to populate the Club dropdown.
// SQL concept: simple SELECT with ORDER BY
router.get('/clubs', async function (req, res) {
    const sql = `
SELECT
    club_id,
    club_name,
    description,
    contact_email
FROM club
ORDER BY club_id`;
    const params = [];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// POST /api/clubs
// Inserts a new club.
// SQL concept: parameterized INSERT
router.post('/clubs', async function (req, res) {
    const clubName     = req.body.club_name;
    const description  = req.body.description;
    const contactEmail = req.body.contact_email;

    const sql = `
INSERT INTO club
    (club_name, description, contact_email)
VALUES
    (?, ?, ?)`;
    const params = [clubName, description, contactEmail];

    try {
        const [result] = await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ club_id: result.insertId, message: 'Club added successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// DELETE /api/clubs/:id
// Deletes a club by its ID.
// If an event is sponsored by this club, MySQL RESTRICT blocks deletion.
// SQL concept: parameterized DELETE with WHERE
router.delete('/clubs/:id', async function (req, res) {
    const clubId = req.params.id;
    const sql = `
DELETE FROM club
WHERE club_id = ?`;
    const params = [clubId];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Club deleted successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ===============================================================
// 4. EVENT CATEGORIES (event_category table)
// ===============================================================

// GET /api/categories
// Retrieves all event categories ordered by category_id.
// Part 3 uses this endpoint to populate the Category dropdown.
// SQL concept: simple SELECT with ORDER BY
router.get('/categories', async function (req, res) {
    const sql = `
SELECT
    category_id,
    category_name,
    description
FROM event_category
ORDER BY category_id`;
    const params = [];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// POST /api/categories
// Inserts a new event category.
// SQL concept: parameterized INSERT
router.post('/categories', async function (req, res) {
    const categoryName = req.body.category_name;
    const description  = req.body.description;

    const sql = `
INSERT INTO event_category
    (category_name, description)
VALUES
    (?, ?)`;
    const params = [categoryName, description];

    try {
        const [result] = await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ category_id: result.insertId, message: 'Category added successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// DELETE /api/categories/:id
// Deletes an event category by its ID.
// If an event belongs to this category, MySQL RESTRICT blocks deletion.
// SQL concept: parameterized DELETE with WHERE
router.delete('/categories/:id', async function (req, res) {
    const categoryId = req.params.id;
    const sql = `
DELETE FROM event_category
WHERE category_id = ?`;
    const params = [categoryId];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Category deleted successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

module.exports = router;
