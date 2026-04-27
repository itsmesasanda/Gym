const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');

// Goal Routes
router.get('/goals', progressController.getGoals);
router.post('/goals', progressController.createGoal);
router.put('/goals/:id', progressController.updateGoal);
router.delete('/goals/:id', progressController.deleteGoal);

// Measurement Routes
router.get('/measurements', progressController.getMeasurements);
router.post('/measurements', progressController.createMeasurement);
router.put('/measurements/:id', progressController.updateMeasurement);
router.delete('/measurements/:id', progressController.deleteMeasurement);

module.exports = router;
