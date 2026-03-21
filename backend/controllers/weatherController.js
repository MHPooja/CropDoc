const pool = require('../config/db');

const WEATHER_MAP = {
  Summer:  { temp:'32-40C', humidity:'Low',       risk:'Pest damage high' },
  Monsoon: { temp:'25-32C', humidity:'Very High',  risk:'Fungal diseases very high' },
  Winter:  { temp:'10-22C', humidity:'Medium',    risk:'Rust diseases high' },
};

exports.getWeatherDiseases = async (req, res) => {
  try {
    const { season, month, language = 'en' } = req.query;
    let query  = `SELECT d.*, c.name as crop_name
                  FROM diseases d JOIN crops c ON d.crop_id = c.id
                  WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (season) { query += ` AND d.season=$${idx++}`; params.push(season); }
    if (month)  { query += ` AND d.month=$${idx++}`;  params.push(month);  }

    const result  = await pool.query(query, params);
    const weather = WEATHER_MAP[season] || {};

    res.json({
      success:  true,
      weather,
      diseases: result.rows.map(r => ({
        name:      language === 'ta' ? r.name_tamil : r.name,
        crop:      r.crop_name,
        severity:  r.severity,
        organic:   r.organic_treat,
        chemical:  r.chemical_treat
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};