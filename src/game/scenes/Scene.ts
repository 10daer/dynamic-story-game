import * as PIXI from 'pixi.js';
import { EventEmitter } from '../../core/events/EventEmitter';
import { Game } from '../../game/Game';

export abstract class Scene extends EventEmitter {
  protected container: PIXI.Container;
  protected game: Game;
  protected isActive: boolean = false;

  constructor(game: Game) {
    super();
    this.game = game;
    this.container = new PIXI.Container();
  }

  /**
   * Initialize the scene
   * This is called once when the scene is first created
   */
  public abstract init(): Promise<void>;

  /**
   * Enter the scene
   * This is called each time the scene becomes active
   */
  public async enter(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;
    this.game.getStage().addChild(this.container);
    this.emit('scene:enter');
  }

  /**
   * Exit the scene
   * This is called each time the scene becomes inactive
   */
  public async exit(): Promise<void> {
    if (!this.isActive) return;

    this.isActive = false;
    this.game.getStage().removeChild(this.container);
    this.emit('scene:exit');
  }

  /**
   * Update the scene
   * @param deltaTime Time elapsed since last frame
   * @param elapsedTime Time elapsed since last update
   */
  public update(deltaTime: number, elapsedTime: number): void {
    if (!this.isActive) return;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.container.destroy({ children: true });
    this.clear(); // Clear all event listeners
  }

  /**
   * Get the scene container
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }

  /**
   * Check if the scene is active
   */
  public isActiveScene(): boolean {
    return this.isActive;
  }
}
