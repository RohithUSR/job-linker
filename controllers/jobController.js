const JobOpening = require('../models/JobOpening');
const HR = require('../models/HR');

// Create new job opening
exports.createJobOpening = async (req, res) => {
    try {
        const {
            title,
            experienceLevel,
            salary,
            description,
            skills,
            location,
            department,
            companyName,
            deadline
        } = req.body;

        // Get HR info from token
        const hrId = req.user.id;

        const jobOpening = new JobOpening({
            title,
            experienceLevel,
            salary,
            description,
            skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
            location,
            department,
            hrId,
            companyName,
            deadline,
            status: 'Active'
        });

        await jobOpening.save();

        res.status(201).json({
            message: 'Job opening created successfully',
            jobOpening
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all job openings (for job listings page)
exports.getAllJobOpenings = async (req, res) => {
    try {
        const { 
            search, 
            location, 
            skills, 
            experienceLevel,
            company 
        } = req.query;

        let query = { status: 'Active' };

        // Search by title or company
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by location
        if (location && location !== 'Location') {
            query.location = { $regex: location, $options: 'i' };
        }

        // Filter by skills
        if (skills && skills !== 'Skills') {
            query.skills = { $in: [new RegExp(skills, 'i')] };
        }

        // Filter by experience level
        if (experienceLevel && experienceLevel !== 'Experience Level') {
            query.experienceLevel = experienceLevel;
        }

        // Filter by company
        if (company) {
            query.companyName = { $regex: company, $options: 'i' };
        }

        const jobOpenings = await JobOpening.find(query)
            .populate('hrId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json(jobOpenings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get job openings by HR
exports.getJobOpeningsByHR = async (req, res) => {
    try {
        const hrId = req.user.id;
        
        const jobOpenings = await JobOpening.find({ hrId })
            .sort({ createdAt: -1 });

        res.json(jobOpenings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get job opening by ID
exports.getJobOpeningById = async (req, res) => {
    try {
        const jobOpening = await JobOpening.findById(req.params.id)
            .populate('hrId', 'name email phone company');

        if (!jobOpening) {
            return res.status(404).json({ message: 'Job opening not found' });
        }

        res.json(jobOpening);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update job opening
exports.updateJobOpening = async (req, res) => {
    try {
        const {
            title,
            experienceLevel,
            salary,
            description,
            skills,
            location,
            department,
            status,
            deadline
        } = req.body;

        let jobOpening = await JobOpening.findById(req.params.id);
        
        if (!jobOpening) {
            return res.status(404).json({ message: 'Job opening not found' });
        }

        // Check if HR owns this job opening
        if (jobOpening.hrId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        jobOpening.title = title || jobOpening.title;
        jobOpening.experienceLevel = experienceLevel || jobOpening.experienceLevel;
        jobOpening.salary = salary || jobOpening.salary;
        jobOpening.description = description || jobOpening.description;
        jobOpening.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        jobOpening.location = location || jobOpening.location;
        jobOpening.department = department || jobOpening.department;
        jobOpening.status = status || jobOpening.status;
        jobOpening.deadline = deadline || jobOpening.deadline;
        jobOpening.updatedAt = Date.now();

        await jobOpening.save();

        res.json({
            message: 'Job opening updated successfully',
            jobOpening
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete job opening
exports.deleteJobOpening = async (req, res) => {
    try {
        const jobOpening = await JobOpening.findById(req.params.id);
        
        if (!jobOpening) {
            return res.status(404).json({ message: 'Job opening not found' });
        }

        // Check if HR owns this job opening
        if (jobOpening.hrId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await jobOpening.deleteOne();

        res.json({ message: 'Job opening deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};