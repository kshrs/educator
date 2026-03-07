const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../../.env');

// --- .env Helpers ---

// Parses a .env file string into a plain key/value object.
// Skips blank lines and comments.
const parseEnv = (content) => {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
};

// Serializes a plain object back into .env file format.
const serializeEnv = (obj) => {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
};

// --- Controllers ---

// GET /api/health/config
// Reads .env and returns the API key status (never the raw key) and model name.
const getConfig = (req, res) => {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    const parsed = parseEnv(content);

    res.status(200).json({
      apiKeyStatus: parsed.API_KEY ? 'set' : 'empty',
      // Show only the last 4 chars — enough to identify the key, safe to expose
      apiKeyPreview: parsed.API_KEY
        ? '••••••••' + parsed.API_KEY.slice(-4)
        : '',
      modelName: parsed.MODEL_NAME || '',
    });
  } catch (e) {
    console.error(`[health] getConfig error: ${e.message}`);
    res.status(500).json({ message: 'Could not read .env file.' });
  }
};

// POST /api/health/config
// Accepts { apiKey?, modelName? } in the request body and writes them to .env.
// Only updates fields that are explicitly sent — others are preserved.
const saveConfig = (req, res) => {
  try {
    let parsed = {};

    // Read existing .env if it exists — don't wipe keys we're not touching
    try {
      const content = fs.readFileSync(ENV_PATH, 'utf-8');
      parsed = parseEnv(content);
    } catch {
      // .env doesn't exist yet — we'll create it fresh
    }

    const { apiKey, modelName } = req.body;

    if (apiKey && apiKey.trim()) parsed.API_KEY = apiKey.trim();
    if (modelName !== undefined) parsed.MODEL_NAME = modelName.trim();

    fs.writeFileSync(ENV_PATH, serializeEnv(parsed), 'utf-8');
    require('dotenv').config({ path: ENV_PATH, override: true});

    res.status(200).json({ message: 'Config saved.' });
  } catch (e) {
    console.error(`[health] saveConfig error: ${e.message}`);
    res.status(500).json({ message: 'Could not write .env file.' });
  }
};

// GET /api/health/status
// Pings the Gemini API with the stored key to verify it is valid and reachable.
// Uses the lightweight /models list endpoint — no generation cost.
const checkApiStatus = async (req, res) => {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    const parsed = parseEnv(content);
    const apiKey = parsed.API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        status: 'no_key',
        message: 'No API key configured in .env.',
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (response.ok) {
      res.status(200).json({
        status: 'ok',
        message: 'API key is valid. Connection successful.',
      });
    } else {
      const body = await response.json();
      res.status(200).json({
        status: 'invalid',
        message: body?.error?.message || 'API rejected the key.',
      });
    }
  } catch (e) {
    console.error(`[health] checkApiStatus error: ${e.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed. Backend could not reach the API.',
    });
  }
};

module.exports = {
  getConfig,
  saveConfig,
  checkApiStatus,
};
