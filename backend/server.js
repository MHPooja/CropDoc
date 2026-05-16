const express  = require('express');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const diagnoseRoutes = require('./routes/diagnose');
const historyRoutes  = require('./routes/history');
const weatherRoutes  = require('./routes/weather');
const alertsRoutes   = require('./routes/alerts');
const expertRoutes   = require('./routes/expert');

app.use('/api', diagnoseRoutes);
app.use('/api', historyRoutes);
app.use('/api', weatherRoutes);
app.use('/api', alertsRoutes);
app.use('/api', expertRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CropDoc API running ✅' });
});

const PORT = process.env.PORT || 5000;
const pool = require('./config/db');

pool.connect()
  .then(() => {
    console.log('PostgreSQL connected');
    app.listen(PORT, () => {
      console.log(`Server on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });