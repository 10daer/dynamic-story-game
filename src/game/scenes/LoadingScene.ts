import * as PIXI from 'pixi.js';
import { Game } from '../Game';
import { Scene } from './Scene';

export class LoadingScene extends Scene {
  private loadingText: PIXI.Text;
  private progressBar: {
    background: PIXI.Graphics;
    fill: PIXI.Graphics;
  };
  private progress: number = 0;

  constructor(game: Game) {
    super(game);

    // Create loading text
    this.loadingText = new PIXI.Text('Loading...', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center'
    });
    this.loadingText.anchor.set(0.5);

    // Create progress bar
    const barWidth = 400;
    const barHeight = 20;

    const background = new PIXI.Graphics();
    background.beginFill(0x333333);
    background.drawRect(0, 0, barWidth, barHeight);
    background.endFill();

    const fill = new PIXI.Graphics();
    fill.beginFill(0x3498db);
    fill.drawRect(0, 0, 0, barHeight);
    fill.endFill();

    this.progressBar = {
      background,
      fill
    };

    // Position elements
    this.container.addChild(this.loadingText);
    this.container.addChild(background);
    this.container.addChild(fill);
  }

  public async init(): Promise<void> {
    // Position elements based on current screen size
    this.resizeElements(window.innerWidth, window.innerHeight);

    // Listen for asset loading progress
    this.game.assetManager.on('progress', (progress: number) => {
      this.updateProgress(progress);
    });

    return Promise.resolve();
  }

  public async enter(): Promise<void> {
    await super.enter();

    // Reset progress bar
    this.updateProgress(0);

    return Promise.resolve();
  }

  public async exit(): Promise<void> {
    // Remove event listeners
    this.game.assetManager.off('progress');

    return super.exit();
  }

  public update(deltaTime: number, elapsedTime: number): void {
    super.update(deltaTime, elapsedTime);
    // Add any animations or updates here
  }

  private resizeElements(width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Position text
    this.loadingText.position.set(centerX, centerY - 50);

    // Position progress bar
    const barWidth = 400;
    this.progressBar.background.position.set(centerX - barWidth / 2, centerY);
    this.progressBar.fill.position.set(centerX - barWidth / 2, centerY);

    // Update progress bar width based on current progress
    this.updateProgress(this.progress);
  }

  private updateProgress(progress: number): void {
    this.progress = progress;
    const barWidth = 400;
    this.progressBar.fill.clear();
    this.progressBar.fill.beginFill(0x3498db);
    this.progressBar.fill.drawRect(0, 0, barWidth * progress, 20);
    this.progressBar.fill.endFill();

    // Update text
    this.loadingText.text = `Loading... ${Math.floor(progress * 100)}%`;
  }
}
