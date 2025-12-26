// const express = require('express');
// const router = express.Router();
// const hrController = require('../controllers/hrController');
// const authController = require('../controllers/authController'); // Add this line
// const { body } = require('express-validator');
// const { authMiddleware, adminAuth } = require('../middleware/authMiddleware');

// // Public routes
// router.post('/register', [
//     body('name').not().isEmpty().withMessage('Name is required'),
//     body('email').isEmail().withMessage('Please enter a valid email'),
//     body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//     body('company').not().isEmpty().withMessage('Company name is required'),
//     body('phone').not().isEmpty().withMessage('Phone number is required')
// ], hrController.registerHR);

// // Use authController.loginHR instead
// router.post('/login', [
//     body('email').isEmail().withMessage('Please enter a valid email'),
//     body('password').exists().withMessage('Password is required')
// ], authController.loginHR); // Changed from hrController.loginHR to authController.loginHR

// // Protected routes (Admin only)
// router.get('/', authMiddleware, adminAuth, hrController.getAllHRs);
// router.get('/:id', authMiddleware, hrController.getHRById);
// router.put('/:id', authMiddleware, adminAuth, hrController.updateHR);
// router.delete('/:id', authMiddleware, adminAuth, hrController.deleteHR);



// module.exports = router;

'use strict';

// @desc    Apply for a job
// @route   POST /api/applications/apply
// @access  Private
exports.applyForJob = async (req, res) => {
    try {
        console.log('✅ applyForJob called');
        res.json({
            success: true,
            message: 'Application submitted successfully',
            data: {
                jobId: req.body.jobId || 'no-job-id',
                userId: req.user ? req.user.id : 'no-user-id',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error in applyForJob:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in applyForJob'
        });
    }
};

// @desc    Get applications by job seeker
// @route   GET /api/applications/my-applications
// @access  Private
exports.getApplicationsByJobSeeker = async (req, res) => {
    try {
        console.log('✅ getApplicationsByJobSeeker called');
        res.json({
            success: true,
            message: 'Your applications retrieved successfully',
            applications: [],
            userId: req.user ? req.user.id : 'no-user-id'
        });
    } catch (error) {
        console.error('❌ Error in getApplicationsByJobSeeker:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in getApplicationsByJobSeeker'
        });
    }
};

// @desc    Get applications for a job (HR view)
// @route   GET /api/applications/job/:jobId
// @access  Private
exports.getApplicationsForJob = async (req, res) => {
    try {
        console.log('✅ getApplicationsForJob called');
        res.json({
            success: true,
            message: 'Applications for job retrieved successfully',
            jobId: req.params.jobId,
            applications: []
        });
    } catch (error) {
        console.error('❌ Error in getApplicationsForJob:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in getApplicationsForJob'
        });
    }
};

// @desc    Update application status
// @route   PUT /api/applications/:applicationId/status
// @access  Private
exports.updateApplicationStatus = async (req, res) => {
    try {
        console.log('✅ updateApplicationStatus called');
        res.json({
            success: true,
            message: 'Application status updated successfully',
            applicationId: req.params.applicationId,
            status: req.body.status || 'no-status',
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error in updateApplicationStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in updateApplicationStatus'
        });
    }
};