const { LearningCurriculum } = require('../models/learningCurriculum.model.js');
const { User } = require('../models/user.model.js');

const DEV_USER = "kshrs";

const getDevUserId = async () => {
    let user = await User.findOne({ username: DEV_USER });
    if (!user) {
        user = await User.create({ username: DEV_USER, chatHistory: [] });
    }
    return user._id;
};

const createLearningCurriculum = async (curriculumId, title, overview, modules) => {
    const userId = await getDevUserId();
    const learningCurriculum = await LearningCurriculum.create({
        userId,
        curriculumId,
        title,
        overview,
        modules,
        status: 'generating'
    });
    return learningCurriculum;
};

const getById = async (id) => {
    const learningCurriculum = await LearningCurriculum.findById(id);
    if (!learningCurriculum) throw new Error(`Learning Curriculum not found: ${id}`);
    return learningCurriculum;
};

const getAllByUserId = async () => {
    const userId = await getDevUserId();
    return LearningCurriculum.find({userId})
    .select('title overview status curriculumId createdAt')
    .sort( { createdAt: -1 });
};

const saveTopicMaterial = async (learningCurriculumId, moduleIndex, topicIndex, { learningMaterial, resources, assignment, research }) => {
    const update = {};
    update[`modules.${moduleIndex}.topics.${topicIndex}.learningMaterial`] = learningMaterial;
    update[`modules.${moduleIndex}.topics.${topicIndex}.learningResources`] = resources;
    update[`modules.${moduleIndex}.topics.${topicIndex}.assignment.description`] = assignment;
    update[`modules.${moduleIndex}.topics.${topicIndex}.research.description`] = research;

    const result = await LearningCurriculum.findByIdAndUpdate(
        learningCurriculumId,
        { $set: update },
        { returnDocument: 'after' } // returns the updated document not the old one
    );
    if (!result) throw new Error(`Learning Curriculum ID not found: ${learningCurriculumId}`);
    return result;
};

const updateTopicStatus = async (learningCurriculumId, moduleIndex, topicIndex, { assignmentStatus, researchStatus }) => {
    const update = {}
    update[`modules.${moduleIndex}.topics.${topicIndex}.assignment.status`] = assignmentStatus;
    update[`modules.${moduleIndex}.topics.${topicIndex}.research.status`] = researchStatus;
    const result = await LearningCurriculum.findByIdAndUpdate(
        learningCurriculumId,
        { $set: update },
        { returnDocument: 'after' } // returns the updated document not the old one
    );
    if (!result) throw new Error(`Learning Curriculum ID not found: ${learningCurriculumId}`);
    return result;
};

const saveAssignmentSubmission = async (learningCurriculumId, moduleIndex, topicIndex, { submission }) => {
    const update = {}
    update[`modules.${moduleIndex}.topics.${topicIndex}.assignment.submission`] = submission;
    const result = await LearningCurriculum.findByIdAndUpdate(
        learningCurriculumId,
        { $set: update },
        { returnDocument: 'after' } // returns the updated document not the old one
    );
    if (!result) throw new Error(`Learning Curriculum ID not found: ${learningCurriculumId}`);
    return result;
}

const saveResearchSubmission = async (learningCurriculumId, moduleIndex, topicIndex, { submission }) => {
    const update = {}
    update[`modules.${moduleIndex}.topics.${topicIndex}.research.submission`] = submission;
    const result = await LearningCurriculum.findByIdAndUpdate(
        learningCurriculumId,
        { $set: update },
        { returnDocument: 'after' } // returns the updated document not the old one
    );
    if (!result) throw new Error(`Learning Curriculum ID not found: ${learningCurriculumId}`);
    return result;
}

const saveAssignmentReview = async (learningCurriculumId, moduleIndex, topicIndex, { review, status }) => {
    const update = {}
    update[`modules.${moduleIndex}.topics.${topicIndex}.assignment.review`] = review;
    update[`modules.${moduleIndex}.topics.${topicIndex}.assignment.status`] = status;
    const result = await LearningCurriculum.findByIdAndUpdate(
        learningCurriculumId,
        { $set: update },
        { returnDocument: 'after' } // returns the updated document not the old one
    );
    if (!result) throw new Error(`Learning Curriculum ID not found: ${learningCurriculumId}`);
    return result;
};
const saveResearchReview = async (learningCurriculumId, moduleIndex, topicIndex, { review, status }) => {
    const update = {}
    update[`modules.${moduleIndex}.topics.${topicIndex}.research.review`] = review;
    update[`modules.${moduleIndex}.topics.${topicIndex}.research.status`] = status;
    const result = await LearningCurriculum.findByIdAndUpdate(
        learningCurriculumId,
        { $set: update },
        { returnDocument: 'after' } // returns the updated document not the old one
    );
    if (!result) throw new Error(`Learning Curriculum ID not found: ${learningCurriculumId}`);
    return result;
};

const deleteLearningCurriculum = async (learningCurriculumId) => {
    await LearningCurriculum.deleteOne({ _id: learningCurriculumId});
};

// const markAsReady = async (learningCurriculumId) => {
//     const result = await LearningCurriculum.findByIdAndUpdate(
//         learningCurriculumId,
//         { $set: { status: 'done'} },
//         { returnDocument: 'after' } // returns the updated document not the old one
//     );
//     if (!result) throw new Error(`Learning Curriculum ID not found: ${learningCurriculumId}`);
//     return result;
// }

module.exports = {
    createLearningCurriculum,
    getById,
    getAllByUserId,
    saveTopicMaterial,
    updateTopicStatus,
    saveAssignmentSubmission,
    saveResearchSubmission,
    saveAssignmentReview,
    saveResearchReview,
    // markAsReady,
    deleteLearningCurriculum
};
