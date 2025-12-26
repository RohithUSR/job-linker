const mongoose = require('mongoose');

const JobOpeningSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    experienceLevel: {
        type: String,
        enum: ['Entry Level', 'Mid Level', 'Senior Level'],
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    skills: [{
        type: String
    }],
    location: {
        type: String,
        required: true
    },
    department: {
        type: String
    },
    hrId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HR',
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Closed', 'Draft'],
        default: 'Active'
    },
    deadline: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('JobOpening', JobOpeningSchema);