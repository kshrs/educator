const express = require('express');
const router = express.Router();

// --- Health / Config Routes ---
const healthController = require('../controllers/health.controller.js');

router.get('/health/config', healthController.getConfig);
router.post('/health/config', healthController.saveConfig);
router.get('/health/status', healthController.checkApiStatus);

// --- Curriculum Functionalities ---
const curriculumController = require('../controllers/curriculum.controller.js');

router.post('/curriculum/start', curriculumController.startCurriculum);
router.post('/curriculum/iterate', curriculumController.iterateCurriculum);
router.get('/curriculum/iterate/:ticketID', curriculumController.streamCurriculumIteration);
router.put('/curriculum/select', curriculumController.selectIteration);
router.post('/curriculum/finalize', curriculumController.finalizeCurriculum);
router.get('/curriculum/list', curriculumController.listCurricula);
router.get('/curriculum/:curriculumId', curriculumController.getCurriculum);
router.delete('/curriculum/:curriculumId', curriculumController.deleteCurriculum);

// --- Learning Functionalities ---
const learningController = require('../controllers/learning.controller.js');
router.post('/learning/create/:curriculumId', learningController.createLearningCurriculum);
router.get('/learning/list', learningController.listLearningCurricula);
router.get('/learning/:id', learningController.getLearningCurriculumById);
router.delete('/learning/:id', learningController.deleteLearningCurriculum)
router.patch('/learning/:id/topic', learningController.updateTopicContent);
// /learning/:id/topic 
// body = {
//  moduleIndex,
//  topicIndex,
//  field => 'assignment' | 'research',
//  value => submission content
// }
router.post('/learning/:id/topic/generate', learningController.generateLearningContentForTopic);

module.exports = { router };
