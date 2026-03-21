const pool = require('../config/db');

const DISEASE_MAP = {
  tomato: ['Early Blight','Late Blight','Leaf Curl','Healthy'],
  rice:   ['Rice Blast','Brown Spot','Bacterial Blight','Healthy'],
  wheat:  ['Yellow Rust','Brown Rust','Loose Smut','Healthy'],
  maize:  ['Northern Leaf Blight','Gray Leaf Spot','Healthy'],
};

const SEVERITY_MAP = {
  'Early Blight':'moderate', 'Late Blight':'severe',
  'Leaf Curl':'mild',        'Rice Blast':'severe',
  'Brown Spot':'moderate',   'Yellow Rust':'severe',
  'Healthy':'none',
};

const TREATMENT_MAP = {
  'Early Blight': {
    organic:    'Spray neem oil 5ml/litre every 7 days',
    chemical:   'Spray Mancozeb 2g/litre every 7 days',
    time_limit: '48 hours', treatable: true
  },
  'Late Blight': {
    organic:    'Remove infected leaves, apply copper fungicide',
    chemical:   'Spray Metalaxyl 2g/litre immediately',
    time_limit: '24 hours', treatable: true
  },
  'Rice Blast': {
    organic:    'Use resistant varieties, drain fields',
    chemical:   'Spray Tricyclazole 0.6g/litre',
    time_limit: '48 hours', treatable: true
  },
  'Healthy': {
    organic:'No treatment needed', chemical:'No treatment needed',
    time_limit: null, treatable: true
  }
};

function mockAI(cropName) {
  const diseases = DISEASE_MAP[cropName.toLowerCase()] || ['Unknown'];
  const disease  = diseases[Math.floor(Math.random() * diseases.length)];
  const confidence = Math.floor(Math.random() * 47) + 50;
  return { disease, confidence };
}

exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image' });
  res.json({ success: true, image_path: req.file.path });
};

exports.diagnose = async (req, res) => {
  try {
    const { crop, season, language = 'en' } = req.body;
    const image_path = req.file ? req.file.path : null;
    if (!crop) return res.status(400).json({ error: 'Crop required' });

    const { disease, confidence } = mockAI(crop);
    const severity    = SEVERITY_MAP[disease] || 'unknown';
    const treatment   = TREATMENT_MAP[disease] || {};
    const expert_flag = confidence < 60;

    const result = await pool.query(
      `INSERT INTO history
       (image_path,crop_name,disease_name,confidence,
        severity,treatable,language,expert_review,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [image_path, crop, disease, confidence,
       severity, treatment.treatable ?? true,
       language, expert_flag, 'diagnosed']
    );

    if (expert_flag) {
      await pool.query(
        'INSERT INTO expert_reviews (history_id) VALUES ($1)',
        [result.rows[0].id]
      );
    }

    res.json({
      success:       true,
      history_id:    result.rows[0].id,
      disease,
      confidence,
      severity,
      treatable:     treatment.treatable ?? true,
      time_limit:    treatment.time_limit || null,
      organic:       treatment.organic || null,
      chemical:      treatment.chemical || null,
      expert_review: expert_flag,
      language
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};