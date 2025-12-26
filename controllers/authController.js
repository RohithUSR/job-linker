const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HR = require('../models/HR');
const JobSeeker = require('../models/JobSeeker');
const JobOpening = require('../models/JobOpening');
const JobApplication = require('../models/JobApplication');
const { validationResult } = require('express-validator');

// Helper function to generate JWT token
const generateToken = (user) => {
    const payload = {
        user: {
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name || user.fullName
        }
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new job seeker
// @route   POST /api/auth/jobseeker/register
// @access  Public
exports.registerJobSeeker = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullName, email, password, phone, location, skills } = req.body;

        // Check if job seeker already exists
        let jobSeeker = await JobSeeker.findOne({ email });
        if (jobSeeker) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists with this email' 
            });
        }

        // Create new job seeker
        jobSeeker = new JobSeeker({
            fullName,
            email: email.toLowerCase(),
            password,
            phone,
            location,
            skills: skills || [],
            status: 'Active'
        });

        // Save job seeker
        await jobSeeker.save();

        // Generate JWT token
        const token = generateToken({
            id: jobSeeker._id,
            role: 'jobseeker',
            email: jobSeeker.email,
            name: jobSeeker.fullName
        });

        // Set token in cookie (optional)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: jobSeeker._id,
                fullName: jobSeeker.fullName,
                email: jobSeeker.email,
                phone: jobSeeker.phone,
                location: jobSeeker.location,
                role: 'jobseeker',
                skills: jobSeeker.skills
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Login job seeker
// @route   POST /api/auth/jobseeker/login
// @access  Public
exports.loginJobSeeker = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find job seeker by email
        const jobSeeker = await JobSeeker.findOne({ email: email.toLowerCase() });
        if (!jobSeeker) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check account status
        if (jobSeeker.status === 'Suspended') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended. Please contact support.'
            });
        }

        if (jobSeeker.status === 'On Hold') {
            return res.status(403).json({
                success: false,
                message: 'Account is on hold. Please contact support.'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, jobSeeker.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        jobSeeker.lastLogin = Date.now();
        await jobSeeker.save();

        // Generate JWT token
        const token = generateToken({
            id: jobSeeker._id,
            role: 'jobseeker',
            email: jobSeeker.email,
            name: jobSeeker.fullName
        });

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
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
                resumeUrl: jobSeeker.resumeUrl,
                status: jobSeeker.status
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// @desc    Login HR
// @route   POST /api/auth/hr/login
// @access  Public
exports.loginHR = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find HR by email
        const hr = await HR.findOne({ email: email.toLowerCase() });
        if (!hr) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check account status
        if (hr.status === 'Suspended') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended. Please contact administrator.'
            });
        }

        if (hr.status === 'Pending') {
            return res.status(403).json({
                success: false,
                message: 'Account is pending approval. Please contact administrator.'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, hr.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        hr.lastLogin = Date.now();
        await hr.save();

        // Generate JWT token
        const token = generateToken({
            id: hr._id,
            role: 'hr',
            email: hr.email,
            name: hr.name,
            company: hr.company
        });

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: hr._id,
                name: hr.name,
                email: hr.email,
                company: hr.company,
                phone: hr.phone,
                role: 'hr',
                status: hr.status
            }
        });
    } catch (error) {
        console.error('HR login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// @desc    Login Admin
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Admin credentials (in production, store in database)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@recruitflow.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (email !== adminEmail || password !== adminPassword) {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: 'admin-id',
            role: 'admin',
            email: adminEmail,
            name: 'Admin User'
        });

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
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
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let user;

        switch (role) {
            case 'jobseeker':
                user = await JobSeeker.findById(userId).select('-password');
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'Job seeker not found'
                    });
                }
                break;

            case 'hr':
                user = await HR.findById(userId).select('-password');
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'HR not found'
                    });
                }
                break;

            case 'admin':
                user = {
                    id: 'admin-id',
                    role: 'admin',
                    email: req.user.email,
                    name: 'Admin User'
                };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }

        res.json({
            success: true,
            user: {
                ...user._doc ? user._doc : user,
                role
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const updates = req.body;

        let user;
        let updatedUser;

        switch (role) {
            case 'jobseeker':
                user = await JobSeeker.findById(userId);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }

                // Update allowed fields
                const jobSeekerUpdates = {};
                if (updates.fullName) jobSeekerUpdates.fullName = updates.fullName;
                if (updates.email) jobSeekerUpdates.email = updates.email.toLowerCase();
                if (updates.phone) jobSeekerUpdates.phone = updates.phone;
                if (updates.location) jobSeekerUpdates.location = updates.location;
                if (updates.linkedin) jobSeekerUpdates.linkedin = updates.linkedin;
                if (updates.skills) jobSeekerUpdates.skills = updates.skills;
                if (updates.experience) jobSeekerUpdates.experience = updates.experience;
                if (updates.education) jobSeekerUpdates.education = updates.education;
                if (updates.resumeUrl) jobSeekerUpdates.resumeUrl = updates.resumeUrl;

                updatedUser = await JobSeeker.findByIdAndUpdate(
                    userId,
                    { $set: jobSeekerUpdates },
                    { new: true, runValidators: true }
                ).select('-password');

                break;

            case 'hr':
                user = await HR.findById(userId);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }

                // Update allowed fields for HR
                const hrUpdates = {};
                if (updates.name) hrUpdates.name = updates.name;
                if (updates.email) hrUpdates.email = updates.email.toLowerCase();
                if (updates.company) hrUpdates.company = updates.company;
                if (updates.phone) hrUpdates.phone = updates.phone;

                updatedUser = await HR.findByIdAndUpdate(
                    userId,
                    { $set: hrUpdates },
                    { new: true, runValidators: true }
                ).select('-password');

                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                ...updatedUser._doc,
                role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        let user;

        switch (role) {
            case 'jobseeker':
                user = await JobSeeker.findById(userId);
                break;
            case 'hr':
                user = await HR.findById(userId);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error changing password'
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    // Clear token cookie
    res.clearCookie('token');
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// @desc    Get user statistics
// @route   GET /api/auth/stats
// @access  Private
exports.getUserStats = async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.id;

        let stats = {};

        switch (role) {
            case 'admin':
                const hrCount = await HR.countDocuments();
                const jobSeekerCount = await JobSeeker.countDocuments();
                
                const activeJobs = await JobOpening.countDocuments({ status: 'Active' });
                const totalApplications = await JobApplication.countDocuments();

                stats = {
                    hrCount,
                    jobSeekerCount,
                    totalUsers: hrCount + jobSeekerCount,
                    activeJobs,
                    totalApplications,
                    pendingApplications: await JobApplication.countDocuments({ status: 'Pending' })
                };
                break;

            case 'hr':
                const activeJobsHR = await JobOpening.countDocuments({
                    hrId: userId,
                    status: 'Active'
                });

                const totalJobsHR = await JobOpening.countDocuments({ hrId: userId });
                
                // Get job IDs for this HR
                const hrJobIds = await JobOpening.find({ hrId: userId }).select('_id');
                const jobIds = hrJobIds.map(job => job._id);

                const totalApplicationsHR = await JobApplication.countDocuments({
                    jobId: { $in: jobIds }
                });

                const recentApplicationsHR = await JobApplication.countDocuments({
                    jobId: { $in: jobIds },
                    appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                });

                stats = {
                    activeJobs: activeJobsHR,
                    totalJobs: totalJobsHR,
                    totalApplications: totalApplicationsHR,
                    recentApplications: recentApplicationsHR,
                    pendingReview: await JobApplication.countDocuments({
                        jobId: { $in: jobIds },
                        status: 'Pending'
                    }),
                    interviewScheduled: await JobApplication.countDocuments({
                        jobId: { $in: jobIds },
                        status: 'Interview Scheduled'
                    })
                };
                break;

            case 'jobseeker':
                const totalApplicationsJS = await JobApplication.countDocuments({
                    jobSeekerId: userId
                });

                const recentApplicationsJS = await JobApplication.countDocuments({
                    jobSeekerId: userId,
                    appliedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                });

                stats = {
                    totalApplications: totalApplicationsJS,
                    recentApplications: recentApplicationsJS,
                    pendingApplications: await JobApplication.countDocuments({
                        jobSeekerId: userId,
                        status: 'Pending'
                    }),
                    interviewScheduled: await JobApplication.countDocuments({
                        jobSeekerId: userId,
                        status: 'Interview Scheduled'
                    }),
                    acceptedApplications: await JobApplication.countDocuments({
                        jobSeekerId: userId,
                        status: 'Accepted'
                    })
                };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting statistics'
        });
    }
};

// @desc    Reset password request
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email, role } = req.body;

        let user;
        if (role === 'jobseeker') {
            user = await JobSeeker.findOne({ email: email.toLowerCase() });
        } else if (role === 'hr') {
            user = await HR.findOne({ email: email.toLowerCase() });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = jwt.sign(
            { 
                id: user._id, 
                role: role,
                type: 'password_reset' 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // In production, send email with reset link
        // For now, we'll just return the token (in production, don't do this)
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // TODO: Send email with resetUrl
        console.log('Password reset URL:', resetUrl);

        res.json({
            success: true,
            message: 'Password reset instructions sent to your email',
            // In production, remove this token from response
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing request'
        });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is required'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check if token is for password reset
        if (decoded.type !== 'password_reset') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        let user;
        if (decoded.role === 'jobseeker') {
            user = await JobSeeker.findById(decoded.id);
        } else if (decoded.role === 'hr') {
            user = await HR.findById(decoded.id);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid user role'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error resetting password'
        });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Check if token is for email verification
        if (decoded.type !== 'email_verification') {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        let user;
        if (decoded.role === 'jobseeker') {
            user = await JobSeeker.findById(decoded.id);
        } else if (decoded.role === 'hr') {
            user = await HR.findById(decoded.id);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid user role'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update user status to verified
        user.status = 'Verified';
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error verifying email'
        });
    }
};