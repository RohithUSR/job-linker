const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HR = require('../models/HR');
const JobSeeker = require('../models/JobSeeker');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get current user (all roles)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        let user;
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'hr') {
            user = await HR.findById(userId).select('-password');
        } else if (role === 'jobseeker') {
            user = await JobSeeker.findById(userId).select('-password');
        } else if (role === 'admin') {
            user = {
                id: userId,
                role: 'admin',
                email: req.user.email,
                name: 'Admin User'
            };
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                ...user._doc || user,
                role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Job Seeker Registration
router.post('/jobseeker/register', [
    body('fullName').not().isEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullName, email, password, phone, location } = req.body;

        // Check if job seeker exists
        let jobSeeker = await JobSeeker.findOne({ email });
        if (jobSeeker) {
            return res.status(400).json({ message: 'Job seeker already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create job seeker
        jobSeeker = new JobSeeker({
            fullName,
            email,
            phone,
            location,
            password: hashedPassword,
            status: 'Active'
        });

        await jobSeeker.save();

        // Create JWT token
        const payload = {
            user: {
                id: jobSeeker._id,
                role: 'jobseeker',
                email: jobSeeker.email,
                name: jobSeeker.fullName
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Job seeker registered successfully',
            token,
            user: {
                id: jobSeeker._id,
                fullName: jobSeeker.fullName,
                email: jobSeeker.email,
                phone: jobSeeker.phone,
                location: jobSeeker.location,
                role: 'jobseeker'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Job Seeker Login
router.post('/jobseeker/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Check if job seeker exists
        const jobSeeker = await JobSeeker.findOne({ email });
        if (!jobSeeker) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, jobSeeker.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check status
        if (jobSeeker.status !== 'Active') {
            return res.status(400).json({ message: 'Account is not active' });
        }

        // Create JWT token
        const payload = {
            user: {
                id: jobSeeker._id,
                role: 'jobseeker',
                email: jobSeeker.email,
                name: jobSeeker.fullName
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: jobSeeker._id,
                fullName: jobSeeker.fullName,
                email: jobSeeker.email,
                phone: jobSeeker.phone,
                location: jobSeeker.location,
                role: 'jobseeker',
                skills: jobSeeker.skills,
                experience: jobSeeker.experience,
                education: jobSeeker.education,
                resumeUrl: jobSeeker.resumeUrl
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Login (For demonstration - in production, admin would be created differently)
router.post('/admin/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Hardcoded admin credentials for demo
        // In production, use a proper Admin model
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@recruitflow.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (email !== adminEmail || password !== adminPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token for admin
        const payload = {
            user: {
                id: 'admin-id',
                role: 'admin',
                email: adminEmail,
                name: 'Admin User'
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: 'admin-id',
                name: 'Admin User',
                email: adminEmail,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update User Profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const updates = req.body;

        let user;

        if (role === 'jobseeker') {
            user = await JobSeeker.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update allowed fields
            user.fullName = updates.fullName || user.fullName;
            user.email = updates.email || user.email;
            user.phone = updates.phone || user.phone;
            user.location = updates.location || user.location;
            user.linkedin = updates.linkedin || user.linkedin;
            user.skills = updates.skills || user.skills;
            user.experience = updates.experience || user.experience;
            user.education = updates.education || user.education;
            user.resumeUrl = updates.resumeUrl || user.resumeUrl;
            user.updatedAt = Date.now();

            await user.save();

            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    location: user.location,
                    linkedin: user.linkedin,
                    skills: user.skills,
                    experience: user.experience,
                    education: user.education,
                    resumeUrl: user.resumeUrl,
                    role: 'jobseeker'
                }
            });

        } else if (role === 'hr') {
            user = await HR.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update allowed fields for HR
            user.name = updates.name || user.name;
            user.email = updates.email || user.email;
            user.company = updates.company || user.company;
            user.phone = updates.phone || user.phone;
            user.updatedAt = Date.now();

            await user.save();

            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    company: user.company,
                    phone: user.phone,
                    status: user.status,
                    role: 'hr'
                }
            });
        } else {
            return res.status(400).json({ message: 'Invalid user role' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change Password
router.put('/change-password', authMiddleware, [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        let user;

        if (role === 'jobseeker') {
            user = await JobSeeker.findById(userId);
        } else if (role === 'hr') {
            user = await HR.findById(userId);
        } else {
            return res.status(400).json({ message: 'Invalid user role' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        user.updatedAt = Date.now();
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout (client-side should remove token)
router.post('/logout', authMiddleware, (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // Server just acknowledges the request
    res.json({ message: 'Logged out successfully' });
});

// Get user statistics (for dashboard)
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.id;

        let stats = {};

        if (role === 'admin') {
            const hrCount = await HR.countDocuments();
            const jobSeekerCount = await JobSeeker.countDocuments();
            // Add more stats as needed

            stats = {
                hrCount,
                jobSeekerCount,
                totalUsers: hrCount + jobSeekerCount
            };
        } else if (role === 'hr') {
            // Get HR's job statistics
            const JobOpening = require('../models/JobOpening');
            const JobApplication = require('../models/JobApplication');

            const activeJobs = await JobOpening.countDocuments({
                hrId: userId,
                status: 'Active'
            });

            const totalApplications = await JobApplication.countDocuments({
                jobId: { $in: await JobOpening.find({ hrId: userId }).select('_id') }
            });

            stats = {
                activeJobs,
                totalApplications
            };
        } else if (role === 'jobseeker') {
            // Get job seeker statistics
            const JobApplication = require('../models/JobApplication');

            const totalApplications = await JobApplication.countDocuments({
                jobSeekerId: userId
            });

            const pendingApplications = await JobApplication.countDocuments({
                jobSeekerId: userId,
                status: 'Pending'
            });

            const interviewApplications = await JobApplication.countDocuments({
                jobSeekerId: userId,
                status: 'Interview Scheduled'
            });

            stats = {
                totalApplications,
                pendingApplications,
                interviewApplications
            };
        }

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;