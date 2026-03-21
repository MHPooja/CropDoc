const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/audioController');

router.post('/audio', ctrl.generateAudio);

module.exports = router;