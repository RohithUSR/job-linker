const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authMiddleware, hrAuth } = require('../middleware/authMiddleware');

// Public routes (job listings)
router.get('/listings', jobController.getAllJobOpenings);
router.get('/:id', jobController.getJobOpeningById);

// Protected HR routes
router.post('/', authMiddleware, hrAuth, jobController.createJobOpening);
router.get('/hr/my-jobs', authMiddleware, hrAuth, jobController.getJobOpeningsByHR);
router.put('/:id', authMiddleware, hrAuth, jobController.updateJobOpening);
router.delete('/:id', authMiddleware, hrAuth, jobController.deleteJobOpening);

module.exports = router;