const express = require('express');
const authMiddleware = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

const router = express.Router();

router.post('/register', doctorController.registerDoctor);
router.post('/login', doctorController.loginDoctor);
router.get('/', doctorController.getAllDoctors);
router.get('/profile', authMiddleware, doctorController.getDoctorProfile);
router.put('/profile', authMiddleware, doctorController.updateDoctorProfile);

module.exports = router;