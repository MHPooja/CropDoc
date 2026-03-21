const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/alertsController');

router.get('/alerts', ctrl.getAlerts);

module.exports = router;