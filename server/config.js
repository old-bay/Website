const fs = require('fs');
const path = require('path');

function loadConfig(filePath) {
  const config = {};
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    config[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
  return config;
}

const configPath = path.join(__dirname, '..', 'config.txt');
const config = loadConfig(configPath);

module.exports = config;
