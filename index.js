/**
 * Windsurf Favorite Stashes Plugin
 * 
 * This plugin allows users to mark Git stashes as favorites and provides
 * commands to manage and view favorite stashes separately from regular stashes.
 */

const fs = require('fs');
const path = require('path');
const { simpleGit } = require('simple-git');

class FavoriteStashesPlugin {
  constructor() {
    this.configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.windsurf-favorite-stashes.json');
    this.favorites = this.loadFavorites();
    this.git = simpleGit();
  }

  /**
   * Load favorite stashes from config file
   */
  loadFavorites() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading favorite stashes:', error);
    }
    return { stashes: {} };
  }

  /**
   * Save favorite stashes to config file
   */
  saveFavorites() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.favorites, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving favorite stashes:', error);
    }
  }

  /**
   * Get all stashes with favorite status
   */
  async getAllStashes() {
    try {
      const result = await this.git.stash(['list']);
      const stashes = result.split('\n').filter(line => line.trim());
      
      return stashes.map(stash => {
        const match = stash.match(/^stash@\{(\d+)\}: (.*)/);
        if (match) {
          const index = match[1];
          const description = match[2];
          const stashId = `stash@{${index}}`;
          const isFavorite = this.favorites.stashes[stashId] || false;
          
          return {
            id: stashId,
            index,
            description,
            isFavorite
          };
        }
        return null;
      }).filter(Boolean);
    } catch (error) {
      console.error('Error getting stashes:', error);
      return [];
    }
  }

  /**
   * Mark a stash as favorite
   */
  async markAsFavorite(stashId) {
    if (!this.favorites.stashes) {
      this.favorites.stashes = {};
    }
    this.favorites.stashes[stashId] = true;
    this.saveFavorites();
    return { success: true, message: `Marked ${stashId} as favorite` };
  }

  /**
   * Unmark a stash as favorite
   */
  async unmarkAsFavorite(stashId) {
    if (this.favorites.stashes && this.favorites.stashes[stashId]) {
      delete this.favorites.stashes[stashId];
      this.saveFavorites();
      return { success: true, message: `Removed ${stashId} from favorites` };
    }
    return { success: false, message: `${stashId} is not marked as favorite` };
  }

  /**
   * Get only favorite stashes
   */
  async getFavoriteStashes() {
    const allStashes = await this.getAllStashes();
    return allStashes.filter(stash => stash.isFavorite);
  }

  /**
   * Apply a stash
   */
  async applyStash(stashId) {
    try {
      await this.git.stash(['apply', stashId]);
      return { success: true, message: `Applied ${stashId}` };
    } catch (error) {
      return { success: false, message: `Failed to apply ${stashId}: ${error.message}` };
    }
  }

  /**
   * Pop a stash
   */
  async popStash(stashId) {
    try {
      await this.git.stash(['pop', stashId]);
      // If stash was popped successfully, remove it from favorites if it was there
      if (this.favorites.stashes && this.favorites.stashes[stashId]) {
        delete this.favorites.stashes[stashId];
        this.saveFavorites();
      }
      return { success: true, message: `Popped ${stashId}` };
    } catch (error) {
      return { success: false, message: `Failed to pop ${stashId}: ${error.message}` };
    }
  }

  /**
   * Drop a stash
   */
  async dropStash(stashId) {
    try {
      await this.git.stash(['drop', stashId]);
      // If stash was dropped successfully, remove it from favorites if it was there
      if (this.favorites.stashes && this.favorites.stashes[stashId]) {
        delete this.favorites.stashes[stashId];
        this.saveFavorites();
      }
      return { success: true, message: `Dropped ${stashId}` };
    } catch (error) {
      return { success: false, message: `Failed to drop ${stashId}: ${error.message}` };
    }
  }
}

// Export the plugin class
module.exports = FavoriteStashesPlugin;
