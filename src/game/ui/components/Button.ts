import * as PIXI from 'pixi.js';
import { BaseComponent } from './BaseComponent';

export interface ButtonOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  borderColor?: number;
  borderWidth?: number;
  borderRadius?: number;
  text?: string;
  textStyle?: Partial<PIXI.TextStyle>;
  padding?: number;
  hoverTint?: number;
  pressedTint?: number;
  disabledTint?: number;
}

export class Button extends BaseComponent {
  private background: PIXI.Graphics;
  private label: PIXI.Text | null = null;
  private options: ButtonOptions;
  private isHovered: boolean = false;
  private isPressed: boolean = false;
  private isEnabled: boolean = true;

  constructor(options: ButtonOptions = {}) {
    super();

    this.options = {
      width: 200,
      height: 50,
      backgroundColor: 0x333333,
      backgroundAlpha: 1,
      borderColor: 0x555555,
      borderWidth: 2,
      borderRadius: 10,
      text: '',
      textStyle: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xffffff,
        align: 'center'
      },
      padding: 10,
      hoverTint: 0x444444,
      pressedTint: 0x222222,
      disabledTint: 0x888888,
      ...options
    };

    this.background = new PIXI.Graphics();
    this.container.addChild(this.background);

    if (this.options.text) {
      this.label = new PIXI.Text(this.options.text, this.options.textStyle as PIXI.TextStyle);
      this.label.anchor.set(0.5);
      this.container.addChild(this.label);
    }

    this.setInteractive(true);
    this.draw();
    this.setupEvents();
  }

  private draw(): void {
    const {
      width,
      height,
      backgroundColor,
      backgroundAlpha,
      borderColor,
      borderWidth,
      borderRadius
    } = this.options;

    this.background.clear();

    // Draw border if needed
    if (borderWidth && borderWidth > 0) {
      this.background.lineStyle(borderWidth, borderColor!, 1);
    }

    // Draw background
    this.background.beginFill(backgroundColor!, backgroundAlpha);
    this.background.drawRoundedRect(0, 0, width!, height!, borderRadius!);
    this.background.endFill();

    // Center the label
    if (this.label) {
      this.label.position.set(width! / 2, height! / 2);
    }

    // Apply tint based on state
    this.updateTint();
  }

  private setupEvents(): void {
    this.background.eventMode = 'static';
    this.background.cursor = 'pointer';

    this.background.on('pointerover', this.onPointerOver, this);
    this.background.on('pointerout', this.onPointerOut, this);
    this.background.on('pointerdown', this.onPointerDown, this);
    this.background.on('pointerup', this.onPointerUp, this);
    this.background.on('pointerupoutside', this.onPointerUpOutside, this);
    this.background.on('click', this.onClick, this);
  }

  private onPointerOver(): void {
    if (!this.isEnabled) return;
    this.isHovered = true;
    this.updateTint();
    this.emit('hover');
  }

  private onPointerOut(): void {
    if (!this.isEnabled) return;
    this.isHovered = false;
    this.updateTint();
    this.emit('out');
  }

  private onPointerDown(): void {
    if (!this.isEnabled) return;
    this.isPressed = true;
    this.updateTint();
    this.emit('press');
  }

  private onPointerUp(): void {
    if (!this.isEnabled || !this.isPressed) return;
    this.isPressed = false;
    this.updateTint();
    this.emit('release');
  }

  private onPointerUpOutside(): void {
    if (!this.isEnabled || !this.isPressed) return;
    this.isPressed = false;
    this.isHovered = false;
    this.updateTint();
    this.emit('releaseOutside');
  }

  private onClick(): void {
    if (!this.isEnabled) return;
    this.emit('click');
  }

  private updateTint(): void {
    if (!this.isEnabled) {
      this.background.tint = this.options.disabledTint!;
    } else if (this.isPressed) {
      this.background.tint = this.options.pressedTint!;
    } else if (this.isHovered) {
      this.background.tint = this.options.hoverTint!;
    } else {
      this.background.tint = 0xffffff; // Reset tint
    }
  }

  public setText(text: string): this {
    if (!this.label) {
      this.label = new PIXI.Text(text, this.options.textStyle as PIXI.TextStyle);
      this.label.anchor.set(0.5);
      this.container.addChild(this.label);
    } else {
      this.label.text = text;
    }

    this.draw();
    return this;
  }

  public setEnabled(enabled: boolean): this {
    this.isEnabled = enabled;
    this.background.cursor = enabled ? 'pointer' : 'default';
    this.updateTint();
    return this;
  }

  public isButtonEnabled(): boolean {
    return this.isEnabled;
  }

  public setSize(width: number, height: number): this {
    this.options.width = width;
    this.options.height = height;
    this.draw();
    return this;
  }

  public update(delta: number): void {
    // Update logic if needed
  }
}
