// const express = require('express');
// const router = express.Router();
// const hrController = require('../controllers/hrController');
// const { authMiddleware, adminAuth } = require('../middleware/authMiddleware');

// // Public routes
// router.post('/register', hrController.registerHR);
// router.post('/login', hrController.loginHR);

// // Protected routes
// router.get('/', authMiddleware, adminAuth, hrController.getAllHRs);
// router.get('/:id', authMiddleware, hrController.getHRById);
// router.put('/:id', authMiddleware, adminAuth, hrController.updateHR);
// router.delete('/:id', authMiddleware, adminAuth, hrController.deleteHR);

// module.exports = router;


const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const { authMiddleware, adminAuth } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('company').not().isEmpty().withMessage('Company name is required'),
    body('phone').not().isEmpty().withMessage('Phone number is required')
], hrController.registerHR);

router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], authController.loginHR);

// Protected routes (Admin only)
router.get('/', authMiddleware, adminAuth, hrController.getAllHRs);
router.get('/:id', authMiddleware, hrController.getHRById);
router.put('/:id', authMiddleware, adminAuth, hrController.updateHR);
router.delete('/:id', authMiddleware, adminAuth, hrController.deleteHR);

module.exports = router;