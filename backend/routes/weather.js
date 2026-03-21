const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/weatherController');

router.get('/weather-diseases', ctrl.getWeatherDiseases);

module.exports = router;