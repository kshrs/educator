const llm = require('../services/llm.service.js');
const curriculum = require('../services/curriculum.service.js');
const learningCurriculum = require('../services/learningCurriculum.service.js');

const withRetry = async (fn, retries = 3, delayMs = 5000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (e) {
            const isQuotaError = e.status === 429 || e.message?.includes('429') || e.message?.includes('quota');
            if (isQuotaError && attempt < retries) {
                console.warn(`[learning] quota hit, retrying in ${delayMs}ms (attempt ${attempt}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // exponential backoff
            } else {
                throw e; // non-quota error or out of retries — bubble up
            }
        }
    }
};

const createLearningCurriculum = async (req, res) => {
    try {
        const fullCurriculum = await curriculum.getCurriculumById(req.params.curriculumId);
        const finalizedCurriculum = fullCurriculum.finalizedCurriculum;
        if (!finalizedCurriculum) {
            res.status(400).json({
                message: `Curriculum not FINALIZED yet`
            });
            return;
        }
        const doc = await learningCurriculum.createLearningCurriculum(req.params.curriculumId, finalizedCurriculum.meta.title, finalizedCurriculum.meta.overview, finalizedCurriculum.modules);

        res.status(200).json({
            learningCurriculumId: doc._id,
        });
    } catch (e) {
        res.status(500).json({
            message: e.message
        });
    }
};

const generateLearningContentForTopic = async (req, res) => {
    try {
        const { moduleIndex, topicIndex } = req.body;
        const learningCurriculumId = req.params.id; // move to params
        
        const learningDoc = await learningCurriculum.getById(learningCurriculumId);
        const fullCurriculum = await curriculum.getCurriculumById(learningDoc.curriculumId);

        const { meta, modules } = fullCurriculum.finalizedCurriculum;

        const topic = modules[moduleIndex].topics[topicIndex];

        const [topicMaterial, assignmentAndResearchMaterial, resourceMaterial] = await withRetry(() => 
            Promise.all([
                llm.generateTopicMaterial(topic.title, meta.title, meta.learningObjectives, 'intermediate'),
                llm.generateTopicAssignmentAndResearch(topic.title, meta.title, meta.learningObjectives, 'intermediate'),
                llm.generateTopicResources(topic.title, meta.title, 'intermediate'),
            ])
        );

        const material = JSON.parse(topicMaterial);
        const assignment = JSON.parse(assignmentAndResearchMaterial);
        const resources = JSON.parse(resourceMaterial);

        await learningCurriculum.saveTopicMaterial(learningCurriculumId, moduleIndex, topicIndex, {
            learningMaterial: material.learningMaterial,
            resources: resources.resources,
            assignment: assignment.assignment,
            research: assignment.research
        });

        res.status(200).json({
            message: `Generation of topic content is successful`
        });
    } catch (e) {
        res.status(500).json({
            message: e.message
        });
    }
};

const listLearningCurricula = async (req, res) => {
    try {
        const curricula = await learningCurriculum.getAllByUserId();
        if(curricula.length === 0) {
            res.status(200).json({
                message: `No Curriculum Found`
            });
            return;
        }
        res.status(200).json({
            curricula: curricula
        });
    } catch (e) {
        res.status(500).json({
            message: e.message
        });
    }
};

const getLearningCurriculumById = async (req, res) => {
    try {
        if(!req.params.id) {
            res.status(400).json({
                message: `Curriculum ID not passed as a parameter`
            });
            return;
        }
        const curriculum = await learningCurriculum.getById(req.params.id);
        if(!curriculum) {
            res.status(400).json({
                message: `No Curriculum Found`
            });
            return;
        }
        res.status(200).json({
            curriculum: curriculum
        });

    } catch (e) {
        res.status(500).json({
            message: e.message
        });
    }
};

const updateTopicContent = async (req, res) => {
    try {
        if(!req.params.id) {
            res.status(400).json({
                message: `Curriculum ID not passed as a parameter`
            });
            return;
        }

        const { moduleIndex, topicIndex, field, value } = req.body;

        const doc = await learningCurriculum.getById(req.params.id);
        const topic = doc.modules[moduleIndex].topics[topicIndex];

        // field can be of enum ['assignment', 'research'] used for submission
        if (field === 'assignment') {
            await learningCurriculum.saveAssignmentSubmission(req.params.id, moduleIndex, topicIndex, {
                submission: value
            });
            const evaluationResult = await llm.evaluateSubmission(
                topic.title,
                doc.title,
                topic.assignment.description,
                value
            );
            const evaluation = JSON.parse(evaluationResult);
            await learningCurriculum.saveAssignmentReview(doc._id, moduleIndex, topicIndex, {
                review: evaluation.review,
                status: evaluation.status
            });
        } else {
            await learningCurriculum.saveResearchSubmission(req.params.id, moduleIndex, topicIndex, {
                submission: value
            });
            const evaluationResult = await llm.evaluateSubmission(
                topic.title,
                doc.title,
                topic.research.description,
                value
            );
            const evaluation = JSON.parse(evaluationResult);
            await learningCurriculum.saveResearchReview(doc._id, moduleIndex, topicIndex, {
                review: evaluation.review,
                status: evaluation.status
            });
        }

        res.status(200).json({
            message: "Submission successful",
            moduleIndex: moduleIndex,
            topicIndex: topicIndex,
            field: field,
        });

    } catch (e) {
        res.status(500).json({
            message: e.message
        });
    }
};

const deleteLearningCurriculum = async (req, res) => {
    try {
        await learningCurriculum.deleteLearningCurriculum(req.params.id)
        res.status(200).json({
            message: `deletion of Curriculum with id: ${req.params.id} sucessful`
        });

    } catch (e) {
        res.status(500).json({
            message: e.message
        });
    }
}

module.exports = {
    createLearningCurriculum,
    generateLearningContentForTopic,
    listLearningCurricula,
    getLearningCurriculumById,
    updateTopicContent,
    deleteLearningCurriculum
};

