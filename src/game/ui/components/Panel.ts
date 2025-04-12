import * as PIXI from 'pixi.js';
import { BaseComponent } from './BaseComponent';

export interface PanelOptions {
  width: number;
  height: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  borderColor?: number;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  draggable?: boolean;
}

export class Panel extends BaseComponent {
  private background: PIXI.Graphics;
  private contentContainer: PIXI.Container;
  private options: PanelOptions;
  private isDragging: boolean = false;
  private dragOffset: PIXI.Point = new PIXI.Point();

  constructor(options: PanelOptions) {
    super();

    this.options = {
      backgroundColor: 0x222222,
      backgroundAlpha: 0.8,
      borderColor: 0x444444,
      borderWidth: 2,
      borderRadius: 10,
      padding: 10,
      draggable: false,
      ...options
    };

    this.background = new PIXI.Graphics();
    this.container.addChild(this.background);

    this.contentContainer = new PIXI.Container();
    this.container.addChild(this.contentContainer);

    this.draw();

    if (this.options.draggable) {
      this.setupDraggable();
    }
  }

  private draw(): void {
    const {
      width,
      height,
      backgroundColor,
      backgroundAlpha,
      borderColor,
      borderWidth,
      borderRadius,
      padding
    } = this.options;

    this.background.clear();

    // Draw border if needed
    if (borderWidth && borderWidth > 0) {
      this.background.lineStyle(borderWidth, borderColor!, 1);
    }

    // Draw background
    this.background.beginFill(backgroundColor!, backgroundAlpha);
    this.background.drawRoundedRect(0, 0, width, height, borderRadius!);
    this.background.endFill();

    // Position content container with padding
    this.contentContainer.position.set(padding!, padding!);
  }

  private setupDraggable(): void {
    this.background.eventMode = 'static';
    this.background.cursor = 'move';

    this.background.on('pointerdown', this.onDragStart, this);
    this.background.on('pointerup', this.onDragEnd, this);
    this.background.on('pointerupoutside', this.onDragEnd, this);
    this.background.on('pointermove', this.onDragMove, this);
  }

  private onDragStart(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = true;
    this.dragOffset.set(
      event.global.x - this.container.position.x,
      event.global.y - this.container.position.y
    );
    this.emit('dragStart');
  }

  private onDragEnd(): void {
    this.isDragging = false;
    this.emit('dragEnd');
  }

  private onDragMove(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      this.container.position.set(
        event.global.x - this.dragOffset.x,
        event.global.y - this.dragOffset.y
      );
      this.emit('dragMove');
    }
  }

  public addContent(component: BaseComponent | PIXI.DisplayObject): this {
    if (component instanceof BaseComponent) {
      this.contentContainer.addChild(component.getContainer());
    } else {
      this.contentContainer.addChild(component);
    }
    return this;
  }

  public removeContent(component: BaseComponent | PIXI.DisplayObject): this {
    if (component instanceof BaseComponent) {
      this.contentContainer.removeChild(component.getContainer());
    } else {
      this.contentContainer.removeChild(component);
    }
    return this;
  }

  public clearContent(): this {
    this.contentContainer.removeChildren();
    return this;
  }

  public getContentContainer(): PIXI.Container {
    return this.contentContainer;
  }

  public setSize(width: number, height: number): this {
    this.options.width = width;
    this.options.height = height;
    this.draw();
    return this;
  }

  public setBackgroundColor(color: number, alpha?: number): this {
    this.options.backgroundColor = color;
    if (alpha !== undefined) {
      this.options.backgroundAlpha = alpha;
    }
    this.draw();
    return this;
  }

  public setBorder(width: number, color: number): this {
    this.options.borderWidth = width;
    this.options.borderColor = color;
    this.draw();
    return this;
  }

  public update(delta: number): void {
    // Update logic if needed
  }
}
