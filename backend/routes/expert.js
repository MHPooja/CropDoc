const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/expertController');

router.post('/expert-review',    ctrl.requestReview);
router.get('/expert-review/:id', ctrl.getStatus);

module.exports = router;