import { EventEmitter } from '../../core/events/EventEmitter';
import { Game } from '../Game';

export interface LoadingOptions {
  title?: string;
  showProgressBar?: boolean;
  minLoadTime?: number; // Minimum time to show loading screen (ms)
  switchToSceneAfter?: string; // Scene to switch to when loading completes
  transitionEffect?: string; // Effect to use when switching scenes
}

export class LoadingManager extends EventEmitter {
  private game: Game;
  private isLoading: boolean = false;
  private progress: number = 0;
  private totalItems: number = 0;
  private loadedItems: number = 0;
  private startTime: number = 0;
  private defaultOptions: LoadingOptions = {
    title: 'Loading...',
    showProgressBar: true,
    minLoadTime: 500,
    switchToSceneAfter: '',
    transitionEffect: 'fade'
  };
  private currentOptions: LoadingOptions = { ...this.defaultOptions };
  private customData: Record<string, any> = {};
  private itemsToLoad: Array<{ key: string; loadFn: () => Promise<any> }> = [];

  constructor(game: Game) {
    super();
    this.game = game;
  }

  /**
   * Start a loading operation
   * @param options Loading options
   */
  public async startLoading(options: LoadingOptions = {}): Promise<void> {
    if (this.isLoading) {
      console.warn('LoadingManager: Loading already in progress');
      return;
    }

    // Reset state
    this.progress = 0;
    this.loadedItems = 0;
    this.totalItems = this.itemsToLoad.length;
    this.currentOptions = { ...this.defaultOptions, ...options };
    this.startTime = performance.now();
    this.isLoading = true;

    // Emit loading start event
    this.emit('loading:start', this.currentOptions);

    // Switch to loading scene if not already there
    const currentScene = this.game.sceneManager.getCurrentScene();
    if (!currentScene) {
      await this.game.sceneManager.switchTo('loading');
    }

    // Pass loading information to the loading scene
    const loadingScene = this.game.sceneManager.getScene('loading');
    if (
      loadingScene != null &&
      'setData' in loadingScene &&
      typeof loadingScene.setData === 'function'
    ) {
      loadingScene.setData({
        title: this.currentOptions.title,
        showProgressBar: this.currentOptions.showProgressBar,
        customData: this.customData
      });
    } else {
      console.warn("LoadingManager: 'setData' method is not available on the loading scene.");
    }

    // Start processing queued items
    if (this.totalItems > 0) {
      await this.processQueue();
    } else {
      await this.finishLoading();
    }
  }

  /**
   * Queue an item to be loaded
   * @param key Unique key for the item
   * @param loadFn Function that returns a promise to load the item
   */
  public queue(key: string, loadFn: () => Promise<any>): void {
    this.itemsToLoad.push({ key, loadFn });
  }

  /**
   * Queue multiple items to be loaded
   * @param items Array of items to load
   */
  public queueMultiple(items: Array<{ key: string; loadFn: () => Promise<any> }>): void {
    this.itemsToLoad.push(...items);
  }

  /**
   * Clear the loading queue
   */
  public clearQueue(): void {
    this.itemsToLoad = [];
  }

  /**
   * Set custom data to be passed to the loading scene
   * @param key Data key
   * @param value Data value
   */
  public setCustomData(key: string, value: any): void {
    this.customData[key] = value;
  }

  /**
   * Update loading progress manually
   * @param value Progress value (0-1)
   */
  public updateProgress(value: number): void {
    this.progress = Math.max(0, Math.min(1, value));
    this.emit('loading:progress', this.progress);
  }

  /**
   * Get current loading progress
   * @returns Progress value (0-1)
   */
  public getProgress(): number {
    return this.progress;
  }

  /**
   * Check if loading is in progress
   * @returns True if loading is in progress
   */
  public isInProgress(): boolean {
    return this.isLoading;
  }

  /**
   * Process the loading queue
   */
  private async processQueue(): Promise<void> {
    const itemsToProcess = [...this.itemsToLoad];
    this.itemsToLoad = [];

    for (const item of itemsToProcess) {
      try {
        await item.loadFn();
        this.loadedItems++;
        this.progress = this.loadedItems / this.totalItems;
        this.emit('loading:progress', this.progress, item.key);
      } catch (error) {
        console.error(`LoadingManager: Failed to load item '${item.key}'`, error);
        this.emit('loading:error', item.key, error);
      }
    }

    await this.finishLoading();
  }

  /**
   * Finish the loading process
   */
  private async finishLoading(): Promise<void> {
    // Ensure minimum loading time if specified
    const elapsed = performance.now() - this.startTime;
    const minTime = this.currentOptions.minLoadTime || 0;

    if (elapsed < minTime) {
      await new Promise((resolve) => setTimeout(resolve, minTime - elapsed));
    }

    // Set progress to 100%
    this.updateProgress(1);

    // Reset state
    this.isLoading = false;
    this.progress = 0;
    this.loadedItems = 0;
    this.totalItems = 0;

    // Emit completion event
    this.emit('loading:complete');

    // Switch to specified scene if provided
    if (this.currentOptions.switchToSceneAfter) {
      await this.game.sceneManager.switchTo(
        this.currentOptions.switchToSceneAfter,
        this.currentOptions.transitionEffect
      );
    }
  }
}
