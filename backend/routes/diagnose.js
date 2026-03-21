const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const ctrl    = require('../controllers/diagnoseController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/jpg','image/webp'];
    ok.includes(file.mimetype) ? cb(null, true) : cb(new Error('Images only'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/upload-image', upload.single('image'), ctrl.uploadImage);
router.post('/diagnose',     upload.single('image'), ctrl.diagnose);

module.exports = router;