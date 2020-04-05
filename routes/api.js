const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('basic-auth');
const {hash} = require('bcryptjs');
const {User, Course} = require('../db/models');

// Parse JSON 
router.use(express.json());

/**
 * Async Await Handler
 *
 * @param {function} callBack - Sequelize query
 * @returns {[return type]} [documents the function's return value]
 */
 function asyncHandler(callBack) {
     return async (req, res, next) => {
        try {
            await callBack(req, res, next);
        } catch (err) {
            res.status(500).json({ ERROR: `${err}` });
        };
     };
 };



/**
 * Authenticate User
 *
 * @param {[parameter type]} param1 - [parameter description]
 * @param {[param type]} param2 - [parameter description]
 * @returns {[return type]} [documents the function's return value]
 */

const authenticateUser = (req, res, next) => {
    let errorMessage = NULL;
    
};




// USER ROUTES:

// TODO : GET /api/users 200 - Returns the currently authenticated user
// GET Users: Returns the currently authenticated user
router.get('/users', asyncHandler( async (req, res) => {
    res.json(
        await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'emailAddress', 'password']
        })
    );
}));

// TODO : Validate input
// POST Users: Hash password and creates new user
router.post('/users', asyncHandler( async (req, res) => {
    const user = req.body;
    user.password = await hash(user.password, 10);
    await User.create(user);
    res.status(201).location('/').end();
}));




// COURSE ROUTES:

// GET Course : Returns all courses and the associated user
router.get('/courses', asyncHandler( async (req, res) => {
    res.json(
        await Course.findAll({
            attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            }]
        })
    );
}));


// GET Course : If course with id exists, returns course with associated user
router.get('/courses/:id', asyncHandler( async (req, res) => {
    const course = 
        await Course.findByPk(
            req.params.id,
            {
            attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            }]
        }); 
    if (course) {
        res.json(course);
    } else {
        res.status(404).json({ message: `Course with id: ${req.params.id} not found.`});
    };
}));

// TODO : Validate input
// POST Course : Create new course
router.post('/courses', asyncHandler( async (req, res) => {
    // Check for validation errors.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }


    let newCourse = await Course.create(req.body);
    res.status(201).location('/courses/' + newCourse.id).end();
}));

// TODO : Validate input
// PUT Course : Update course
router.put('/courses/:id', asyncHandler( async (req, res) => {
    const updateCourse = await Course.findByPk(req.params.id);
    if (updateCourse) {
        updateCourse.update(req.body);
        res.status(204).end();
    } else {
        res.status(404).json({ message: `Course with id: ${req.params.id} was not found.`});
    }
}));

// DELETE Course : If course with id exists, delete course
router.delete('/courses/:id', asyncHandler( async (req, res) => {
    const deleteCourse = await Course.findByPk(req.params.id);
    if (deleteCourse) {
        deleteCourse.destroy();
        res.status(204).end();
    } else {
        res.status(404).json({ message: `Course with id: ${req.params.id} was not found.`});
    }
}));


module.exports = router;