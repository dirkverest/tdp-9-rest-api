const express = require('express');
const router = express.Router();


// USER ROUTES:

// TODO : GET /api/users 200 - Returns the currently authenticated user
// GET Users: Returns the currently authenticated user
router.get('/users', (req, res) => {
    res.json({
        message: 'Returns the currently authenticated user',
    });
});

// TODO : POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content
// POST Users: Creates new user
router.post('/users', (req, res) => {
    res.json({
        message: 'Create new user',
    });
});


// COURSE ROUTES:

// TODO : GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
// GET Course : Returns all courses
router.get('/courses', (req, res) => {
    res.json({
        message: 'Returns list of courses',
    });
});

// TODO : GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
// GET Course : Returns course with :id
router.get('/courses/:id', (req, res) => {
    res.json({
        message: `Returns list of course with ${req.params.id}`,
    });
});

// TODO : POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
// POST Course : Create new course
router.post('/courses', (req, res) => {
    res.json({
        message: `Create course`,
    });
});

// TODO : PUT /api/courses/:id 204 - Updates a course and returns no content
// PUT Course : Update course
router.put('/courses/:id', (req, res) => {
    res.json({
        message: `Update course`,
    });
});

// TODO : DELETE /api/courses/:id 204 - Deletes a course and returns no content
// PUT Course : Update course
router.delete('/courses/:id', (req, res) => {
    res.json({
        message: `Delete course`,
    });
});


module.exports = router;