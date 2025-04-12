import * as PIXI from 'pixi.js';
import { EventEmitter } from '../../../core/events/EventEmitter';

export abstract class BaseComponent extends EventEmitter {
  protected container: PIXI.Container;
  protected isVisible: boolean = true;
  protected isInteractive: boolean = false;

  constructor() {
    super();
    this.container = new PIXI.Container();
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public setPosition(x: number, y: number): this {
    this.container.position.set(x, y);
    return this;
  }

  public setScale(x: number, y: number = x): this {
    this.container.scale.set(x, y);
    return this;
  }

  public setAlpha(alpha: number): this {
    this.container.alpha = alpha;
    return this;
  }

  public setVisible(visible: boolean): this {
    this.isVisible = visible;
    this.container.visible = visible;
    return this;
  }

  public isComponentVisible(): boolean {
    return this.isVisible;
  }

  public setInteractive(interactive: boolean): this {
    this.isInteractive = interactive;
    return this;
  }

  public abstract update(delta: number): void;

  public destroy(): void {
    this.container.destroy({ children: true });
    this.clear(); // Clear event listeners
  }
}
