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
    if (!this.scenes.has(key)) {
      throw new Error(`Scene with key "${key}" does not exist`);
    }

    const nextScene = this.scenes.get(key)!;

    // Initialize the scene if needed
    if (!nextScene.isActiveScene()) {
      await nextScene.init();
    }

    // Get transition function
    const transition = this.transitions.get(transitionKey) || this.transitions.get('default')!;

    // Perform transition
    this.emit('scene:before-change', this.currentScene, nextScene);
    await transition(this.currentScene, nextScene);

    const previousScene = this.currentScene;
    this.currentScene = nextScene;

    this.emit('scene:changed', previousScene, this.currentScene);
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
