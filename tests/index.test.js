/**
 * Tests for the Favorite Stashes plugin
 */

const fs = require('fs');
const path = require('path');
const FavoriteStashesPlugin = require('../index');

// Mock simple-git
jest.mock('simple-git', () => {
  return {
    simpleGit: jest.fn().mockImplementation(() => ({
      stash: jest.fn().mockImplementation(([command, stashId]) => {
        if (command === 'list') {
          return Promise.resolve(
            'stash@{0}: WIP on feature-branch: Add new feature\n' +
            'stash@{1}: WIP on bugfix: Fix critical bug\n' +
            'stash@{2}: WIP on master: Update documentation'
          );
        } else if (command === 'apply' && stashId) {
          return Promise.resolve('');
        } else if (command === 'pop' && stashId) {
          return Promise.resolve('');
        } else if (command === 'drop' && stashId) {
          return Promise.resolve('');
        } else {
          return Promise.reject(new Error('Invalid stash command'));
        }
      })
    }))
  };
});

// Mock fs
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn()
  };
});

describe('FavoriteStashesPlugin', () => {
  let plugin;
  const mockConfigPath = path.join(process.env.USERPROFILE || process.env.HOME, '.windsurf-favorite-stashes.json');
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('{"stashes":{}}');
    
    // Create plugin instance
    plugin = new FavoriteStashesPlugin();
  });
  
  describe('loadFavorites', () => {
    it('should return empty object if config file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = plugin.loadFavorites();
      
      expect(result).toEqual({ stashes: {} });
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
    
    it('should load favorites from config file if it exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{"stashes":{"stash@{0}":true}}');
      
      const result = plugin.loadFavorites();
      
      expect(result).toEqual({ stashes: { 'stash@{0}': true } });
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf8');
    });
    
    it('should handle JSON parse errors', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = plugin.loadFavorites();
      
      expect(result).toEqual({ stashes: {} });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
  
  describe('saveFavorites', () => {
    it('should save favorites to config file', () => {
      plugin.favorites = { stashes: { 'stash@{0}': true } };
      
      plugin.saveFavorites();
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({ stashes: { 'stash@{0}': true } }, null, 2),
        'utf8'
      );
    });
    
    it('should handle write errors', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      plugin.saveFavorites();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
  
  describe('getAllStashes', () => {
    it('should return all stashes with favorite status', async () => {
      plugin.favorites = { stashes: { 'stash@{1}': true } };
      
      const stashes = await plugin.getAllStashes();
      
      expect(stashes).toEqual([
        {
          id: 'stash@{0}',
          index: '0',
          description: 'WIP on feature-branch: Add new feature',
          isFavorite: false
        },
        {
          id: 'stash@{1}',
          index: '1',
          description: 'WIP on bugfix: Fix critical bug',
          isFavorite: true
        },
        {
          id: 'stash@{2}',
          index: '2',
          description: 'WIP on master: Update documentation',
          isFavorite: false
        }
      ]);
    });
  });
  
  describe('markAsFavorite', () => {
    it('should mark a stash as favorite', async () => {
      const result = await plugin.markAsFavorite('stash@{0}');
      
      expect(result).toEqual({
        success: true,
        message: 'Marked stash@{0} as favorite'
      });
      expect(plugin.favorites.stashes['stash@{0}']).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('unmarkAsFavorite', () => {
    it('should unmark a stash as favorite', async () => {
      plugin.favorites = { stashes: { 'stash@{0}': true } };
      
      const result = await plugin.unmarkAsFavorite('stash@{0}');
      
      expect(result).toEqual({
        success: true,
        message: 'Removed stash@{0} from favorites'
      });
      expect(plugin.favorites.stashes['stash@{0}']).toBeUndefined();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('should return error if stash is not marked as favorite', async () => {
      plugin.favorites = { stashes: {} };
      
      const result = await plugin.unmarkAsFavorite('stash@{0}');
      
      expect(result).toEqual({
        success: false,
        message: 'stash@{0} is not marked as favorite'
      });
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
  
  describe('getFavoriteStashes', () => {
    it('should return only favorite stashes', async () => {
      plugin.favorites = { stashes: { 'stash@{1}': true } };
      
      const stashes = await plugin.getFavoriteStashes();
      
      expect(stashes).toEqual([
        {
          id: 'stash@{1}',
          index: '1',
          description: 'WIP on bugfix: Fix critical bug',
          isFavorite: true
        }
      ]);
    });
  });
  
  describe('applyStash', () => {
    it('should apply a stash', async () => {
      const result = await plugin.applyStash('stash@{0}');
      
      expect(result).toEqual({
        success: true,
        message: 'Applied stash@{0}'
      });
    });
  });
  
  describe('popStash', () => {
    it('should pop a stash and remove it from favorites if it was favorite', async () => {
      plugin.favorites = { stashes: { 'stash@{0}': true } };
      
      const result = await plugin.popStash('stash@{0}');
      
      expect(result).toEqual({
        success: true,
        message: 'Popped stash@{0}'
      });
      expect(plugin.favorites.stashes['stash@{0}']).toBeUndefined();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('dropStash', () => {
    it('should drop a stash and remove it from favorites if it was favorite', async () => {
      plugin.favorites = { stashes: { 'stash@{0}': true } };
      
      const result = await plugin.dropStash('stash@{0}');
      
      expect(result).toEqual({
        success: true,
        message: 'Dropped stash@{0}'
      });
      expect(plugin.favorites.stashes['stash@{0}']).toBeUndefined();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
