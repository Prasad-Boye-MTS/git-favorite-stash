#!/usr/bin/env node

/**
 * Command-line interface for the Windsurf Favorite Stashes plugin
 */

const FavoriteStashesPlugin = require('./index');
const plugin = new FavoriteStashesPlugin();

// Helper function to format stash output
function formatStash(stash) {
  const favoriteMarker = stash.isFavorite ? '★ ' : '  ';
  return `${favoriteMarker}${stash.id}: ${stash.description}`;
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const stashId = args[1];

async function main() {
  try {
    switch (command) {
      case 'list':
        // List all stashes with favorite status
        const allStashes = await plugin.getAllStashes();
        console.log('All stashes (★ = favorite):');
        allStashes.forEach(stash => {
          console.log(formatStash(stash));
        });
        break;

      case 'favorites':
        // List only favorite stashes
        const favorites = await plugin.getFavoriteStashes();
        if (favorites.length === 0) {
          console.log('No favorite stashes found.');
        } else {
          console.log('Favorite stashes:');
          favorites.forEach(stash => {
            console.log(formatStash(stash));
          });
        }
        break;

      case 'mark':
        // Mark a stash as favorite
        if (!stashId) {
          console.error('Error: Please provide a stash ID (e.g., stash@{0})');
          process.exit(1);
        }
        const markResult = await plugin.markAsFavorite(stashId);
        console.log(markResult.message);
        break;

      case 'unmark':
        // Unmark a stash as favorite
        if (!stashId) {
          console.error('Error: Please provide a stash ID (e.g., stash@{0})');
          process.exit(1);
        }
        const unmarkResult = await plugin.unmarkAsFavorite(stashId);
        console.log(unmarkResult.message);
        break;

      case 'apply':
        // Apply a stash
        if (!stashId) {
          console.error('Error: Please provide a stash ID (e.g., stash@{0})');
          process.exit(1);
        }
        const applyResult = await plugin.applyStash(stashId);
        console.log(applyResult.message);
        break;

      case 'pop':
        // Pop a stash
        if (!stashId) {
          console.error('Error: Please provide a stash ID (e.g., stash@{0})');
          process.exit(1);
        }
        const popResult = await plugin.popStash(stashId);
        console.log(popResult.message);
        break;

      case 'drop':
        // Drop a stash
        if (!stashId) {
          console.error('Error: Please provide a stash ID (e.g., stash@{0})');
          process.exit(1);
        }
        const dropResult = await plugin.dropStash(stashId);
        console.log(dropResult.message);
        break;

      case 'help':
      default:
        // Show help
        console.log(`
Windsurf Favorite Stashes - Manage your favorite Git stashes

Usage:
  favorite-stashes list                 List all stashes with favorite status
  favorite-stashes favorites            List only favorite stashes
  favorite-stashes mark <stash-id>      Mark a stash as favorite
  favorite-stashes unmark <stash-id>    Unmark a stash as favorite
  favorite-stashes apply <stash-id>     Apply a stash
  favorite-stashes pop <stash-id>       Pop a stash
  favorite-stashes drop <stash-id>      Drop a stash
  favorite-stashes help                 Show this help message

Examples:
  favorite-stashes mark stash@{0}
  favorite-stashes list
  favorite-stashes favorites
        `);
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
