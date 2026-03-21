const pool = require('../config/db');

exports.requestReview = async (req, res) => {
  try {
    const { history_id } = req.body;
    if (!history_id) return res.status(400).json({ error: 'history_id required' });

    const exists = await pool.query(
      'SELECT id FROM expert_reviews WHERE history_id=$1', [history_id]
    );
    if (exists.rowCount > 0)
      return res.json({ success: true, message: 'Already in queue' });

    const result = await pool.query(
      `INSERT INTO expert_reviews (history_id,status)
       VALUES ($1,'pending') RETURNING *`,
      [history_id]
    );
    await pool.query(
      `UPDATE history SET expert_review=true, status='expert_pending' WHERE id=$1`,
      [history_id]
    );
    res.json({ success: true, message: 'Expert review requested', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT er.*, h.disease_name, h.crop_name, h.confidence
       FROM expert_reviews er
       JOIN history h ON er.history_id = h.id
       WHERE er.id=$1`,
      [req.params.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};