// server.js
// This is the main entry point of the backend server.
// It sets up Express and registers all the API routes.

// Load environment variables from .env before anything else
const dotenv = require('dotenv');
dotenv.config();

// Import the Express framework
const express = require('express');
const app = express();

// The port to listen on (from .env, or 3000 by default)
const PORT = process.env.PORT || 3000;

// Tell Express to automatically parse JSON request bodies.
// Without this, req.body would be undefined when the frontend sends JSON.
app.use(express.json());

// Serve all files in the 'public' folder as static files.
// This means http://localhost:3000/students.html serves public/students.html,
// and http://localhost:3000/style.css serves public/style.css.
// Because frontend and backend share the same address, we do NOT need cors.
app.use(express.static('../public'));

// ---------------------------------------------------------------
// Register API route files.
// Each route file handles a group of related API endpoints.
// For example, all /api/students endpoints are in routes/students.js
// ---------------------------------------------------------------

// Part 1: Student routes (built by Member 1)
app.use('/api/students', require('./routes/students'));

// Part 2: Master data routes - venues, organizers, clubs, categories
//         (to be built by Member 2; placeholder file created by Member 1)
//         Member 2 will define routes like router.get('/venues', ...) inside master.js
app.use('/api', require('./routes/master'));

// Part 3: Events and event schedule
//         (to be built by Member 3; placeholder file created by Member 1)
app.use('/api/events',    require('./routes/events'));
app.use('/api/schedule',  require('./routes/schedule'));

// Part 4: Registrations, feedback, reports, dashboard
//         (to be built by Member 4; placeholder file created by Member 1)
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/feedback',      require('./routes/feedback'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// ---------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------
app.listen(PORT, function () {
    console.log('Server running on http://localhost:' + PORT);
    console.log('Open http://localhost:' + PORT + '/students.html to test the Student page.');
});
