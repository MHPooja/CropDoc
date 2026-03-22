const pool = require('../config/db');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ── Treatment database ─────────────────────────────────
const TREATMENT_DB = {
  'Early Blight': {
    organic:    'Spray neem oil 5ml/litre every 7 days',
    chemical:   'Spray Mancozeb 2g/litre every 7 days',
    time_limit: '48 hours', severity: 'moderate', treatable: true
  },
  'Late Blight': {
    organic:    'Remove infected leaves, apply copper fungicide',
    chemical:   'Spray Metalaxyl 2g/litre immediately',
    time_limit: '24 hours', severity: 'severe', treatable: true
  },
  'Leaf Blight': {
    organic:    'Spray neem oil 5ml/litre every 3 days',
    chemical:   'Apply Propiconazole 1ml/litre every 10 days',
    time_limit: '48 hours', severity: 'moderate', treatable: true
  },
  'Rice Blast': {
    organic:    'Use resistant varieties, drain fields',
    chemical:   'Spray Tricyclazole 0.6g/litre',
    time_limit: '48 hours', severity: 'severe', treatable: true
  },
  'Brown Spot': {
    organic:    'Apply Pseudomonas fluorescens 10ml/litre weekly',
    chemical:   'Apply Mancozeb 2g/litre preventively',
    time_limit: '7 days', severity: 'moderate', treatable: true
  },
  'Yellow Rust': {
    organic:    'Remove infected plants, improve air circulation',
    chemical:   'Spray Propiconazole 1ml/litre every 10 days',
    time_limit: '48 hours', severity: 'severe', treatable: true
  },
  'Bacterial Blight': {
    organic:    'Remove infected plants, avoid waterlogging',
    chemical:   'Spray Copper oxychloride 3g/litre',
    time_limit: '48 hours', severity: 'severe', treatable: true
  },
  'Powdery Mildew': {
    organic:    'Spray baking soda 5g/litre weekly',
    chemical:   'Apply Sulfur 2g/litre every 7 days',
    time_limit: '72 hours', severity: 'moderate', treatable: true
  },
  'Downy Mildew': {
    organic:    'Improve air circulation, reduce moisture',
    chemical:   'Spray Metalaxyl + Mancozeb 2g/litre',
    time_limit: '48 hours', severity: 'moderate', treatable: true
  },
  'Leaf Curl': {
    organic:    'Remove infected leaves, spray neem oil',
    chemical:   'Spray Imidacloprid 0.5ml/litre',
    time_limit: '72 hours', severity: 'mild', treatable: true
  },
  'Healthy': {
    organic:    'No treatment needed — crop is healthy',
    chemical:   'No treatment needed',
    time_limit: null, severity: 'none', treatable: true
  }
};

function getDefaultTreatment() {
  return {
    organic:    'Remove infected leaves and apply neem oil spray',
    chemical:   'Consult local agronomist for specific fungicide',
    time_limit: '48 hours', severity: 'moderate', treatable: true
  };
}

// ── Call Gemini Vision API ─────────────────────────────
async function callGemini(imageBuffer, imageType, cropName) {
  const base64Image = imageBuffer.toString('base64');

  const prompt = `You are a senior plant pathologist with 20 years experience diagnosing crop diseases in Indian farms.

Look very carefully at this ${cropName} leaf image.

Check for:
- Brown or dark patches on the leaf
- Yellow spots or yellowing edges
- White powdery coating
- Dark lesions or spots
- Wilting or curling
- Any discolouration

IMPORTANT: If you see ANY brown patches, dark spots, lesions, or discolouration — it is NOT healthy. Be strict.

Respond in EXACTLY this format, nothing else:
DISEASE: [disease name]
CONFIDENCE: [number 50 to 97]
REASON: [one sentence]

Disease options ONLY:
Early Blight, Late Blight, Leaf Blight, Rice Blast, Brown Spot, Yellow Rust, Bacterial Blight, Powdery Mildew, Downy Mildew, Leaf Curl, Healthy

CONFIDENCE number only — no percent sign.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: imageType || 'image/jpeg',
                data: base64Image
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 150
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  console.log('Gemini raw response:', text);

  const diseaseMatch    = text.match(/DISEASE:\s*(.+)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);

  const disease    = diseaseMatch
    ? diseaseMatch[1].trim().replace(/\*+/g, '')
    : 'Unknown';
  const confidence = confidenceMatch
    ? parseInt(confidenceMatch[1])
    : 65;

  return { disease, confidence };
}

// ── Mock AI fallback ───────────────────────────────────
function mockAI(cropName) {
  const DISEASE_MAP = {
    tomato:    ['Early Blight', 'Late Blight', 'Leaf Curl', 'Healthy'],
    rice:      ['Rice Blast', 'Brown Spot', 'Bacterial Blight', 'Healthy'],
    paddy:     ['Rice Blast', 'Brown Spot', 'Bacterial Blight', 'Healthy'],
    wheat:     ['Yellow Rust', 'Brown Spot', 'Powdery Mildew', 'Healthy'],
    maize:     ['Leaf Blight', 'Downy Mildew', 'Healthy'],
    groundnut: ['Early Blight', 'Late Blight', 'Healthy'],
    chilli:    ['Leaf Curl', 'Powdery Mildew', 'Healthy'],
    onion:     ['Downy Mildew', 'Bacterial Blight', 'Healthy'],
  };
  const diseases   = DISEASE_MAP[cropName.toLowerCase()] || ['Early Blight', 'Healthy'];
  const disease    = diseases[Math.floor(Math.random() * diseases.length)];
  const confidence = Math.floor(Math.random() * 30) + 60;
  return { disease, confidence };
}

// ── Upload image only ──────────────────────────────────
exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  res.json({ success: true, image_path: req.file.path });
};

// ── Main diagnose ──────────────────────────────────────
exports.diagnose = async (req, res) => {
  try {
    const { crop, season, language = 'en' } = req.body;
    const image_path = req.file ? req.file.path : null;

    if (!crop) return res.status(400).json({ error: 'Crop name required' });

    let disease    = 'Unknown';
    let confidence = 65;

    if (req.file && GEMINI_API_KEY) {
      try {
        const fs          = require('fs');
        const imageBuffer = fs.readFileSync(req.file.path);
        const imageType   = req.file.mimetype;
        const result      = await callGemini(imageBuffer, imageType, crop);
        disease    = result.disease;
        confidence = result.confidence;
        console.log(`Gemini diagnosed: ${disease} (${confidence}%)`);
      } catch (geminiErr) {
        console.error('Gemini error — falling back to mock:', geminiErr.message);
        const result = mockAI(crop);
        disease    = result.disease;
        confidence = result.confidence;
      }
    } else {
      const result = mockAI(crop);
      disease    = result.disease;
      confidence = result.confidence;
    }

    const treatment   = TREATMENT_DB[disease] || getDefaultTreatment();
    const expert_flag = confidence < 60;

    const result = await pool.query(
      `INSERT INTO history
       (image_path, crop_name, disease_name, confidence,
        severity, treatable, language, expert_review, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [image_path, crop, disease, confidence,
       treatment.severity, treatment.treatable,
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
      severity:      treatment.severity,
      treatable:     treatment.treatable,
      time_limit:    treatment.time_limit,
      organic:       treatment.organic,
      chemical:      treatment.chemical,
      expert_review: expert_flag,
      language
    });

  } catch (err) {
    console.error('Diagnose error:', err);
    res.status(500).json({ error: err.message });
  }
};