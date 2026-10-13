-- ============================================================
-- sample_data.sql
-- Event Management System - Sample / Seed Data
-- Run this file AFTER schema.sql
-- Insert order matters: parent tables before child tables
--   (club, organizer, venue, event_category) first,
--   then student, event, event_schedule,
--   then registration, feedback, and phone tables last.
-- ============================================================

USE event_management;

-- ============================================================
-- Clubs / Committees
-- ============================================================
INSERT INTO club (club_name, description, contact_email) VALUES
('Coding Club',          'Promotes programming and software development', 'coding@college.edu'),
('Cultural Committee',   'Organises cultural fests and arts events',       'cultural@college.edu'),
('IEEE Student Branch',  'Technical society for electronics and CS',       'ieee@college.edu'),
('Sports Committee',     'Manages all sports and fitness events',          'sports@college.edu'),
('Entrepreneurship Cell','Startup culture and business events',            'ecell@college.edu'),
('Drama Club',           'Theatre, plays, and performing arts',            'drama@college.edu');

-- ============================================================
-- Organizers
-- ============================================================
INSERT INTO organizer (name, email, department_club) VALUES
('Prof. Ramesh Patil',   'ramesh.patil@college.edu',  'CSE Department'),
('Prof. Sunita Sharma',  'sunita.sharma@college.edu', 'IT Department'),
('Ankit Desai',          'ankit.desai@college.edu',   'Coding Club'),
('Priya Mehta',          'priya.mehta@college.edu',   'Cultural Committee'),
('Dr. Vijay Kulkarni',   'vijay.k@college.edu',       'ENTC Department'),
('Neha Joshi',           'neha.joshi@college.edu',    'Entrepreneurship Cell');

-- ============================================================
-- Venues
-- ============================================================
INSERT INTO venue (venue_name, location, capacity) VALUES
('Main Auditorium',  'Building A, Ground Floor', 500),
('Seminar Hall 1',   'Building B, First Floor',  120),
('Seminar Hall 2',   'Building C, Second Floor', 80),
('Open Amphitheatre','Near Main Gate',            300),
('Computer Lab 3',   'Building D, Third Floor',  60),
('Sports Ground',    'Behind Hostel Block',       1000);

-- ============================================================
-- Event Categories
-- ============================================================
INSERT INTO event_category (category_name, description) VALUES
('Technical',   'Hackathons, coding contests, workshops on tech topics'),
('Cultural',    'Music, dance, drama, and art performances'),
('Sports',      'Athletic competitions and fitness events'),
('Workshop',    'Hands-on learning and skill-building sessions'),
('Seminar',     'Guest lectures, talks, and knowledge-sharing sessions'),
('Competition', 'Inter-college and intra-college competitions');

-- ============================================================
-- Students
-- ============================================================
INSERT INTO student (name, email, department, year) VALUES
('Asha Verma',       'asha.verma@student.edu',    'CSE',        2),
('Rohan Kulkarni',   'rohan.k@student.edu',       'IT',         3),
('Sneha Patil',      'sneha.patil@student.edu',   'ENTC',       1),
('Amit Sharma',      'amit.sharma@student.edu',   'Mechanical', 4),
('Divya Joshi',      'divya.joshi@student.edu',   'CSE',        2),
('Karan Mehta',      'karan.mehta@student.edu',   'IT',         3),
('Pooja Desai',      'pooja.desai@student.edu',   'Civil',      1),
('Rahul Nair',       'rahul.nair@student.edu',    'CSE',        4);

-- ============================================================
-- Events
-- Mix of past, ongoing (today), and future dates.
-- DATE_SUB(CURDATE(), ...) = past
-- CURDATE()               = today (Ongoing)
-- DATE_ADD(CURDATE(), ...) = future (Upcoming)
-- ============================================================
INSERT INTO event (event_name, description, event_date, event_type, start_time, end_time,
                   club_id, organizer_id, venue_id, category_id) VALUES
-- Past events (Completed)
('CodeSprint 2025',
 '24-hour national-level hackathon for engineering students',
 DATE_SUB(CURDATE(), INTERVAL 30 DAY),
 'Hackathon', '08:00:00', '08:00:00', 1, 1, 1, 1),

('Rangmanch - Cultural Fest',
 'Annual cultural festival with music, dance and drama',
 DATE_SUB(CURDATE(), INTERVAL 15 DAY),
 'Fest', '10:00:00', '20:00:00', 2, 4, 4, 2),

('ENTC Workshop: PCB Design',
 'Hands-on printed circuit board design using KiCad',
 DATE_SUB(CURDATE(), INTERVAL 7 DAY),
 'Workshop', '09:00:00', '17:00:00', 3, 5, 2, 4),

-- Today (Ongoing)
('AI & ML Seminar',
 'Guest lecture on Artificial Intelligence and Machine Learning trends',
 CURDATE(),
 'Seminar', '11:00:00', '13:00:00', 1, 2, 2, 5),

-- Future events (Upcoming)
('Inter-College Cricket Tournament',
 'Knockout-format cricket tournament for all departments',
 DATE_ADD(CURDATE(), INTERVAL 5 DAY),
 'Tournament', '07:00:00', '18:00:00', 4, 1, 6, 3),

('Startup Pitch Day',
 'Students pitch their startup ideas to industry mentors',
 DATE_ADD(CURDATE(), INTERVAL 12 DAY),
 'Competition', '10:00:00', '16:00:00', 5, 6, 1, 6),

('Python Bootcamp',
 'Two-day beginner-to-intermediate Python programming workshop',
 DATE_ADD(CURDATE(), INTERVAL 20 DAY),
 'Workshop', '09:00:00', '17:00:00', 1, 3, 5, 4),

-- Event with ZERO registrations (used in reports to show LEFT JOIN)
('Drama Auditions',
 'Open auditions for the annual college play',
 DATE_ADD(CURDATE(), INTERVAL 25 DAY),
 'Audition', '14:00:00', '18:00:00', 6, 4, 3, 2);

-- ============================================================
-- Event Schedules (Weak Entity)
-- schedule_id is a partial key - unique only within one event
-- ============================================================
-- Schedule for CodeSprint 2025 (event_id = 1)
INSERT INTO event_schedule (event_id, schedule_id, activity_name, start_time, end_time) VALUES
(1, 1, 'Opening Ceremony & Problem Statement Release', '08:00:00', '09:00:00'),
(1, 2, 'Hacking Phase 1',                             '09:00:00', '20:00:00'),
(1, 3, 'Hacking Phase 2 (overnight)',                 '20:00:00', '06:00:00'),
(1, 4, 'Final Presentations & Judging',               '06:00:00', '08:00:00');

-- Schedule for Rangmanch (event_id = 2)
INSERT INTO event_schedule (event_id, schedule_id, activity_name, start_time, end_time) VALUES
(2, 1, 'Classical Dance Performances', '10:00:00', '12:30:00'),
(2, 2, 'Band Night',                   '14:00:00', '17:00:00'),
(2, 3, 'Drama - Main Stage',           '18:00:00', '20:00:00');

-- Schedule for AI & ML Seminar (event_id = 4)
INSERT INTO event_schedule (event_id, schedule_id, activity_name, start_time, end_time) VALUES
(4, 1, 'Keynote: Introduction to AI',   '11:00:00', '12:00:00'),
(4, 2, 'Panel Discussion & Q&A',        '12:00:00', '13:00:00');

-- Schedule for Python Bootcamp (event_id = 7)
INSERT INTO event_schedule (event_id, schedule_id, activity_name, start_time, end_time) VALUES
(7, 1, 'Day 1: Python Basics',          '09:00:00', '13:00:00'),
(7, 2, 'Day 1: Functions & Files',      '14:00:00', '17:00:00'),
(7, 3, 'Day 2: OOP & Libraries',        '09:00:00', '13:00:00'),
(7, 4, 'Day 2: Mini Project',           '14:00:00', '17:00:00');

-- ============================================================
-- Registrations
-- (Student 7 / Pooja Desai has NO registrations - for report)
-- (event_id 8 / Drama Auditions has NO registrations - for report)
-- ============================================================
INSERT INTO registration (student_id, event_id, registration_date, status) VALUES
-- CodeSprint 2025
(1, 1, DATE_SUB(CURDATE(), INTERVAL 35 DAY), 'Registered'),
(2, 1, DATE_SUB(CURDATE(), INTERVAL 34 DAY), 'Registered'),
(5, 1, DATE_SUB(CURDATE(), INTERVAL 33 DAY), 'Registered'),
-- Rangmanch
(1, 2, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Registered'),
(3, 2, DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'Registered'),
(6, 2, DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'Registered'),
-- ENTC Workshop
(3, 3, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Registered'),
(4, 3, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Registered'),
-- AI & ML Seminar
(1, 4, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'Registered'),
(2, 4, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'Registered'),
(5, 4, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'Registered'),
(8, 4, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'Registered'),
-- Cricket Tournament
(2, 5, CURDATE(), 'Registered'),
(4, 5, CURDATE(), 'Registered'),
(6, 5, CURDATE(), 'Registered'),
(8, 5, CURDATE(), 'Registered'),
-- Startup Pitch Day
(1, 6, CURDATE(), 'Registered'),
(5, 6, CURDATE(), 'Registered'),
-- Python Bootcamp
(1, 7, CURDATE(), 'Registered'),
(2, 7, CURDATE(), 'Registered'),
(3, 7, CURDATE(), 'Registered');

-- ============================================================
-- Feedback
-- (Multiple students rate the same events so AVG is meaningful)
-- ============================================================
INSERT INTO feedback (student_id, event_id, rating, comments, feedback_date) VALUES
-- CodeSprint 2025 - rated by 3 students
(1, 1, 5, 'Excellent event! Great problem statements and mentors.', DATE_SUB(CURDATE(), INTERVAL 29 DAY)),
(2, 1, 4, 'Well organised. Food could have been better.',           DATE_SUB(CURDATE(), INTERVAL 29 DAY)),
(5, 1, 5, 'Loved every moment. Hope to attend next year too.',      DATE_SUB(CURDATE(), INTERVAL 28 DAY)),
-- Rangmanch - rated by 3 students
(1, 2, 4, 'Great performances, especially the drama.',             DATE_SUB(CURDATE(), INTERVAL 14 DAY)),
(3, 2, 3, 'Decent event but sound system had issues.',             DATE_SUB(CURDATE(), INTERVAL 14 DAY)),
(6, 2, 5, 'Best cultural fest I have attended!',                   DATE_SUB(CURDATE(), INTERVAL 13 DAY)),
-- ENTC Workshop - rated by 2 students
(3, 3, 4, 'Very practical and hands-on. Learned a lot.',          DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(4, 3, 3, 'Content was good but pace was too fast.',              DATE_SUB(CURDATE(), INTERVAL 6 DAY));

-- ============================================================
-- Student Phone Numbers (Multivalued Attribute)
-- ============================================================
INSERT INTO student_phone (student_id, phone) VALUES
(1, '9876543210'),
(1, '9123456780'),   -- Asha has two numbers
(2, '9988776655'),
(3, '9090909090'),
(4, '9871234567'),
(5, '9812345678'),
(5, '9012345678'),   -- Divya has two numbers
(6, '9776655443'),
(7, '9654321098'),
(8, '9543210987');

-- ============================================================
-- Organizer Phone Numbers (Multivalued Attribute)
-- ============================================================
INSERT INTO organizer_phone (organizer_id, phone) VALUES
(1, '9111111111'),
(1, '9222222222'),   -- Prof. Ramesh has two numbers
(2, '9333333333'),
(3, '9444444444'),
(4, '9555555555'),
(5, '9666666666'),
(6, '9777777777');
