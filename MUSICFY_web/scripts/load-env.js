const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const localEnvPath = path.join(projectRoot, '.env.local');
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
