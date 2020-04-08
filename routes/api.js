const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('basic-auth');
const bcrypt = require('bcryptjs');
const {User, Course} = require('../db/models');

// Parse JSON 
router.use(express.json());

/**
 * Async Await Handler
 *
 * @param {function} callBack - Anonymous middleware function for route handling
 * @returns {[return type]} Response or next
 */
 function asyncHandler(callBack) {
     return async (req, res, next) => {
        try {
            await callBack(req, res, next);
        } catch (err) {
            if (err.name === "SequelizeUniqueConstraintError") {
                res.status(400).json({ ERROR: `${err}` });
            } else {
                res.status(500).json({ ERROR: `${err}` });
            }
        };
     };
 };

/**
 * Middleware function: Arrow Function Expression to Authenticate User
 *
 * @param {object} req - HTTP request
 * @param {object} res - Response to HTTP request
 * @param {function} next - next middleware function
 * @returns {object} Request object with validated user or errorMessage variable with error message object
 */

const authenticateUser = asyncHandler( async (req, res, next) => {

    let errorMessage = null;
    // Parse the user credentials from Basic Authorization header.
    const credentials = auth(req);

    //  If Authorization Header info is availbe
    if (credentials) {
        const validatedUser =
            await User.findOne({
                attributes: ['id', 'firstName', 'lastName', 'emailAddress', 'password'],
                where: {
                    emailAddress: credentials.name.toLowerCase()
                }
            });
        // If user is registered
        if (validatedUser) {
            const authenticated = bcrypt.compareSync(credentials.pass, validatedUser.password);
            // If Password is correct store validatedUser object on the request object
            if (authenticated) {
                req.currentUser = validatedUser;
            } else {
                errorMessage = `Incorrect password.`;
            }
        } else {
            errorMessage = `User ${credentials.name} not found.`;
        }
    } else {
        errorMessage = 'No Authorization header found.';
    }

    // If errorMessage respond with error message else continue
    if (errorMessage) {
        // Log warning
        console.warn(errorMessage);
        // Respond with issue
        res.status(401).json({ERROR: errorMessage});
    } else {
        // If authorized call next method
        next();
    }
});

// USER ROUTES:

// GET Users: Returns the current authenticated user
router.get('/users',authenticateUser, asyncHandler( async (req, res) => {
    const currentUser = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
        where: {
            emailAddress: req.currentUser.emailAddress
        }
    });
    res.json(currentUser[0]);
}));


// POST Users: Hash password and creates new user
router.post('/users',[
    check('firstName')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please enter your first name.'),
    check('lastName')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please enter your last name.'),
    check('emailAddress')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please enter your email.')
        // Validate that the provided email address value is in fact a valid email address.
        .isEmail()
        .withMessage('Please enter a valid email.')
        // Validate that the provided email address isn't already associated with an existing user record.
        .custom( async (value) => {
            if (value) {
                const match = await User.findOne({
                    attributes: ['emailAddress'],
                    where: {
                        emailAddress: value.toLowerCase()
                    }
                });
                if (match) {
                  throw new Error('This email is already registered.');
                }
            }
            return true;
          })
        .withMessage('This email is already registered.'),
    check('password')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please enter a password')
], asyncHandler( async (req, res) => {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
        res.status(400).json({Errors: valErrors.array().map( (error) => error.msg) });
    } else {
        const user = req.body;
        // Hash password
        user.password = await bcrypt.hash(user.password, 10);
        // Lowercase email
        user.emailAddress = user.emailAddress.toLowerCase();
        await User.create(user);
        res.status(201).location('/').end();
    };
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

// POST Course : Create new course
router.post('/courses',authenticateUser, [
    check('title')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a title for your course.'),
    check('description')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a description for your course.')
], asyncHandler( async (req, res) => {
    // If validation errors return errors, else return 201 Created
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
        res.status(400).json({errors: valErrors.array().map( (error) => error.msg) });
    } else {
        const newCourseInput = req.body;
        // Set user ID to current user so they can not post under different id
        newCourseInput.userId = req.currentUser.id;
        // Create new course record
        let newCourse = await Course.create(req.body);
        res.status(201).location('/courses/' + newCourse.id).end();
    }
}));


// PUT Course : Update course
router.put('/courses/:id',authenticateUser, [
    // Only check if JSON contains attribute
    check('title')
        // .if(check('title').exists()) REMOVED TO MEET PROJECT GUIDELINES
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a title for your course.'),
    check('description')
        // .if(check('description').exists()) REMOVED TO MEET PROJECT GUIDELINES
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a description for your course.')
], asyncHandler( async (req, res) => {
    const valErrors = validationResult(req);
    const updateCourse = await Course.findByPk(req.params.id);
    // If body is empty, return missing data error REMOVED TO MEET PROJECT GUIDELINES
    // if (JSON.stringify(req.body) === "{}" || JSON.stringify(req.body) === "") {
    //     res.status(400).json({ errors: 'Your request body is empty.' });
    // }
    // If course exists, else return 404 error
    if (updateCourse.userId === req.currentUser.id) {
        if (updateCourse) {
            // If validation errors return errors, else return 204 no content
            if (!valErrors.isEmpty()) {
                res.status(400).json({ errors: valErrors.array().map( (error) => error.msg) });
            } else {
                updateCourse.update(req.body);
                res.status(204).end();
            }
        } else {
            res.status(404).json({ message: `Course with id: ${req.params.id} was not found.`});
        }
    } else {
        res.status(403).json({ message: `Sorry ${req.currentUser.firstName}, you can only update your own courses.`});
    }
}));

// DELETE Course : If course with id exists, delete course
router.delete('/courses/:id',authenticateUser, asyncHandler( async (req, res) => {
    const deleteCourse = await Course.findByPk(req.params.id);
    if (deleteCourse.userId === req.currentUser.id) {
        if (deleteCourse) {
            deleteCourse.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ message: `Course with id: ${req.params.id} was not found.`});
        }
    } else {
        res.status(403).json({ message: `Sorry ${req.currentUser.firstName}, you can only delete your own courses.`});
    }
}));


module.exports = router;