const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Job seeker routes
router.post('/apply', authMiddleware, applicationController.applyForJob);
router.get('/my-applications', authMiddleware, applicationController.getApplicationsByJobSeeker);

// HR routes
router.get('/job/:jobId', authMiddleware, applicationController.getApplicationsForJob);
router.put('/:applicationId/status', authMiddleware, applicationController.updateApplicationStatus);

module.exports = router;