/**
 * Windsurf integration for Favorite Stashes plugin
 * 
 * This file defines how the plugin integrates with the Windsurf environment,
 * including commands, UI elements, and event handlers.
 * 
 * Provides direct integration with Source Control panel similar to GitLens
 */

const FavoriteStashesPlugin = require('./index');
const path = require('path');

/**
 * Register the plugin with Windsurf
 */
module.exports = function(windsurf) {
  const plugin = new FavoriteStashesPlugin();
  
  // Register commands
  windsurf.commands.register('favorite-stashes.list', async () => {
    const stashes = await plugin.getAllStashes();
    return {
      type: 'stash-list',
      stashes: stashes
    };
  });
  
  windsurf.commands.register('favorite-stashes.favorites', async () => {
    const favorites = await plugin.getFavoriteStashes();
    return {
      type: 'stash-list',
      stashes: favorites
    };
  });
  
  windsurf.commands.register('favorite-stashes.mark', async (args) => {
    const stashId = args.stashId;
    if (!stashId) {
      throw new Error('Stash ID is required');
    }
    return await plugin.markAsFavorite(stashId);
  });
  
  windsurf.commands.register('favorite-stashes.unmark', async (args) => {
    const stashId = args.stashId;
    if (!stashId) {
      throw new Error('Stash ID is required');
    }
    return await plugin.unmarkAsFavorite(stashId);
  });
  
  windsurf.commands.register('favorite-stashes.apply', async (args) => {
    const stashId = args.stashId;
    if (!stashId) {
      throw new Error('Stash ID is required');
    }
    return await plugin.applyStash(stashId);
  });
  
  windsurf.commands.register('favorite-stashes.pop', async (args) => {
    const stashId = args.stashId;
    if (!stashId) {
      throw new Error('Stash ID is required');
    }
    return await plugin.popStash(stashId);
  });
  
  windsurf.commands.register('favorite-stashes.drop', async (args) => {
    const stashId = args.stashId;
    if (!stashId) {
      throw new Error('Stash ID is required');
    }
    return await plugin.dropStash(stashId);
  });
  
  // Register UI contributions
  windsurf.ui.registerView('favorite-stashes', {
    title: 'Favorite Stashes',
    icon: 'star',
    component: 'favorite-stashes-view'
  });
  
  // Register Source Control provider
  windsurf.scm.registerProvider({
    id: 'favorite-stashes',
    label: 'Stashes',
    rootUri: windsurf.workspace.rootPath,
    icon: 'stash',
    acceptInputCommand: 'favorite-stashes.createStash',
    inputPlaceholder: 'Stash message...',
    count: 0,
    statusBarCommands: [
      {
        id: 'favorite-stashes.refresh',
        title: 'Refresh',
        icon: 'refresh'
      }
    ]
  });
  
  // Register Source Control resource groups
  // Favorites group is created first so it appears at the top
  const favoritesGroup = windsurf.scm.createResourceGroup('favorite-stashes.favorites', '★ Favorites');
  const stashesGroup = windsurf.scm.createResourceGroup('favorite-stashes.stashes', 'Other Stashes');
  
  // Register custom components
  windsurf.ui.registerComponent('favorite-stashes-view', {
    template: `
      <div class="favorite-stashes-container">
        <div class="stash-tabs">
          <button class="tab-button" :class="{ active: activeTab === 'all' }" @click="setActiveTab('all')">All Stashes</button>
          <button class="tab-button" :class="{ active: activeTab === 'favorites' }" @click="setActiveTab('favorites')">Favorites</button>
        </div>
        
        <div class="stash-list">
          <div v-if="loading" class="loading">Loading stashes...</div>
          <div v-else-if="stashes.length === 0" class="no-stashes">No stashes found.</div>
          <div v-else class="stash-item" v-for="stash in stashes" :key="stash.id">
            <div class="stash-star" @click="toggleFavorite(stash)">
              <span v-if="stash.isFavorite" class="favorite">★</span>
              <span v-else class="not-favorite">☆</span>
            </div>
            <div class="stash-info">
              <div class="stash-id">{{ stash.id }}</div>
              <div class="stash-description">{{ stash.description }}</div>
            </div>
            <div class="stash-actions">
              <button @click="applyStash(stash.id)" title="Apply stash">Apply</button>
              <button @click="popStash(stash.id)" title="Pop stash">Pop</button>
              <button @click="dropStash(stash.id)" title="Drop stash">Drop</button>
            </div>
          </div>
        </div>
      </div>
    `,
    
    data() {
      return {
        activeTab: 'all',
        stashes: [],
        loading: true
      };
    },
    
    mounted() {
      this.loadStashes();
    },
    
    methods: {
      async loadStashes() {
        this.loading = true;
        try {
          if (this.activeTab === 'all') {
            const result = await windsurf.commands.execute('favorite-stashes.list');
            this.stashes = result.stashes;
          } else {
            const result = await windsurf.commands.execute('favorite-stashes.favorites');
            this.stashes = result.stashes;
          }
        } catch (error) {
          windsurf.notifications.show({
            type: 'error',
            message: `Failed to load stashes: ${error.message}`
          });
          this.stashes = [];
        } finally {
          this.loading = false;
        }
      },
      
      setActiveTab(tab) {
        this.activeTab = tab;
        this.loadStashes();
      },
      
      async toggleFavorite(stash) {
        try {
          if (stash.isFavorite) {
            await windsurf.commands.execute('favorite-stashes.unmark', { stashId: stash.id });
          } else {
            await windsurf.commands.execute('favorite-stashes.mark', { stashId: stash.id });
          }
          this.loadStashes();
        } catch (error) {
          windsurf.notifications.show({
            type: 'error',
            message: `Failed to update favorite status: ${error.message}`
          });
        }
      },
      
      async applyStash(stashId) {
        try {
          const result = await windsurf.commands.execute('favorite-stashes.apply', { stashId });
          windsurf.notifications.show({
            type: result.success ? 'success' : 'error',
            message: result.message
          });
        } catch (error) {
          windsurf.notifications.show({
            type: 'error',
            message: `Failed to apply stash: ${error.message}`
          });
        }
      },
      
      async popStash(stashId) {
        try {
          const result = await windsurf.commands.execute('favorite-stashes.pop', { stashId });
          if (result.success) {
            windsurf.notifications.show({
              type: 'success',
              message: result.message
            });
            this.loadStashes();
          } else {
            windsurf.notifications.show({
              type: 'error',
              message: result.message
            });
          }
        } catch (error) {
          windsurf.notifications.show({
            type: 'error',
            message: `Failed to pop stash: ${error.message}`
          });
        }
      },
      
      async dropStash(stashId) {
        try {
          const confirmed = await windsurf.dialogs.confirm({
            title: 'Drop Stash',
            message: `Are you sure you want to drop ${stashId}?`,
            confirmText: 'Drop',
            cancelText: 'Cancel'
          });
          
          if (confirmed) {
            const result = await windsurf.commands.execute('favorite-stashes.drop', { stashId });
            if (result.success) {
              windsurf.notifications.show({
                type: 'success',
                message: result.message
              });
              this.loadStashes();
            } else {
              windsurf.notifications.show({
                type: 'error',
                message: result.message
              });
            }
          }
        } catch (error) {
          windsurf.notifications.show({
            type: 'error',
            message: `Failed to drop stash: ${error.message}`
          });
        }
      }
    }
  });
  
  // Register context menu items for stash list
  windsurf.contextMenu.register({
    id: 'favorite-stashes-context-menu',
    selector: '.git-stash-item',
    items: [
      {
        id: 'mark-favorite',
        label: 'Mark as Favorite',
        condition: (context) => !context.stash.isFavorite,
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.mark', { stashId: context.stash.id });
        }
      },
      {
        id: 'unmark-favorite',
        label: 'Remove from Favorites',
        condition: (context) => context.stash.isFavorite,
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.unmark', { stashId: context.stash.id });
        }
      },
      {
        type: 'separator'
      },
      {
        id: 'apply-stash',
        label: 'Apply Stash',
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.apply', { stashId: context.stash.id });
        }
      },
      {
        id: 'pop-stash',
        label: 'Pop Stash',
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.pop', { stashId: context.stash.id });
        }
      },
      {
        id: 'drop-stash',
        label: 'Drop Stash',
        action: async (context) => {
          const confirmed = await windsurf.dialogs.confirm({
            title: 'Drop Stash',
            message: `Are you sure you want to drop ${context.stash.id}?`,
            confirmText: 'Drop',
            cancelText: 'Cancel'
          });
          
          if (confirmed) {
            await windsurf.commands.execute('favorite-stashes.drop', { stashId: context.stash.id });
          }
        }
      }
    ]
  });
  
  // Register context menu items for Source Control panel - regular stashes
  windsurf.contextMenu.register({
    id: 'favorite-stashes-scm-context-menu',
    selector: '.scm-resource.stash-item',
    items: [
      {
        id: 'mark-favorite-scm',
        label: 'Mark as Favorite',
        condition: (context) => !context.resource.metadata.isFavorite,
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.mark', { stashId: context.resource.metadata.id });
          refreshStashesView();
        }
      },
      {
        id: 'unmark-favorite-scm',
        label: 'Remove from Favorites',
        condition: (context) => context.resource.metadata.isFavorite,
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.unmark', { stashId: context.resource.metadata.id });
          refreshStashesView();
        }
      },
      {
        type: 'separator'
      },
      {
        id: 'apply-stash-scm',
        label: 'Apply Stash',
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.apply', { stashId: context.resource.metadata.id });
          refreshStashesView();
        }
      },
      {
        id: 'pop-stash-scm',
        label: 'Pop Stash',
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.pop', { stashId: context.resource.metadata.id });
          refreshStashesView();
        }
      },
      {
        id: 'drop-stash-scm',
        label: 'Drop Stash',
        action: async (context) => {
          const confirmed = await windsurf.dialogs.confirm({
            title: 'Drop Stash',
            message: `Are you sure you want to drop ${context.resource.metadata.id}?`,
            confirmText: 'Drop',
            cancelText: 'Cancel'
          });
          
          if (confirmed) {
            await windsurf.commands.execute('favorite-stashes.drop', { stashId: context.resource.metadata.id });
            refreshStashesView();
          }
        }
      }
    ]
  });
  
  // Register context menu items specifically for favorite stashes
  windsurf.contextMenu.register({
    id: 'favorite-stashes-scm-favorites-context-menu',
    selector: '.scm-resource.favorite-stash-item',
    items: [
      {
        id: 'unmark-favorite-scm-quick',
        label: 'Remove from Favorites',
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.unmark', { stashId: context.resource.metadata.id });
          refreshStashesView();
        }
      },
      {
        type: 'separator'
      },
      {
        id: 'apply-stash-scm-quick',
        label: 'Apply Stash',
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.apply', { stashId: context.resource.metadata.id });
          refreshStashesView();
        }
      },
      {
        id: 'pop-stash-scm-quick',
        label: 'Pop Stash',
        action: async (context) => {
          await windsurf.commands.execute('favorite-stashes.pop', { stashId: context.resource.metadata.id });
          refreshStashesView();
        }
      },
      {
        id: 'drop-stash-scm-quick',
        label: 'Drop Stash',
        action: async (context) => {
          const confirmed = await windsurf.dialogs.confirm({
            title: 'Drop Stash',
            message: `Are you sure you want to drop ${context.resource.metadata.id}?`,
            confirmText: 'Drop',
            cancelText: 'Cancel'
          });
          
          if (confirmed) {
            await windsurf.commands.execute('favorite-stashes.drop', { stashId: context.resource.metadata.id });
            refreshStashesView();
          }
        }
      }
    ]
  });
  
  // Add CSS styles
  windsurf.ui.addStyles(`
    .favorite-stashes-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .scm-resource.favorite-stash-item {
      font-weight: bold;
      border-left: 2px solid #FFCC00;
    }
    
    .stash-tabs {
      display: flex;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding: 0 8px;
    }
    
    .tab-button {
      padding: 8px 16px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--vscode-foreground);
      border-bottom: 2px solid transparent;
      margin-right: 8px;
    }
    
    .tab-button.active {
      border-bottom-color: var(--vscode-focusBorder);
      font-weight: bold;
    }
    
    .stash-list {
      flex: 1;
      overflow: auto;
      padding: 8px;
    }
    
    .stash-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .stash-star {
      margin-right: 8px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .favorite {
      color: gold;
    }
    
    .not-favorite {
      color: var(--vscode-disabledForeground);
    }
    
    .stash-info {
      flex: 1;
    }
    
    .stash-id {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    
    .stash-description {
      font-size: 14px;
    }
    
    .stash-actions {
      display: flex;
      gap: 4px;
    }
    
    .stash-actions button {
      padding: 4px 8px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
    }
    
    .stash-actions button:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    
    .loading, .no-stashes {
      padding: 16px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
    }
  `);
  
  // Register keyboard shortcuts
  windsurf.keybindings.register({
    key: 'ctrl+shift+s f',
    command: 'favorite-stashes.favorites',
    when: 'gitViewVisible'
  });
  
  // Function to refresh stashes in Source Control panel
  async function refreshStashesView() {
    try {
      const allStashes = await plugin.getAllStashes();
      const favoriteStashes = allStashes.filter(stash => stash.isFavorite);
      const regularStashes = allStashes.filter(stash => !stash.isFavorite);
      
      // Update regular stashes group - only show non-favorite stashes here
      stashesGroup.resourceStates = regularStashes.map(stash => ({
        resourceUri: windsurf.Uri.parse(`stash:${stash.id}`),
        decorations: {
          tooltip: stash.description,
          strikeThrough: false,
          faded: false,
          light: {
            iconPath: path.join(__dirname, 'resources', 'stash-light.svg')
          },
          dark: {
            iconPath: path.join(__dirname, 'resources', 'stash-dark.svg')
          }
        },
        contextValue: 'stash-item',
        command: {
          title: 'Show Stash',
          command: 'favorite-stashes.showStash',
          arguments: [stash.id]
        },
        metadata: {
          id: stash.id,
          index: stash.index,
          description: stash.description,
          isFavorite: false
        }
      }));
      
      // Update favorite stashes group with enhanced styling
      favoritesGroup.resourceStates = favoriteStashes.map(stash => ({
        resourceUri: windsurf.Uri.parse(`stash:${stash.id}`),
        decorations: {
          tooltip: `★ FAVORITE: ${stash.description}`,
          strikeThrough: false,
          faded: false,
          light: {
            iconPath: path.join(__dirname, 'resources', 'stash-favorite-light.svg'),
            color: '#FFCC00' // Gold color for favorite items
          },
          dark: {
            iconPath: path.join(__dirname, 'resources', 'stash-favorite-dark.svg'),
            color: '#FFCC00' // Gold color for favorite items
          },
          badge: {
            text: '★',
            tooltip: 'Favorite stash'
          }
        },
        contextValue: 'favorite-stash-item',
        command: {
          title: 'Show Stash',
          command: 'favorite-stashes.showStash',
          arguments: [stash.id]
        },
        metadata: {
          id: stash.id,
          index: stash.index,
          description: stash.description,
          isFavorite: true
        }
      }));
      
      // Hide the regular stashes group if empty
      stashesGroup.hideWhenEmpty = true;
      
      // Hide the favorites group if empty
      favoritesGroup.hideWhenEmpty = true;
      
      // Update badge count to show number of favorite stashes
      windsurf.scm.updateProviderBadge('favorite-stashes', favoriteStashes.length);
    } catch (error) {
      windsurf.notifications.show({
        type: 'error',
        message: `Failed to refresh stashes: ${error.message}`
      });
    }
  }
  
  // Register command to show stash contents
  windsurf.commands.register('favorite-stashes.showStash', async (stashId) => {
    try {
      const result = await windsurf.git.exec(['stash', 'show', '-p', stashId]);
      
      // Create a temporary document to show stash contents
      const document = await windsurf.workspace.openTextDocument({
        content: result.stdout,
        language: 'diff'
      });
      
      await windsurf.window.showTextDocument(document, { preview: true });
    } catch (error) {
      windsurf.notifications.show({
        type: 'error',
        message: `Failed to show stash: ${error.message}`
      });
    }
  });
  
  // Register command to create a new stash
  windsurf.commands.register('favorite-stashes.createStash', async (message) => {
    try {
      if (!message) {
        return;
      }
      
      await windsurf.git.exec(['stash', 'push', '-m', message]);
      refreshStashesView();
      
      windsurf.notifications.show({
        type: 'info',
        message: 'Created stash: ' + message
      });
    } catch (error) {
      windsurf.notifications.show({
        type: 'error',
        message: `Failed to create stash: ${error.message}`
      });
    }
  });
  
  // Register refresh command
  windsurf.commands.register('favorite-stashes.refresh', async () => {
    await refreshStashesView();
  });
  
  // Initial refresh of stashes
  refreshStashesView();
  
  // Set up file system watcher to detect Git operations
  const gitDirWatcher = windsurf.workspace.createFileSystemWatcher(
    path.join(windsurf.workspace.rootPath, '.git', 'refs', '**'),
    true
  );
  
  gitDirWatcher.onDidChange(() => refreshStashesView());
  gitDirWatcher.onDidCreate(() => refreshStashesView());
  gitDirWatcher.onDidDelete(() => refreshStashesView());
  
  // Log that the plugin has been loaded
  console.log('Favorite Stashes plugin loaded');
  
  // Return the plugin API
  return {
    name: 'favorite-stashes',
    version: '1.0.0',
    description: 'Manage favorite Git stashes',
    api: {
      getAllStashes: () => plugin.getAllStashes(),
      getFavoriteStashes: () => plugin.getFavoriteStashes(),
      markAsFavorite: (stashId) => plugin.markAsFavorite(stashId),
      unmarkAsFavorite: (stashId) => plugin.unmarkAsFavorite(stashId),
      refreshStashesView: refreshStashesView
    }
  };
};
