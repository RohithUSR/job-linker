const mongoose = require('mongoose');

const JobSeekerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String
    },
    location: {
        type: String
    },
    linkedin: {
        type: String
    },
    skills: [{
        type: String
    }],
    experience: [{
        title: String,
        company: String,
        location: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: [String]
    }],
    education: [{
        degree: String,
        school: String,
        field: String,
        startDate: Date,
        endDate: Date
    }],
    resumeUrl: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Verified', 'On Hold'],
        default: 'Active'
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

module.exports = mongoose.model('JobSeeker', JobSeekerSchema);