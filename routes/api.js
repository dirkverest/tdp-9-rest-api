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
 * @param {function} callBack - Sequelize query
 * @returns {[return type]} [documents the function's return value]
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
 * Authenticate User
 *
 * @param {[parameter type]} param1 - [parameter description]
 * @param {[param type]} param2 - [parameter description]
 * @returns {[return type]} [documents the function's return value]
 */

async function isRegisteredUser(user) {
    await User.findOne({
        where: {
            emailAddress: user.name.toLowerCase()
        }
    })
};


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
                    emailAddress: credentials.name
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

    if (errorMessage) {
        // Log warning
        console.warn(errorMessage);
        // Respond with issue
        res.status(401).json({errorMessage});
    } else {
        // If authorized call next method
        next();
    }
});




// USER ROUTES:

// GET Users: Returns the currently authenticated user
router.get('/users',authenticateUser, asyncHandler( async (req, res) => {
    res.json(
        await User.findAll({
            attributes: ['firstName', 'lastName', 'emailAddress'],
            where: {
                emailAddress: req.currentUser.emailAddress
            }
        })
    );
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
            const match = await User.findOne({
                attributes: ['emailAddress'],
                where: {
                    emailAddress: value
                }
            });
            if (match) {
              throw new Error('This email is already registered.');
            }
            return true;
          })
        .withMessage('This email is already registered.'),
    check('password')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please a password')
], asyncHandler( async (req, res) => {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
        res.status(400).json(valErrors.array().map( (error, index) => {return `Error ${index + 1}: ${error.msg}`}) );
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
        res.status(400).json(valErrors.array().map( (error, index) => {return `Error ${index + 1}: ${error.msg}`}) );
    } else {
        const newCourseInput = req.body;
        // Set user ID to current user
        newCourseInput.userId = req.currentUser.id;
        // Create new course record
        let newCourse = await Course.create(req.body);
        res.status(201).location('/courses/' + newCourse.id).end();
    }
}));


// PUT Course : Update course
router.put('/courses/:id',authenticateUser, [
    check('title')
        .if(check('title').exists()).exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a title for your course.'),
    check('description')
        .if(check('description').exists()).exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a description for your course.')
], asyncHandler( async (req, res) => {
    const updateCourse = await Course.findByPk(req.params.id);
    // If course exists, else return 404 error
    if (updateCourse.userId === req.currentUser.id) {
        if (updateCourse) {
            // If validation errors return errors, else return 204 no content
            const valErrors = validationResult(req);
            if (!valErrors.isEmpty()) {
                res.status(400).json(valErrors.array().map( (error, index) => {return `Error ${index + 1}: ${error.msg}`}) );
            } else {
                updateCourse.update(req.body);
                res.status(204).end();
            }
        } else {
            res.status(404).json({ message: `Course with id: ${req.params.id} was not found.`});
        }
    } else {
        res.status(401).json({ message: `Sorry ${req.currentUser.firstName}, you can only update your own courses.`});
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
        res.status(401).json({ message: `Sorry ${req.currentUser.firstName}, you can only deleter your own courses.`});
    }
}));


module.exports = router;