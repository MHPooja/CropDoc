const pool = require('../config/db');

exports.getHistory = async (req, res) => {
  try {
    const { language } = req.query;
    let query  = 'SELECT * FROM history ORDER BY created_at DESC';
    let params = [];
    if (language) {
      query  = 'SELECT * FROM history WHERE language=$1 ORDER BY created_at DESC';
      params = [language];
    }
    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addHistory = async (req, res) => {
  try {
    const { crop_name, disease_name, confidence,
            severity, language = 'en' } = req.body;
    const result = await pool.query(
      `INSERT INTO history
       (crop_name,disease_name,confidence,severity,language)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [crop_name, disease_name, confidence, severity, language]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};