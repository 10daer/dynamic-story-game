import * as PIXI from 'pixi.js';
import { AnimationManager } from '../core/animations/AnimationManager';
import { StoryAnimator } from '../core/animations/StoryAnimator';
import { AssetManager } from '../core/assets/Assetmanager';
import { EventEmitter } from '../core/events/EventEmitter';
import { StateManager } from '../core/state/StateManager';
import { StoryManager } from '../core/story/StoryManager';
import { SceneManager } from '../game/scenes/SceneManager';
import {
  CharacterConfig,
  CharacterData,
  CharacterPosition,
  CharacterState
} from './characters/CharacterData';
import { CharacterManager } from './characters/CharacterManager';
import { CharacterStateManager } from './characters/CharacterStateManager';
import { DialogueManager } from './dialogue/DialogueManager';

export class Game extends EventEmitter {
  private app: PIXI.Application;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  // Add to Game class
  public animationManager: AnimationManager;
  public assetManager: AssetManager;
  public sceneManager: SceneManager;
  public stateManager: StateManager;
  public characterManager: CharacterManager;
  public dialogueManager: DialogueManager;
  private storyManager: StoryManager;
  public characterStateManager: CharacterStateManager;
  private storyAnimator: StoryAnimator;

  constructor(
    options: {
      width?: number;
      height?: number;
      backgroundColor?: number;
      containerId?: string;
    } = {}
  ) {
    super();

    const defaultOptions = {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      containerId: 'game-container'
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Initialize in constructor
    this.animationManager = new AnimationManager();

    // Create PIXI application
    this.app = new PIXI.Application({
      width: finalOptions.width,
      height: finalOptions.height,
      backgroundColor: finalOptions.backgroundColor,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1
    });

    // Create container if it doesn't exist
    let container = document.getElementById(finalOptions.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = finalOptions.containerId;
      document.body.appendChild(container);
    }

    // Add canvas to container
    container.appendChild(this.app.view as HTMLCanvasElement);

    // Initialize managers
    this.assetManager = new AssetManager();
    this.sceneManager = new SceneManager(this);
    this.stateManager = new StateManager();
    this.characterManager = new CharacterManager(this);
    this.characterStateManager = new CharacterStateManager(this.stateManager);
    this.storyAnimator = new StoryAnimator(this);
    this.storyManager = new StoryManager(this.sceneManager, this.storyAnimator);
    this.dialogueManager = new DialogueManager(this, this.storyManager, this.storyAnimator);

    // Setup resize handler
    window.addEventListener('resize', this.handleResize.bind(this));

    // Setup save/load event handlers
    this.setupSaveLoadHandlers();

    // Setup game loop
    this.app.ticker.add(this.update.bind(this));
  }

  /**
   * Setup handlers for save and load events
   */
  private setupSaveLoadHandlers(): void {
    // When state is about to be saved, gather character states
    this.stateManager.on('state:save', (saveId, saveData) => {
      // Export character states to save data
      saveData.characterStates = this.characterStateManager.exportForSave();

      // Add story progress info
      if (this.storyManager) {
        saveData.storyProgress = {
          currentNodeId: this.storyManager.getCurrentNode()?.getId(),
          visitedNodes: this.storyManager.getVisitedNodes(),
          completedBranches: this.storyManager.getCompletedBranches()
        };
      }

      // Take a screenshot if not provided
      if (!saveData.screenshot) {
        saveData.screenshot = this.stateManager.takeScreenshot(this.app);
      }
    });

    // When state is loaded, restore character states
    this.stateManager.on('state:load', (saveId, saveData) => {
      // Restore character states
      if (saveData.characterStates) {
        this.characterStateManager.loadFromSaveData(saveData.characterStates);
      }

      // Restore story progress
      if (saveData.storyProgress && this.storyManager) {
        this.storyManager.loadProgress(
          saveData.storyProgress.currentNodeId,
          saveData.storyProgress.visitedNodes,
          saveData.storyProgress.completedBranches
        );
      }

      // Emit game load event
      this.emit('game:loaded', saveId, saveData);
    });
  }

  /**
   * Start the game
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.emit('game:start');
  }

  /**
   * Stop the game
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.emit('game:stop');
  }

  /**
   * getter for SceneManager so DialogueManager can access it
   * @returns the sceneManager
   */
  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * Main update loop
   * @param deltaTime Time elapsed since last frame in milliseconds
   */
  private update(deltaTime: number): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const elapsedTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update managers
    this.sceneManager.update(deltaTime, elapsedTime);
    this.characterManager.update(deltaTime);
    // this.characterStateManager.update(dt);
    // this.animationManager.update(dt);

    // Emit update event
    this.emit('game:update', deltaTime, elapsedTime);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Notify scene manager of resize
    // this.sceneManager.handleResize(window.innerWidth, window.innerHeight);

    this.app.renderer.resize(width, height);
    this.emit('game:resize', width, height);
  }

  /**
   * Save the current game state
   */
  public async saveGame(saveName?: string): Promise<any> {
    // Take a screenshot
    const screenshot = await this.stateManager.takeScreenshot(this.app);

    // Save game state
    return this.stateManager.saveGame(saveName, screenshot || undefined);
  }

  /**
   * Load a saved game
   */
  public loadGame(saveId: string): any {
    return this.stateManager.loadGame(saveId);
  }

  /**
   * Get list of available saves
   */
  public getSaveFiles() {
    return this.stateManager.getSaveFiles();
  }

  /**
   * Delete a saved game
   */
  public deleteSave(saveId: string): boolean {
    return this.stateManager.deleteSave(saveId);
  }

  /**
   * Get the StoryManager instance
   */
  public getStoryManager(): StoryManager {
    return this.storyManager;
  }

  /**
   * Load a story from file or data
   */
  public async loadStory(source: string, type: 'yaml' | 'json' = 'yaml'): Promise<void> {
    try {
      // Load story file
      const storyData = await this.assetManager.loadText(source);

      // Parse story based on type
      if (type === 'yaml') {
        this.storyManager.loadFromYaml(storyData);
      } else {
        this.storyManager.loadFromJson(storyData);
      }

      // Start story
      this.storyManager.start();

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to load story:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Add a character to the game
   */
  public addCharacter(id: string, config: CharacterConfig): void {
    const characterData: CharacterData = {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      description: config.description,
      defaultEmotion: config.defaultEmotion,
      poses: config.poses,
      scale: config.scale,
      speechColor: config.speechColor,
      speechFont: config.speechFont,
      meta: config.meta
    };

    // Register character with CharacterManager
    this.characterManager.registerCharacter(characterData);

    // Create the character instance
    this.characterManager.createCharacter(id).then((character) => {
      if (!character) {
        console.error(`Failed to create character: ${id}`);
        return;
      }

      // Initialize character state in CharacterStateManager
      const initialState: CharacterState = {
        id: id,
        currentEmotion: config.currentEmotion || 'neutral',
        position: config.position || CharacterPosition.CENTER,
        isVisible: false,
        currentAnimation: config.currentAnimation,
        customState: {
          flags: {},
          relationshipValues: {}
        }
      };

      this.characterStateManager.initializeCharacter(id, initialState);

      // Set initial character state if provided
      if (config.customState) {
        // Add character specific stat.customStatees/flags to the state
        for (const [stateName, stateValue] of Object.entries(config.customState)) {
          // For flags, store in the flags object
          if (
            typeof stateValue === 'boolean' ||
            typeof stateValue === 'number' ||
            typeof stateValue === 'string'
          ) {
            const updatedState = { ...initialState };
            updatedState.customState.flags[stateName] = stateValue;
            this.characterStateManager.updateCharacterState(id, updatedState);
          }
          // For relationship values, store in the relationshipValues object
          else if (stateName.startsWith('relationship_')) {
            const updatedState = { ...initialState };
            const targetCharacter = stateName.replace('relationship_', '');
            updatedState.customState.relationshipValues[targetCharacter] = stateValue;
            this.characterStateManager.updateCharacterState(id, updatedState);
          }
        }
      }

      // Set default emotion if provided
      if (config.defaultEmotion && typeof config.defaultEmotion === 'string') {
        this.characterStateManager.setCharacterEmotion(id, config.defaultEmotion);
      }

      // Emit character added event
      this.emit('character:added', id, character);
    });
  }

  /**
   * Reset the game to initial state
   */
  public reset(): void {
    // Reset story
    this.storyManager.reset();

    // Reset character states
    this.characterStateManager.reset();

    // Reset game state
    this.stateManager.reset();

    // Emit reset event
    this.emit('game:reset');
  }

  /**
   * Get PIXI application instance
   */
  public getApp(): PIXI.Application {
    return this.app;
  }

  /**
   * Get stage instance
   */
  public getStage(): PIXI.Container {
    return this.app.stage;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Stop the game
    this.stop();
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    this.emit('game:destroy');
    this.clear(); // Clear all event listeners
  }
}
