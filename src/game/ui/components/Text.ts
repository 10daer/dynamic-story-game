// src/game/ui/components/Text.ts
import * as PIXI from 'pixi.js';
import { BaseComponent } from './BaseComponent';

export interface TextOptions {
  text: string;
  style?: Partial<PIXI.TextStyle>;
  maxWidth?: number;
  autoSize?: boolean;
}

export class Text extends BaseComponent {
  private textObject: PIXI.Text;
  private options: TextOptions;

  constructor(options: TextOptions) {
    super();

    this.options = {
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffffff,
        align: 'left',
        wordWrap: true,
        wordWrapWidth: options.maxWidth || 500
      },
      autoSize: true,
      ...options
    };

    this.textObject = new PIXI.Text(this.options.text, this.options.style as PIXI.TextStyle);
    this.container.addChild(this.textObject);
  }

  public setText(text: string): this {
    this.textObject.text = text;
    return this;
  }

  public getText(): string {
    return this.textObject.text;
  }

  public setStyle(style: Partial<PIXI.TextStyle>): this {
    Object.assign(this.textObject.style, style);
    return this;
  }

  public setWordWrap(wrap: boolean, maxWidth?: number): this {
    this.textObject.style.wordWrap = wrap;
    if (maxWidth !== undefined) {
      this.textObject.style.wordWrapWidth = maxWidth;
    }
    return this;
  }

  public setMaxWidth(maxWidth: number): this {
    this.textObject.style.wordWrapWidth = maxWidth;
    return this;
  }

  public update(delta: number): void {
    // Update logic if needed
  }
}
