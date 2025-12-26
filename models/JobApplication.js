const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobOpening',
        required: true
    },
    jobSeekerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobSeeker',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    coverLetter: {
        type: String,
        required: true
    },
    resumeUrl: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Interview Scheduled', 'Accepted', 'Rejected'],
        default: 'Pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    hrEmail: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);