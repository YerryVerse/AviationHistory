'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const portableNodeDir = path.join(rootDir, 'tools', 'node');
const portableNpm = path.join(portableNodeDir, process.platform === 'win32' ? 'npm.cmd' : 'bin/npm');
const portablePythonDir = path.join(rootDir, 'tools', 'python');
const portableChrome = path.join(rootDir, 'tools', 'chrome', process.platform === 'win32' ? 'chrome.exe' : 'chrome');

const npmCommand = fs.existsSync(portableNpm)
  ? portableNpm
  : (process.platform === 'win32' ? 'npm.cmd' : 'npm');

const portablePathParts = [
  path.join(portableNodeDir),
  path.join(portablePythonDir),
  path.join(portablePythonDir, 'Scripts')
].filter(fs.existsSync);

const baseEnv = {
  ...process.env,
  PATH: [...portablePathParts, process.env.PATH || ''].join(path.delimiter)
};

if (fs.existsSync(portableChrome)) {
  baseEnv.CHROME_PATH = portableChrome;
}

if (fs.existsSync(path.join(portablePythonDir, 'python.exe'))) {
  baseEnv.PYTHON = path.join(portablePythonDir, 'python.exe');
}

const services = [
  {
    name: 'website',
    command: npmCommand,
    args: ['--prefix', 'Website', 'run', 'dev'],
    env: {}
  },
  {
    name: 'scraper-api',
    command: npmCommand,
    args: ['--prefix', 'scraper', 'run', 'server'],
    env: {}
  },
  {
    name: 'scraper-portal',
    command: npmCommand,
    args: ['--prefix', 'scraper', 'run', 'dev'],
    env: {}
  }
];

const children = [];
let shuttingDown = false;

function prefixOutput(name, stream, chunk) {
  const lines = chunk.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().length > 0) {
      stream.write(`[${name}] ${line}\n`);
    }
  }
}

function stopAll(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(process.platform === 'win32' ? undefined : 'SIGTERM');
    }
  }

  setTimeout(() => process.exit(code), 500);
}

for (const service of services) {
  const child = spawn(service.command, service.args, {
    cwd: rootDir,
    env: { ...baseEnv, ...service.env },
    windowsHide: false
  });

  children.push(child);

  child.stdout.on('data', chunk => prefixOutput(service.name, process.stdout, chunk));
  child.stderr.on('data', chunk => prefixOutput(service.name, process.stderr, chunk));

  child.on('exit', code => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${service.name}] exited with code ${code}`);
      stopAll(code || 1);
    }
  });
}

console.log('Running: website http://localhost:3000');
console.log('Running: scraper API http://localhost:8787');
console.log('Running: scraper portal http://localhost:5173');
console.log(`Using npm: ${npmCommand}`);
if (baseEnv.CHROME_PATH) console.log(`Using Chrome: ${baseEnv.CHROME_PATH}`);
if (baseEnv.PYTHON) console.log(`Using Python: ${baseEnv.PYTHON}`);
console.log('Press Ctrl+C to stop all services.');

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
