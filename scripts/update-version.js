#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// eslint-disable-next-line no-undef
const version = process.argv[2];

if (!version) {
  // eslint-disable-next-line no-console -- Logging purpose
  console.error('Error: Version argument is required');

  // eslint-disable-next-line no-undef
  process.exit(1);
}

// Update Cargo.toml
const cargoPath = resolve('src-tauri/Cargo.toml');
let cargoContent = readFileSync(cargoPath, 'utf-8');

cargoContent = cargoContent.replace(/^version = ".*"$/m, `version = "${version}"`);
writeFileSync(cargoPath, cargoContent);

// eslint-disable-next-line no-console -- Logging purpose
console.log(`✓ Updated Cargo.toml to version ${version}`);

// Update tauri.conf.json
const tauriPath = resolve('src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(readFileSync(tauriPath, 'utf-8'));

tauriConfig.version = version;
writeFileSync(tauriPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);

// eslint-disable-next-line no-console -- Logging purpose
console.log(`✓ Updated tauri.conf.json to version ${version}`);
