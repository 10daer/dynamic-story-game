import gsap from 'gsap';
import * as PIXI from 'pixi.js';
import { Game } from '../../game/Game';
import { Scene } from './Scene';

export class MainMenuScene extends Scene {
  private title: PIXI.Text;
  private startButton: PIXI.Container;
  private loadButton: PIXI.Container;
  private creditsButton: PIXI.Container;

  constructor(game: Game) {
    super(game);

    // Create title
    this.title = new PIXI.Text('Dynamic Story Game', {
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center'
    });
    this.title.anchor.set(0.5, 0);

    // Create buttons
    this.startButton = this.createButton('Start New Story');
    this.loadButton = this.createButton('Load Story');
    this.creditsButton = this.createButton('Credits');

    // Add to container
    this.container.addChild(this.title);
    this.container.addChild(this.startButton);
    this.container.addChild(this.loadButton);
    this.container.addChild(this.creditsButton);
  }

  public async init(): Promise<void> {
    const hasActiveGame = this.game.getLastActiveScene() !== null;

    // Update button text based on game state
    const startButtonText = this.startButton.getChildAt(1) as PIXI.Text;
    startButtonText.text = hasActiveGame ? 'Continue Story' : 'Start New Story';

    // Add button event listeners
    this.startButton.eventMode = 'static';
    this.startButton.on('pointerdown', () => {
      const lastScene = this.game.getLastActiveScene();

      if (lastScene) {
        // Resume the game
        this.game.continue();

        // Switch back to the story scene
        this.game.sceneManager.switchTo(lastScene, 'fade').catch((error) => {
          console.error('Error switching to story scene:', error);
        });
      } else {
        // Start the story
        this.game.getStoryManager().start();

        // Switch to the story scene
        this.game.sceneManager.switchTo('forestEntranceScene', 'fade').catch((error) => {
          console.error('Error switching to story scene:', error);
        });
      }
    });

    this.loadButton.eventMode = 'static';
    this.loadButton.on('pointerdown', () => {
      // Show saves
      this.showSaves();
    });

    this.creditsButton.eventMode = 'static';
    this.creditsButton.on('pointerdown', () => {
      // Show credits
      alert('Credits: Your Dynamic Story Game');
    });

    // Position elements based on screen size
    this.resizeElements(window.innerWidth, window.innerHeight);

    return Promise.resolve();
  }

  // Update the enter method to refresh the button text on each entry
  public async enter(): Promise<void> {
    // Update button text based on game state
    const hasActiveGame = this.game.getLastActiveScene() !== null;
    const startButtonText = this.startButton.getChildAt(1) as PIXI.Text;
    startButtonText.text = hasActiveGame ? 'Continue Story' : 'Start New Story';

    await super.enter();

    // Make sure elements exist and are properly positioned before animation
    this.resizeElements(window.innerWidth, window.innerHeight);

    // Reset properties to initial state before animating
    this.title.alpha = 0;
    this.title.y = 80;
    this.startButton.alpha = 0;
    this.loadButton.alpha = 0;
    this.creditsButton.alpha = 0;

    // Use AnimationManager instead of direct gsap calls for better tracking
    this.game.animationManager.animate(
      'menu-title-in',
      this.title,
      { alpha: 1, y: this.title.y + 20 },
      { duration: 0.5 }
    );

    this.game.animationManager.animate(
      'menu-start-in',
      this.startButton,
      { alpha: 1 },
      { duration: 0.5, delay: 0.2 }
    );

    this.game.animationManager.animate(
      'menu-load-in',
      this.loadButton,
      { alpha: 1 },
      { duration: 0.5, delay: 0.3 }
    );

    this.game.animationManager.animate(
      'menu-credits-in',
      this.creditsButton,
      { alpha: 1 },
      { duration: 0.5, delay: 0.4 }
    );

    return Promise.resolve();
  }

  public async exit(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Kill any ongoing animations to prevent errors
      this.game.animationManager.kill('menu-title-in');
      this.game.animationManager.kill('menu-start-in');
      this.game.animationManager.kill('menu-load-in');
      this.game.animationManager.kill('menu-credits-in');

      // Animate out
      this.game.animationManager.animate(
        'menu-fade-out',
        this.container,
        { alpha: 0 },
        {
          duration: 0.5,
          onComplete: () => {
            super.exit();
            this.container.alpha = 1; // Reset alpha for next time
            resolve();
          }
        }
      );
    });
  }

  public update(deltaTime: number, elapsedTime: number): void {
    super.update(deltaTime, elapsedTime);
    // Add any animations or updates here
  }

  private createButton(text: string): PIXI.Container {
    const container = new PIXI.Container();

    const background = new PIXI.Graphics();
    background.beginFill(0x3498db);
    background.drawRoundedRect(0, 0, 250, 60, 10);
    background.endFill();

    const buttonText = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center'
    });
    buttonText.anchor.set(0.5);
    buttonText.position.set(250 / 2, 60 / 2);

    container.addChild(background);
    container.addChild(buttonText);

    // Add hover effect
    container.eventMode = 'static';
    container.on('pointerover', () => {
      gsap.to(background.scale, { x: 1.05, y: 1.05, duration: 0.2 });
    });
    container.on('pointerout', () => {
      gsap.to(background.scale, { x: 1, y: 1, duration: 0.2 });
    });

    return container;
  }

  private async showSaves(): Promise<void> {
    const saves = this.game.getSaveFiles();

    if (saves.length === 0) {
      alert('No saves found');
      return;
    }

    // In a real implementation, you'd show a UI with save files
    alert('Check console for available saves');
  }

  private resizeElements(width: number, height: number): void {
    const centerX = width / 2;

    // Position title
    this.title.position.set(centerX, 100);

    // Position buttons
    this.startButton.position.set(centerX - 125, 250);
    this.loadButton.position.set(centerX - 125, 330);
    this.creditsButton.position.set(centerX - 125, 410);
  }
}
