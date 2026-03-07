const mongoose = require('mongoose');

const resources = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
});

const learningTopicSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    learningMaterial: {
        type: String,
        default: ''
    },
    learningResources: [resources],
    assignment: {
        description: {
            type: String,
            default: ''
        },
        submission: {
            type: String,
            default: 'Not Yet Submitted'
        },
        review: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'done'],
            default: 'pending'
        }
    },
    research: {
        description: {
            type: String,
            default: ''
        },
        submission: {
            type: String,
            default: 'Not Yet Submitted'
        },
        review: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'done'],
            default: 'pending'
        }
    },
});

const learningModuleSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    overview: {
        type: String,
        default: '',
    },
    topics: [learningTopicSchema]
});


const learningCurriculumSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    curriculumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curriculum',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    overview: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['generating', 'done'],
        required: true
    },
    modules: [learningModuleSchema]
}, { timestamps: true });

const LearningCurriculum = mongoose.model('LearningCurriculum', learningCurriculumSchema);

module.exports = { LearningCurriculum };
