#!/usr/bin/env node

/**
 * Installation script for Windsurf Favorite Stashes plugin
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing Windsurf Favorite Stashes plugin...');

// Make bin file executable
try {
  const binPath = path.join(__dirname, 'bin', 'favorite-stashes');
  fs.chmodSync(binPath, '755');
  console.log('✓ Made CLI executable');
} catch (error) {
  console.warn('⚠ Could not make CLI executable:', error.message);
  console.warn('  You may need to run: chmod +x bin/favorite-stashes');
}

// Check if Windsurf is installed
try {
  const windsurfPath = execSync('which windsurf').toString().trim();
  console.log(`✓ Found Windsurf at: ${windsurfPath}`);
} catch (error) {
  console.warn('⚠ Could not find Windsurf in PATH');
  console.warn('  Make sure Windsurf is installed and in your PATH');
}

// Create symbolic link for global access
try {
  execSync('npm link');
  console.log('✓ Created global symlink');
  console.log('  You can now use the "favorite-stashes" command');
} catch (error) {
  console.warn('⚠ Could not create global symlink:', error.message);
  console.warn('  You may need to run: npm link');
}

console.log('\nInstallation complete!');
console.log('\nTo use the plugin:');
console.log('1. Open Windsurf');
console.log('2. Go to Settings > Extensions');
console.log('3. Find "Favorite Stashes" and enable it');
console.log('\nOr use the CLI directly:');
console.log('favorite-stashes help');
