import PIXI from 'pixi.js';
import { EventEmitter } from '../events/EventEmitter';

export type StateValue = string | number | boolean | object | null | undefined | StateValue[];

export interface GameState {
  [key: string]: StateValue;
}

// Add interfaces for save data
export interface GameSaveData {
  version: string;
  timestamp: number;
  name: string;
  screenshot?: string; // Base64 encoded thumbnail
  gameState: GameState;
  characterStates: Record<string, any>;
  storyProgress: {
    currentNodeId: string;
    visitedNodes: string[];
    completedBranches: string[];
  };
  customData?: Record<string, any>;
}

export class StateManager extends EventEmitter {
  private state: GameState = {};
  private history: GameState[] = [];
  private maxHistorySize: number = 50;
  private gameVersion: string = '1.0.0';
  private autoSaveEnabled: boolean = true;
  private autoSaveInterval: number = 5 * 60 * 1000; // 5 minutes
  private autoSaveTimer: number | null = null;

  // Add namespace support for organizing state
  private namespaces: Set<string> = new Set(['global', 'characters', 'story', 'settings']);

  constructor(initialState: GameState = {}) {
    super();
    this.state = { ...initialState };

    // Start auto-save timer if enabled
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }
  }

  /**
   * Get the current state
   * @returns A copy of the current state
   */
  public getState(): GameState {
    return { ...this.state };
  }

  /**
   * Get a value from the state
   * @param key State key
   * @param defaultValue Default value if key doesn't exist
   */
  public get<T extends StateValue>(key: string, defaultValue?: T): T | undefined {
    return (this.state[key] as T) ?? defaultValue;
  }

  /**
   * Get a value from a specific namespace
   * @param namespace Namespace to get from
   * @param key State key within namespace
   * @param defaultValue Default value if key doesn't exist
   */
  public getNamespaced<T extends StateValue>(
    namespace: string,
    key: string,
    defaultValue?: T
  ): T | undefined {
    const namespaceObj = this.state[namespace] as Record<string, StateValue>;
    if (!namespaceObj || typeof namespaceObj !== 'object') {
      return defaultValue;
    }
    return (namespaceObj[key] as T) ?? defaultValue;
  }

  /**
   * Set a value in the state
   * @param key State key
   * @param value New value
   * @param recordHistory Whether to record this change in history
   */
  public set<T extends StateValue>(key: string, value: T, recordHistory: boolean = true): void {
    const oldValue = this.state[key];

    // Save current state to history
    if (recordHistory) {
      this.pushHistory();
    }

    // Update state
    this.state[key] = value;

    // Emit events
    this.emit('state:change', key, value, oldValue);
    this.emit(`state:change:${key}`, value, oldValue);
  }

  /**
   * Set a value in a specific namespace
   * @param namespace Namespace to set in
   * @param key State key within namespace
   * @param value New value
   * @param recordHistory Whether to record this change in history
   */
  public setNamespaced<T extends StateValue>(
    namespace: string,
    key: string,
    value: T,
    recordHistory: boolean = true
  ): void {
    // Ensure namespace exists
    this.namespaces.add(namespace);

    if (!this.state[namespace] || typeof this.state[namespace] !== 'object') {
      this.state[namespace] = {};
    }

    const namespaceObj = this.state[namespace] as Record<string, StateValue>;
    const oldValue = namespaceObj[key];

    // Save current state to history
    if (recordHistory) {
      this.pushHistory();
    }

    // Update state
    namespaceObj[key] = value;

    // Emit events
    this.emit(`state:${namespace}:change`, key, value, oldValue);
    this.emit(`state:${namespace}:change:${key}`, value, oldValue);
  }

  /**
   * Update multiple values in the state
   * @param changes Object with key-value pairs to update
   * @param recordHistory Whether to record this change in history
   */
  public update(changes: Partial<GameState>, recordHistory: boolean = true): void {
    if (Object.keys(changes).length === 0) return;

    // Save current state to history
    if (recordHistory) {
      this.pushHistory();
    }

    // Update state
    for (const [key, value] of Object.entries(changes)) {
      const oldValue = this.state[key];
      this.state[key] = value;

      // Emit events for each changed key
      this.emit('state:change', key, value, oldValue);
      this.emit(`state:change:${key}`, value, oldValue);
    }

    // Emit a batch update event
    this.emit('state:batch-change', changes);
  }

  /**
   * Update multiple values in a specific namespace
   * @param namespace Namespace to update in
   * @param changes Object with key-value pairs to update
   * @param recordHistory Whether to record this change in history
   */
  public updateNamespaced(
    namespace: string,
    changes: Record<string, StateValue>,
    recordHistory: boolean = true
  ): void {
    if (Object.keys(changes).length === 0) return;

    // Ensure namespace exists
    this.namespaces.add(namespace);

    if (!this.state[namespace] || typeof this.state[namespace] !== 'object') {
      this.state[namespace] = {};
    }

    // Save current state to history
    if (recordHistory) {
      this.pushHistory();
    }

    const namespaceObj = this.state[namespace] as Record<string, StateValue>;

    // Update state
    for (const [key, value] of Object.entries(changes)) {
      const oldValue = namespaceObj[key];
      namespaceObj[key] = value;

      // Emit events for each changed key
      this.emit(`state:${namespace}:change`, key, value, oldValue);
      this.emit(`state:${namespace}:change:${key}`, value, oldValue);
    }

    // Emit a batch update event
    this.emit(`state:${namespace}:batch-change`, changes);
  }

  /**
   * Reset the state to initial values
   * @param initialState New initial state
   */
  public reset(initialState: GameState = {}): void {
    this.pushHistory();
    this.state = { ...initialState };
    this.emit('state:reset', this.state);
  }

  /**
   * Add current state to history
   */
  private pushHistory(): void {
    this.history.push({ ...this.state });

    // Trim history if it exceeds max size
    while (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Undo the last state change
   * @returns True if successful, false if no history available
   */
  public undo(): boolean {
    if (this.history.length === 0) return false;

    this.state = this.history.pop()!;
    this.emit('state:undo', this.state);
    return true;
  }

  /**
   * Set the maximum history size
   * @param size Maximum number of history entries
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;

    // Trim history if it exceeds new max size
    while (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Save the current game state with screenshot and metadata
   * @param saveName Name of the save (optional)
   * @param screenshot Base64 encoded screenshot (optional)
   * @param characterStates Character states to save
   * @param storyProgress Story progress information
   * @param customData Any additional data to save
   * @returns The save data object
   */
  public async saveGame(
    saveName?: string,
    screenshot?: string,
    characterStates?: Record<string, any>,
    storyProgress?: {
      currentNodeId: string;
      visitedNodes: string[];
      completedBranches: string[];
    },
    customData?: Record<string, any>
  ): Promise<GameSaveData> {
    // Create save data object
    const saveData: GameSaveData = {
      version: this.gameVersion,
      timestamp: Date.now(),
      name: saveName || `Save ${new Date().toLocaleString()}`,
      screenshot: screenshot,
      gameState: { ...this.state },
      characterStates: characterStates || {},
      storyProgress: storyProgress || {
        currentNodeId: this.getNamespaced('story', 'currentNodeId', '') as string,
        visitedNodes: this.getNamespaced('story', 'visitedNodes', []) as string[],
        completedBranches: this.getNamespaced('story', 'completedBranches', []) as string[]
      },
      customData: customData || {}
    };

    // Generate a unique save ID if none provided
    const saveId = saveName || `save_${Date.now()}`;

    try {
      // Save to localStorage
      localStorage.setItem(`game_save_${saveId}`, JSON.stringify(saveData));

      // Emit save event
      this.emit('state:save', saveId, saveData);

      return saveData;
    } catch (error) {
      console.error('Failed to save game:', error);
      this.emit('state:save-error', error);
      throw error;
    }
  }

  /**
   * Load a saved game state
   * @param saveId ID of the save to load
   * @returns The loaded save data, or null if not found
   */
  public loadGame(saveId: string): GameSaveData | null {
    try {
      // Get save from localStorage
      const saveData = localStorage.getItem(`game_save_${saveId}`);
      if (!saveData) {
        console.warn(`Save '${saveId}' not found`);
        return null;
      }

      // Parse save data
      const parsedSaveData = JSON.parse(saveData) as GameSaveData;

      // Version check (simplified)
      if (parsedSaveData.version !== this.gameVersion) {
        console.warn(`Save version mismatch: ${parsedSaveData.version} vs ${this.gameVersion}`);
        // Could implement migration here if needed
      }

      // Update current state
      this.pushHistory(); // Save current state to history
      this.state = { ...parsedSaveData.gameState };

      // Emit load events
      this.emit('state:load', saveId, parsedSaveData);

      return parsedSaveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      this.emit('state:load-error', error);
      return null;
    }
  }

  /**
   * Get all available save files
   * @returns Array of save metadata
   */
  public getSaveFiles(): { id: string; data: GameSaveData }[] {
    const saves: { id: string; data: GameSaveData }[] = [];

    try {
      // Iterate through localStorage to find save files
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('game_save_')) {
          const saveId = key.replace('game_save_', '');
          const saveData = localStorage.getItem(key);
          if (saveData) {
            saves.push({
              id: saveId,
              data: JSON.parse(saveData) as GameSaveData
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      saves.sort((a, b) => b.data.timestamp - a.data.timestamp);

      return saves;
    } catch (error) {
      console.error('Failed to get save files:', error);
      return [];
    }
  }

  /**
   * Delete a saved game
   * @param saveId ID of the save to delete
   * @returns True if successful, false otherwise
   */
  public deleteSave(saveId: string): boolean {
    try {
      localStorage.removeItem(`game_save_${saveId}`);
      this.emit('state:delete-save', saveId);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Take a screenshot of the game for save thumbnails
   * @param app The PIXI application
   * @param width Width of the screenshot
   * @param height Height of the screenshot
   * @returns Base64 encoded screenshot
   */
  public async takeScreenshot(
    app: PIXI.Application,
    width: number = 320,
    height: number = 180
  ): Promise<string | null> {
    try {
      return await app.renderer.extract.base64(app.stage, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return null;
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = window.setInterval(() => {
      if (this.autoSaveEnabled) {
        this.saveGame('autosave')
          .then(() => console.log('Auto-save complete'))
          .catch((err) => console.error('Auto-save failed:', err));
      }
    }, this.autoSaveInterval);
  }

  /**
   * Enable or disable auto-save
   */
  public setAutoSave(enabled: boolean): void {
    this.autoSaveEnabled = enabled;

    if (enabled && this.autoSaveTimer === null) {
      this.startAutoSave();
    } else if (!enabled && this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    this.setNamespaced('settings', 'autoSave', enabled);
  }

  /**
   * Set auto-save interval
   * @param minutes Minutes between auto-saves
   */
  public setAutoSaveInterval(minutes: number): void {
    this.autoSaveInterval = minutes * 60 * 1000;

    // Restart timer with new interval
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }

    this.setNamespaced('settings', 'autoSaveInterval', minutes);
  }

  /**
   * Check if a state value meets a condition
   * @param key State key
   * @param operator Comparison operator
   * @param value Value to compare against
   */
  public checkCondition(
    key: string,
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'startsWith' | 'endsWith',
    value: StateValue
  ): boolean {
    const stateValue = this.get(key);

    switch (operator) {
      case '==':
        return stateValue === value;
      case '!=':
        return stateValue !== value;
      case '>':
        return (stateValue as number) > (value as number);
      case '>=':
        return (stateValue as number) >= (value as number);
      case '<':
        return (stateValue as number) < (value as number);
      case '<=':
        return (stateValue as number) <= (value as number);
      case 'contains':
        if (Array.isArray(stateValue)) {
          return stateValue.includes(value);
        } else if (typeof stateValue === 'string') {
          return stateValue.includes(value as string);
        }
        return false;
      case 'startsWith':
        return typeof stateValue === 'string' && stateValue.startsWith(value as string);
      case 'endsWith':
        return typeof stateValue === 'string' && stateValue.endsWith(value as string);
      default:
        return false;
    }
  }

  /**
   * Check if a namespaced state value meets a condition
   */
  public checkNamespacedCondition(
    namespace: string,
    key: string,
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'startsWith' | 'endsWith',
    value: StateValue
  ): boolean {
    const stateValue = this.getNamespaced(namespace, key);

    switch (operator) {
      case '==':
        return stateValue === value;
      case '!=':
        return stateValue !== value;
      case '>':
        return (stateValue as number) > (value as number);
      case '>=':
        return (stateValue as number) >= (value as number);
      case '<':
        return (stateValue as number) < (value as number);
      case '<=':
        return (stateValue as number) <= (value as number);
      case 'contains':
        if (Array.isArray(stateValue)) {
          return stateValue.includes(value);
        } else if (typeof stateValue === 'string') {
          return stateValue.includes(value as string);
        }
        return false;
      case 'startsWith':
        return typeof stateValue === 'string' && stateValue.startsWith(value as string);
      case 'endsWith':
        return typeof stateValue === 'string' && stateValue.endsWith(value as string);
      default:
        return false;
    }
  }

  /**
   * Clear state and history
   */
  public clearState(): void {
    this.state = {};
    this.history = [];

    // Clear auto-save timer
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    this.emit('state:clear');
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    this.clearState();
    this.clear();
  }
}
