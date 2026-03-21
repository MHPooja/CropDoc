const pool = require('../config/db');

exports.getAlerts = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT * FROM alerts WHERE active=true ORDER BY created_at DESC'
    );
    const data = result.rows.map(a => ({
      id:       a.id,
      type:     a.type,
      message:  language === 'ta' ? a.message_ta : a.message,
      region:   a.region,
      severity: a.severity
    }));
    res.json({ success: true, count: data.length, alerts: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};