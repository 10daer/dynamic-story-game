import { EventEmitter } from '../../core/events/EventEmitter';
import { FadeTransition } from '../../core/transitions/FadeTransition';
import { SlideTransition } from '../../core/transitions/SlideTransition';
import { Game } from '../../game/Game';
import { Scene } from './Scene';

export class SceneManager extends EventEmitter {
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private game: Game;
  private transitions: Map<string, (from: Scene | null, to: Scene) => Promise<void>> = new Map();

  constructor(game: Game) {
    super();
    this.game = game;

    // Add default transition
    this.transitions.set('default', this.defaultTransition.bind(this));

    // Create single instances of each transition type with proper parameters
    const fadeTransition = new FadeTransition();
    const slideLeftTransition = new SlideTransition('left');
    const slideRightTransition = new SlideTransition('right');
    const slideUpTransition = new SlideTransition('up');
    const slideDownTransition = new SlideTransition('down');

    // Store transition functions that properly maintain 'this' context
    this.transitions.set('fade', (currentScene, nextScene) =>
      fadeTransition.execute(this.game, currentScene, nextScene)
    );

    this.transitions.set('slideLeft', (currentScene, nextScene) =>
      slideLeftTransition.execute(this.game, currentScene, nextScene)
    );

    this.transitions.set('slideRight', (currentScene, nextScene) =>
      slideRightTransition.execute(this.game, currentScene, nextScene)
    );

    this.transitions.set('slideUp', (currentScene, nextScene) =>
      slideUpTransition.execute(this.game, currentScene, nextScene)
    );

    this.transitions.set('slideDown', (currentScene, nextScene) =>
      slideDownTransition.execute(this.game, currentScene, nextScene)
    );
    this.on('scene:changed', (_: Scene, newScene: Scene) => {
      // Handle character visibility for StoryScene
      if (newScene && newScene.constructor.name === 'StoryScene') {
        const activeCharacters = this.game.characterManager.getAllCharacters();

        for (const [characterId, _] of activeCharacters) {
          const character = this.game.characterManager.getCharacter(characterId);
          if (character && character.getState().isVisible) {
            this.emit('character:show', characterId);
          }
        }
      }
    });
  }

  /**
   * Register a scene
   * @param key Scene identifier
   * @param scene Scene instance
   */
  public register(key: string, scene: Scene): void {
    if (this.scenes.has(key)) {
      console.warn(`Scene with key "${key}" already exists and will be overwritten`);
    }

    this.scenes.set(key, scene);
    this.emit('scene:registered', key, scene);
  }

  /**
   * Switch to a scene
   * @param key Scene identifier
   * @param transitionKey Optional transition key
   */
  public async switchTo(key: string, transitionKey: string = 'default'): Promise<void> {
    try {
      if (!this.scenes.has(key)) {
        throw new Error(`Scene with key "${key}" does not exist`);
      }

      // Get the next scene
      const nextScene = this.scenes.get(key)!;

      // Make sure to properly exit ALL other scenes
      for (const [sceneKey, scene] of this.scenes.entries()) {
        if (sceneKey !== key && scene.isActiveScene()) {
          await scene.exit();
        }
      }

      // Initialize the scene if needed - BEFORE any transitions start
      if (!nextScene.isActiveScene()) {
        await nextScene.init();
      }

      // Check if we're trying to switch to the same scene
      if (this.currentScene === nextScene) {
        console.warn(`Already in scene "${key}", ignoring redundant switchTo`);
        return;
      }

      // Get transition function
      const transition = this.transitions.get(transitionKey) || this.transitions.get('default')!;

      // Emit before change event
      this.emit('scene:before-change', this.currentScene, nextScene);

      try {
        // Perform transition - await the result to handle any errors
        await transition(this.currentScene, nextScene);

        // Store previous scene reference
        const previousScene = this.currentScene;

        // Update current scene reference
        this.currentScene = nextScene;

        // Ensure previous scene is properly removed from stage if it exists
        if (previousScene && previousScene !== nextScene) {
          // Remove from stage if it's still there
          if (previousScene.getContainer().parent) {
            previousScene.getContainer().parent.removeChild(previousScene.getContainer());
          }
        }

        // Emit changed event
        this.emit('scene:changed', previousScene, this.currentScene);
      } catch (transitionError) {
        console.error('Scene transition failed:', transitionError);

        // Fallback to default transition in case of failure
        if (transitionKey !== 'default') {
          console.warn('Attempting fallback to default transition');
          await this.transitions.get('default')!(this.currentScene, nextScene);
          this.currentScene = nextScene;
          this.emit('scene:changed', this.currentScene, nextScene);
        } else {
          // If even the default transition fails, force the scene change
          if (this.currentScene && this.currentScene.getContainer().parent) {
            this.currentScene.getContainer().parent.removeChild(this.currentScene.getContainer());
          }
          this.currentScene = nextScene;
          await nextScene.enter();
          this.game.getStage().addChild(nextScene.getContainer());
          this.emit('scene:changed', this.currentScene, nextScene);
        }
      }
    } catch (error) {
      console.error('Failed to switch scene:', error);
      throw error; // Re-throw to maintain promise rejection chain
    }
  }

  /**
   * Register a transition
   * @param key Transition identifier
   * @param transitionFn Transition function
   */
  public registerTransition(
    key: string,
    transitionFn: (from: Scene | null, to: Scene) => Promise<void>
  ): void {
    this.transitions.set(key, transitionFn);
  }

  /**
   * Default transition
   * @param from Scene transitioning from
   * @param to Scene transitioning to
   */
  private async defaultTransition(from: Scene | null, to: Scene): Promise<void> {
    if (from) {
      await from.exit();
    }

    await to.enter();
  }

  /**
   * Update the current scene
   * @param deltaTime Time elapsed since last frame
   * @param elapsedTime Time elapsed since last update
   */
  public update(deltaTime: number, elapsedTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime, elapsedTime);
    }
  }

  /**
   * Get the current scene
   */
  public getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  // Add this method to your SceneManager class in SceneManager.ts
  /**
   * Change background for the current scene
   * @param backgroundId The ID of the background to display
   */
  public changeBackground(backgroundId: string): void {
    // Get the current scene
    const currentScene = this.getCurrentScene();

    // If there's no current scene, log a warning and return
    if (!currentScene) {
      console.warn('No active scene to change background for');
      return;
    }

    // Emit the background change event for the scene to handle
    this.game.emit('background:change', backgroundId);
  }

  /**
   * Get a scene by key
   * @param key Scene identifier
   */
  public getScene(key: string): Scene | undefined {
    return this.scenes.get(key);
  }

  /**
   * Check if a scene exists
   * @param key Scene identifier
   */
  public hasScene(key: string): boolean {
    return this.scenes.has(key);
  }

  /**
   * Clean up all scenes
   */
  public destroy(): void {
    for (const scene of this.scenes.values()) {
      scene.destroy();
    }

    this.scenes.clear();
    this.currentScene = null;
    this.clear(); // Clear all event listeners
  }
}
