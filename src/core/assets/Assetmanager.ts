import { Howl } from 'howler';
import * as PIXI from 'pixi.js';
import { EventEmitter } from '../events/EventEmitter';

export type AssetType = 'image' | 'audio' | 'json' | 'text' | 'font';

export interface AssetItem {
  key: string;
  url: string;
  type: AssetType;
  metadata?: any;
}

export class AssetManager extends EventEmitter {
  private assets: Map<string, any> = new Map();
  private loadingProgress: number = 0;
  private isLoading: boolean = false;

  constructor() {
    super();

    // Add custom loaders
    PIXI.Assets.init({});
  }

  /**
   * Queue assets for loading
   * @param assets Array of assets to load
   */
  public queue(assets: AssetItem[]): void {
    for (const asset of assets) {
      PIXI.Assets.add(asset.key, asset.url);
    }
  }

  /**
   * Load all queued assets
   * @param assetsToLoad Array of assets to load
   * @param useLoadingManager Whether to use the loading manager (default: true)
   * @returns Promise that resolves when all assets are loaded
   */
  public async loadAll(
    assetsToLoad: AssetItem[],
    useLoadingManager: boolean = true
  ): Promise<void> {
    if (this.isLoading) {
      console.warn('Assets are already loading');
      return;
    }

    this.isLoading = true;
    this.loadingProgress = 0;
    this.emit('loading:start');

    try {
      const totalAssets = assetsToLoad.length;
      let loadedCount = 0;

      const updateProgress = () => {
        loadedCount += 1;
        this.loadingProgress = loadedCount / totalAssets;
        this.emit('loading:progress', this.loadingProgress);
      };

      // Helper to check if asset exists
      const assetExists = async (url: string): Promise<boolean> => {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          return response.ok;
        } catch (e) {
          console.warn(`HEAD check failed for ${url}`, e);
          return false;
        }
      };

      const imageAssets = assetsToLoad.filter((asset) => asset.type === 'image');

      for (const asset of imageAssets) {
        const exists = await assetExists(asset.url);
        if (!exists) {
          console.warn(`Image not found: ${asset.url}`);
          updateProgress(); // Still update progress for missing ones
          continue;
        }

        PIXI.Assets.add({ alias: asset.key, src: asset.url });

        try {
          const texture = await PIXI.Assets.load(asset.url);
          this.assets.set(asset.key, texture);
        } catch (e) {
          console.error(`Failed to load image: ${asset.key}`, e);
        }

        updateProgress();
      }

      console.log('Successfully loaded all image assets');

      // Audio loading with existence checking
      const audioAssetExists = async (url: string, expectedType: string): Promise<boolean> => {
        try {
          const res = await fetch(url, { method: 'HEAD' });
          const contentType = res.headers.get('Content-Type') || '';
          return res.ok && contentType.startsWith(expectedType);
        } catch (e) {
          console.warn(`HEAD check failed for ${url}`, e);
          return false;
        }
      };

      // Load audio assets using Howler
      const audioAssets = assetsToLoad.filter((asset) => asset.type === 'audio');

      await Promise.all(
        audioAssets.map(async (asset) => {
          // const exists = await audioAssetExists(asset.url, 'audio/');
          // if (!exists) {
          //   console.warn(`Audio not found or invalid type: ${asset.url}`);
          //   updateProgress();
          //   return;
          // }

          return new Promise<void>((resolve, reject) => {
            const sound = new Howl({
              src: [asset.url],
              format: ['mp3', 'ogg', 'wav'],
              html5: true,
              pool: 5,
              onload: () => {
                this.assets.set(asset.key, sound);
                updateProgress();
                resolve();
              },
              onloaderror: (_, err) => {
                console.error(`Failed to load audio: ${asset.key}`, err);
                updateProgress();
                reject();
              }
            });
          });
        })
      );

      this.loadingProgress = 1; // Set to 100%
      this.isLoading = false;
      this.emit('loading:complete', this.assets);
    } catch (error) {
      this.isLoading = false;
      this.emit('loading:error', error);
      throw error;
    }
  }

  /**
   * Load assets using the LoadingManager
   * @param assetsToLoad Array of assets to load
   * @param loadingOptions Optional loading options
   * @returns Promise that resolves when all assets are loaded
   */
  public async loadWithManager(
    game: any, // Game instance
    assetsToLoad: AssetItem[],
    loadingOptions: any = {}
  ): Promise<void> {
    if (!game.loadingManager) {
      console.warn('LoadingManager not available, falling back to standard loading');
      return this.loadAll(assetsToLoad, false);
    }

    const defaultOptions = {
      title: 'Loading Assets...',
      showProgressBar: true,
      switchToSceneAfter: '',
      minLoadTime: 500
    };

    const options = { ...defaultOptions, ...loadingOptions };

    // Create a load function for the loading manager
    const loadAssets = async () => {
      return this.loadAll(assetsToLoad, false);
    };

    // Queue the loading operation
    game.loadingManager.queue('assets', loadAssets);

    // Start loading
    await game.loadingManager.startLoading(options);
  }

  /**
   * Load a text file from the given source.
   * @param source The URL or path to the text file.
   * @returns A promise that resolves with the text content.
   */
  public async loadText(source: string): Promise<string> {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to load text from ${source}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error loading text asset: ${error}`);
      throw error;
    }
  }

  /**
   * Get a loaded asset
   * @param key Asset key
   * @returns The loaded asset or undefined if not found
   */
  public get<T = any>(key: string): T | undefined {
    return this.assets.get(key) as T | undefined;
  }

  /**
   * Check if an asset is loaded
   * @param key Asset key
   * @returns True if the asset is loaded
   */
  public has(key: string): boolean {
    return this.assets.has(key);
  }

  /**
   * Get the current loading progress
   * @returns Loading progress (0-100)
   */
  public getProgress(): number {
    return this.loadingProgress;
  }

  /**
   * Clear all loaded assets
   */
  public clear(): void {
    this.assets.clear();
  }
}
