import gsap from 'gsap';
import * as PIXI from 'pixi.js';
import { Game } from '../../game/Game';
import { CharacterEmotion } from '../characters/CharacterData';
import { Scene } from './Scene';

export class StoryScene extends Scene {
  private background: PIXI.Sprite;
  private charactersContainer: PIXI.Container;
  private menuButton: PIXI.Container;

  constructor(game: Game) {
    super(game);

    // Create character container
    this.charactersContainer = new PIXI.Container();

    // Create background
    this.background = new PIXI.Sprite();
    this.background.width = window.innerWidth;
    this.background.height = window.innerHeight;

    // Create menu button
    this.menuButton = new PIXI.Container();
    const menuButtonBg = new PIXI.Graphics();
    menuButtonBg.beginFill(0x3498db);
    menuButtonBg.drawRoundedRect(0, 0, 100, 40, 10);
    menuButtonBg.endFill();

    const menuButtonText = new PIXI.Text('Menu', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xffffff,
      align: 'center'
    });
    menuButtonText.anchor.set(0.5);
    menuButtonText.position.set(50, 20);

    this.menuButton.addChild(menuButtonBg);
    this.menuButton.addChild(menuButtonText);
    this.menuButton.position.set(20, 20);

    // Add to container
    this.container.addChild(this.background);
    this.container.addChild(this.charactersContainer);
    this.container.addChild(this.menuButton);
  }

  public async init(): Promise<void> {
    // Setup event handlers
    this.setupEventHandlers();

    // Setup menu button handler - UPDATED for pause functionality
    this.menuButton.eventMode = 'static';
    this.menuButton.on('pointerdown', () => {
      // Store the current scene for later resuming
      this.game.setLastActiveScene('story');

      // Pause the game
      this.game.pause();

      // Switch to main menu with fade transition
      this.game.sceneManager.switchTo('mainMenu', 'fade');
    });

    // Position elements based on current screen size
    this.resizeElements(window.innerWidth, window.innerHeight);

    return Promise.resolve();
  }

  private setupEventHandlers(): void {
    // Listen for character events
    this.game.characterManager.on('character:show', this.handleCharacterShow.bind(this));
    this.game.characterManager.on('character:hide', this.handleCharacterHide.bind(this));
    this.game.characterManager.on('character:emotion', this.handleCharacterEmotion.bind(this));

    // Listen for background change events
    this.game.on('background:change', this.handleBackgroundChange.bind(this));
  }

  public async enter(): Promise<void> {
    await super.enter();

    // Clear characters container
    this.charactersContainer.removeChildren();

    return Promise.resolve();
  }

  public async exit(): Promise<void> {
    // Remove any characters from stage
    this.charactersContainer.removeChildren();

    return super.exit();
  }

  public update(deltaTime: number, elapsedTime: number): void {
    super.update(deltaTime, elapsedTime);
  }

  private handleCharacterShow(characterId: string): void {
    const character = this.game.characterManager.getCharacter(characterId);
    if (!character) return;

    const sprite = character.getContainer();
    if (!sprite) return;

    // Add to characters container if not already there
    if (!this.charactersContainer.children.includes(sprite)) {
      this.charactersContainer.addChild(sprite);
    }

    // Get position based on character state
    const state = this.game.characterStateManager.getCharacterState(characterId);
    if (state) {
      switch (state.position) {
        case 'left':
          sprite.position.set(window.innerWidth * 0.25, window.innerHeight * 0.5);
          break;
        case 'center':
          sprite.position.set(window.innerWidth * 0.5, window.innerHeight * 0.5);
          break;
        case 'right':
          sprite.position.set(window.innerWidth * 0.75, window.innerHeight * 0.5);
          break;
      }
    }

    // Animate appearance
    sprite.alpha = 0;
    sprite.scale.set(0.9);
    gsap.to(sprite, { alpha: 1, scale: 1, duration: 0.5 });
  }

  private handleCharacterHide(characterId: string): void {
    const character = this.game.characterManager.getCharacter(characterId);
    if (!character) return;

    const sprite = character.getContainer();
    if (!sprite) return;

    // Animate disappearance
    gsap.to(sprite, {
      alpha: 0,
      scale: 0.9,
      duration: 0.5,
      onComplete: () => {
        this.charactersContainer.removeChild(sprite);
      }
    });
  }

  private handleCharacterEmotion(characterId: string, emotion: string): void {
    const character = this.game.characterManager.getCharacter(characterId);
    if (!character) return;

    // Change character emotion/texture
    character.setEmotion(emotion as CharacterEmotion);
  }

  private handleBackgroundChange(backgroundId: string): void {
    // Get texture from asset manager
    const texture = this.game.assetManager.get(backgroundId);
    if (!texture) return;

    // Create new background
    const newBackground = new PIXI.Sprite(texture);
    newBackground.width = window.innerWidth;
    newBackground.height = window.innerHeight;
    newBackground.alpha = 0;

    // Add new background
    this.container.addChildAt(newBackground, 0);

    // Fade out old background, fade in new one
    gsap.to(this.background, { alpha: 0, duration: 1 });
    gsap.to(newBackground, {
      alpha: 1,
      duration: 1,
      onComplete: () => {
        this.container.removeChild(this.background);
        this.background = newBackground;
      }
    });
  }

  private resizeElements(width: number, height: number): void {
    // Resize background
    this.background.width = width;
    this.background.height = height;

    // Reposition characters based on their positions
    this.game.characterManager.getAllCharacters().forEach((character) => {
      if (!character) return;

      const sprite = character.getContainer();
      if (!sprite || !this.charactersContainer.children.includes(sprite)) return;

      const state = character.getState();
      if (state) {
        switch (state.position) {
          case 'left':
            sprite.position.set(width * 0.25, height * 0.5);
            break;
          case 'center':
            sprite.position.set(width * 0.5, height * 0.5);
            break;
          case 'right':
            sprite.position.set(width * 0.75, height * 0.5);
            break;
        }
      }
    });
  }
}
