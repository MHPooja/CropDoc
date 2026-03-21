const say  = require('say');
const path = require('path');

exports.generateAudio = (req, res) => {
  const { text, language = 'en' } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  const filename  = `audio_${Date.now()}.wav`;
  const audioPath = path.join('audio', filename);

  say.export(text, null, 0.9, audioPath, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success:   true,
      audio_url: `http://localhost:5000/audio/${filename}`
    });
  });
};