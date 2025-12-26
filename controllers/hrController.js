const HR = require('../models/HR');
const JobOpening = require('../models/JobOpening');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new HR
exports.registerHR = async (req, res) => {
    try {
        const { name, email, company, phone, password, status } = req.body;

        // Check if HR exists
        let hr = await HR.findOne({ email });
        if (hr) {
            return res.status(400).json({ message: 'HR already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create HR
        hr = new HR({
            name,
            email,
            company,
            phone,
            password: hashedPassword,
            status: status || 'Active'
        });

        await hr.save();

        // Create JWT token
        const payload = {
            user: {
                id: hr._id,
                role: 'hr',
                email: hr.email,
                company: hr.company
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'HR registered successfully',
            token,
            hr: {
                id: hr._id,
                name: hr.name,
                email: hr.email,
                company: hr.company,
                phone: hr.phone,
                status: hr.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all HRs (Admin only)
exports.getAllHRs = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status && status !== 'All Statuses') {
            query.status = status;
        }

        const hrs = await HR.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(hrs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get HR by ID
exports.getHRById = async (req, res) => {
    try {
        const hr = await HR.findById(req.params.id).select('-password');
        if (!hr) {
            return res.status(404).json({ message: 'HR not found' });
        }
        res.json(hr);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update HR
exports.updateHR = async (req, res) => {
    try {
        const { name, email, company, phone, status } = req.body;
        
        const hr = await HR.findById(req.params.id);
        if (!hr) {
            return res.status(404).json({ message: 'HR not found' });
        }

        hr.name = name || hr.name;
        hr.email = email || hr.email;
        hr.company = company || hr.company;
        hr.phone = phone || hr.phone;
        hr.status = status || hr.status;
        hr.updatedAt = Date.now();

        await hr.save();

        res.json({
            message: 'HR updated successfully',
            hr: {
                id: hr._id,
                name: hr.name,
                email: hr.email,
                company: hr.company,
                phone: hr.phone,
                status: hr.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete HR
exports.deleteHR = async (req, res) => {
    try {
        const hr = await HR.findById(req.params.id);
        if (!hr) {
            return res.status(404).json({ message: 'HR not found' });
        }

        // Delete all job openings by this HR
        await JobOpening.deleteMany({ hrId: hr._id });

        await hr.deleteOne();

        res.json({ message: 'HR deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// HR Login
exports.loginHR = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if HR exists
        const hr = await HR.findOne({ email });
        if (!hr) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, hr.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const payload = {
            user: {
                id: hr._id,
                role: 'hr',
                email: hr.email,
                company: hr.company
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            hr: {
                id: hr._id,
                name: hr.name,
                email: hr.email,
                company: hr.company,
                phone: hr.phone,
                status: hr.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};