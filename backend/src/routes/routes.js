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

module.exports = { router };
