const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/historyController');

router.get('/history',  ctrl.getHistory);
router.post('/history', ctrl.addHistory);

module.exports = router;