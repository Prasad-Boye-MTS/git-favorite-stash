/**
 * Tests for the CLI interface
 */

const FavoriteStashesPlugin = require('../index');

// Mock the plugin
jest.mock('../index');

// Mock process.argv and console
const originalArgv = process.argv;
const originalExit = process.exit;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('CLI', () => {
  let mockPlugin;
  let mockExit;
  let consoleOutput = [];
  let consoleErrors = [];
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock plugin instance methods
    mockPlugin = {
      getAllStashes: jest.fn(),
      getFavoriteStashes: jest.fn(),
      markAsFavorite: jest.fn(),
      unmarkAsFavorite: jest.fn(),
      applyStash: jest.fn(),
      popStash: jest.fn(),
      dropStash: jest.fn()
    };
    
    FavoriteStashesPlugin.mockImplementation(() => mockPlugin);
    
    // Mock process.exit
    mockExit = jest.fn();
    process.exit = mockExit;
    
    // Mock console.log and console.error
    consoleOutput = [];
    consoleErrors = [];
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
    console.error = jest.fn((...args) => {
      consoleErrors.push(args.join(' '));
    });
  });
  
  afterEach(() => {
    // Restore original process.argv and console methods
    process.argv = originalArgv;
    process.exit = originalExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  describe('list command', () => {
    it('should list all stashes with favorite status', async () => {
      // Mock process.argv
      process.argv = ['node', 'cli.js', 'list'];
      
      // Mock getAllStashes response
      mockPlugin.getAllStashes.mockResolvedValue([
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
        }
      ]);
      
      // Import CLI module (which will execute the command)
      await import('../cli.js');
      
      // Verify that getAllStashes was called
      expect(mockPlugin.getAllStashes).toHaveBeenCalled();
      
      // Verify console output
      expect(consoleOutput).toContain('All stashes (★ = favorite):');
      expect(consoleOutput).toContain('  stash@{0}: WIP on feature-branch: Add new feature');
      expect(consoleOutput).toContain('★ stash@{1}: WIP on bugfix: Fix critical bug');
    });
  });
  
  describe('favorites command', () => {
    it('should list only favorite stashes', async () => {
      // Mock process.argv
      process.argv = ['node', 'cli.js', 'favorites'];
      
      // Mock getFavoriteStashes response
      mockPlugin.getFavoriteStashes.mockResolvedValue([
        {
          id: 'stash@{1}',
          index: '1',
          description: 'WIP on bugfix: Fix critical bug',
          isFavorite: true
        }
      ]);
      
      // Import CLI module (which will execute the command)
      await import('../cli.js');
      
      // Verify that getFavoriteStashes was called
      expect(mockPlugin.getFavoriteStashes).toHaveBeenCalled();
      
      // Verify console output
      expect(consoleOutput).toContain('Favorite stashes:');
      expect(consoleOutput).toContain('★ stash@{1}: WIP on bugfix: Fix critical bug');
    });
    
    it('should show message when no favorite stashes found', async () => {
      // Mock process.argv
      process.argv = ['node', 'cli.js', 'favorites'];
      
      // Mock getFavoriteStashes response
      mockPlugin.getFavoriteStashes.mockResolvedValue([]);
      
      // Import CLI module (which will execute the command)
      await import('../cli.js');
      
      // Verify that getFavoriteStashes was called
      expect(mockPlugin.getFavoriteStashes).toHaveBeenCalled();
      
      // Verify console output
      expect(consoleOutput).toContain('No favorite stashes found.');
    });
  });
  
  describe('mark command', () => {
    it('should mark a stash as favorite', async () => {
      // Mock process.argv
      process.argv = ['node', 'cli.js', 'mark', 'stash@{0}'];
      
      // Mock markAsFavorite response
      mockPlugin.markAsFavorite.mockResolvedValue({
        success: true,
        message: 'Marked stash@{0} as favorite'
      });
      
      // Import CLI module (which will execute the command)
      await import('../cli.js');
      
      // Verify that markAsFavorite was called with the correct stashId
      expect(mockPlugin.markAsFavorite).toHaveBeenCalledWith('stash@{0}');
      
      // Verify console output
      expect(consoleOutput).toContain('Marked stash@{0} as favorite');
    });
    
    it('should show error when stashId is missing', async () => {
      // Mock process.argv
      process.argv = ['node', 'cli.js', 'mark'];
      
      // Import CLI module (which will execute the command)
      await import('../cli.js');
      
      // Verify that markAsFavorite was not called
      expect(mockPlugin.markAsFavorite).not.toHaveBeenCalled();
      
      // Verify console error
      expect(consoleErrors).toContain('Error: Please provide a stash ID (e.g., stash@{0})');
      
      // Verify process.exit was called with error code
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('help command', () => {
    it('should show help message', async () => {
      // Mock process.argv
      process.argv = ['node', 'cli.js', 'help'];
      
      // Import CLI module (which will execute the command)
      await import('../cli.js');
      
      // Verify console output contains help text
      expect(consoleOutput.join(' ')).toContain('Windsurf Favorite Stashes');
      expect(consoleOutput.join(' ')).toContain('Usage:');
      expect(consoleOutput.join(' ')).toContain('favorite-stashes list');
    });
  });
});
