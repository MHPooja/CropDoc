const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/audio',   express.static('audio'));

app.use('/api', require('./routes/diagnose'));
app.use('/api', require('./routes/history'));
app.use('/api', require('./routes/weather'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/audio'));
app.use('/api', require('./routes/expert'));

app.get('/', (req, res) => {
  res.json({ status: 'CropDoc running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
});