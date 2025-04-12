import gsap from 'gsap';
import * as PIXI from 'pixi.js';
import { StoryChoice } from '../../core/story/StoryData';
import { Game } from '../../game/Game';
import { CharacterEmotion } from '../characters/CharacterData';
import { Scene } from './Scene';

export class StoryScene extends Scene {
  private background: PIXI.Sprite;
  private dialogueBox: PIXI.Container;
  private dialogueText: PIXI.Text;
  private choicesContainer: PIXI.Container;
  private nameTag: PIXI.Container;
  private nameText: PIXI.Text;
  private charactersContainer: PIXI.Container;
  private menuButton: PIXI.Container;
  private continueIndicator: PIXI.Container;

  constructor(game: Game) {
    super(game);

    // Create containers
    this.charactersContainer = new PIXI.Container();
    this.choicesContainer = new PIXI.Container();

    // Create background
    this.background = new PIXI.Sprite();
    this.background.width = window.innerWidth;
    this.background.height = window.innerHeight;

    // Create dialogue box
    this.dialogueBox = new PIXI.Container();
    const dialogueBg = new PIXI.Graphics();
    dialogueBg.beginFill(0x000000, 0.7);
    dialogueBg.drawRoundedRect(0, 0, window.innerWidth - 100, 200, 10);
    dialogueBg.endFill();

    this.dialogueText = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'left',
      wordWrap: true,
      wordWrapWidth: window.innerWidth - 140
    });
    this.dialogueText.position.set(20, 20);

    // Create continue indicator
    this.continueIndicator = new PIXI.Container();
    const triangle = new PIXI.Graphics();
    triangle.beginFill(0xffffff);
    triangle.drawPolygon([0, 0, 20, 10, 0, 20]);
    triangle.endFill();
    this.continueIndicator.addChild(triangle);
    this.continueIndicator.visible = false;

    this.dialogueBox.addChild(dialogueBg);
    this.dialogueBox.addChild(this.dialogueText);
    this.dialogueBox.addChild(this.continueIndicator);

    // Create name tag
    this.nameTag = new PIXI.Container();
    const nameTagBg = new PIXI.Graphics();
    nameTagBg.beginFill(0x3498db);
    nameTagBg.drawRoundedRect(0, 0, 150, 40, 10);
    nameTagBg.endFill();

    this.nameText = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center'
    });
    this.nameText.anchor.set(0.5);
    this.nameText.position.set(75, 20);

    this.nameTag.addChild(nameTagBg);
    this.nameTag.addChild(this.nameText);

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
    this.container.addChild(this.dialogueBox);
    this.container.addChild(this.nameTag);
    this.container.addChild(this.choicesContainer);
    this.container.addChild(this.menuButton);
  }

  public async init(): Promise<void> {
    // Setup event handlers
    this.setupDialogueHandlers();

    // Setup menu button handler
    this.menuButton.eventMode = 'static';
    this.menuButton.on('pointerdown', () => {
      this.game.sceneManager.switchTo('mainMenu', 'fade');
    });

    // Position elements based on current screen size
    this.resizeElements(window.innerWidth, window.innerHeight);

    return Promise.resolve();
  }

  // Fix handleDialogueClick method - replace isTyping() with isCurrentlyTyping() and triggerContinue()
  private handleDialogueClick(): void {
    // If there's active dialogue, signal to continue
    if (this.game.dialogueManager.isActive()) {
      // Get the DialogueBox instance
      const dialogueBox = this.game.dialogueManager.getDialogueBox();

      // If typing is in progress, complete it immediately
      if (dialogueBox.isCurrentlyTyping()) {
        dialogueBox.completeTyping();
      } else {
        // DialogueBox doesn't have triggerContinue(), should emit 'dialogue:continue' event instead
        this.emit('dialogue:continue');
      }
    }
  }

  // Fix event handler setup - update event names to match DialogueBox and ChoiceSystem
  private setupDialogueHandlers(): void {
    // Listen for dialog-related events from the DialogueManager
    this.game.dialogueManager.on('dialogue:start', this.handleDialogueStart.bind(this));
    this.game.dialogueManager.on('dialogue:end', this.handleDialogueEnd.bind(this));

    // Listen for choice-related events
    const choiceSystem = this.game.dialogueManager.getChoiceSystem();
    // Change from 'choices:shown' to 'choices:show'
    choiceSystem.on('choices:show', this.handleChoicesShown.bind(this));
    choiceSystem.on('choice:selected', this.handleChoiceSelected.bind(this));

    // Get the DialogueBox instance and listen for its events
    const dialogueBoxInstance = this.game.dialogueManager.getDialogueBox();
    dialogueBoxInstance.on('dialogue:typing:complete', this.handleTypingComplete.bind(this));
    dialogueBoxInstance.on('dialogue:typing:start', this.handleTypingStart.bind(this));

    // Listen for character events
    this.game.characterManager.on('character:show', this.handleCharacterShow.bind(this));
    this.game.characterManager.on('character:hide', this.handleCharacterHide.bind(this));
    this.game.characterManager.on('character:emotion', this.handleCharacterEmotion.bind(this));

    // Listen for scene events
    this.game.on('background:change', this.handleBackgroundChange.bind(this));
  }

  // Fix handleChoicesShown to match the signature from ChoiceSystem
  private handleChoicesShown(choices: StoryChoice[]): void {
    // Clear existing choices
    this.choicesContainer.removeChildren();

    // Create choice buttons
    const buttonHeight = 60;
    const buttonWidth = 400;
    const padding = 10;

    choices.forEach((choice, index) => {
      const button = new PIXI.Container();

      const buttonBg = new PIXI.Graphics();
      buttonBg.beginFill(0x2980b9);
      buttonBg.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
      buttonBg.endFill();

      const buttonText = new PIXI.Text(choice.text, {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: buttonWidth - 20
      });
      buttonText.anchor.set(0.5);
      buttonText.position.set(buttonWidth / 2, buttonHeight / 2);

      button.addChild(buttonBg);
      button.addChild(buttonText);
      button.position.set(0, index * (buttonHeight + padding));

      // Make button interactive
      button.eventMode = 'static';
      button.on('pointerover', () => {
        gsap.to(buttonBg, { tint: 0x3498db, duration: 0.2 });
      });
      button.on('pointerout', () => {
        gsap.to(buttonBg, { tint: 0xffffff, duration: 0.2 });
      });
      button.on('pointerdown', () => {
        // Trigger choice selection in the DialogueManager's ChoiceSystem
        this.game.dialogueManager.getChoiceSystem().selectChoice(index);
      });

      this.choicesContainer.addChild(button);
    });

    // Position choices container
    this.choicesContainer.position.set(
      (window.innerWidth - buttonWidth) / 2,
      (window.innerHeight - this.choicesContainer.height) / 2
    );

    // Animate choices appearance
    this.choicesContainer.alpha = 0;
    gsap.to(this.choicesContainer, { alpha: 1, duration: 0.3 });
  }

  // Fix handleChoiceSelected to match the signature from ChoiceSystem
  private handleChoiceSelected(choice: StoryChoice, index: number): void {
    // Animate choice container disappearance
    gsap.to(this.choicesContainer, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        this.choicesContainer.removeChildren();
      }
    });
  }

  public async enter(): Promise<void> {
    await super.enter();

    // Hide dialogue elements initially
    this.dialogueBox.alpha = 0;
    this.nameTag.alpha = 0;
    this.nameTag.visible = false;
    this.continueIndicator.visible = false;

    // Clear characters container
    this.charactersContainer.removeChildren();

    // Make dialogue box interactive
    this.dialogueBox.eventMode = 'static';
    this.dialogueBox.on('pointerdown', this.handleDialogueClick.bind(this));

    // Don't need to call start() on DialogueManager explicitly since
    // the StoryManager controls the story flow via node:enter events

    return Promise.resolve();
  }

  public async exit(): Promise<void> {
    // Hide dialogue elements
    this.dialogueBox.alpha = 0;
    this.nameTag.alpha = 0;
    this.choicesContainer.alpha = 0;

    // Remove interactivity from dialogue box
    this.dialogueBox.eventMode = 'none';
    this.dialogueBox.off('pointerdown');

    return super.exit();
  }

  public update(deltaTime: number, elapsedTime: number): void {
    super.update(deltaTime, elapsedTime);
    // Update animations or game logic here

    // Animate continue indicator if visible
    if (this.continueIndicator.visible) {
      this.continueIndicator.position.x =
        this.dialogueBox.width - 40 + Math.sin(elapsedTime / 200) * 5;
      this.continueIndicator.position.y = this.dialogueBox.height - 40;
    }
  }

  private handleDialogueStart(node: any): void {
    // Show dialogue box with animation
    this.dialogueBox.alpha = 0;
    gsap.to(this.dialogueBox, { alpha: 1, duration: 0.3 });

    // Get character ID from node
    const characterId = node.getCharacterId();

    // Show name tag if character is specified
    if (characterId) {
      const character = this.game.characterManager.getCharacter(characterId);
      if (character) {
        // Get display name from character definition or data
        const characterData = character.getData();
        this.nameText.text = characterData.displayName || characterData.name;

        // Show name tag
        this.nameTag.visible = true;
        this.nameTag.alpha = 0;
        gsap.to(this.nameTag, { alpha: 1, duration: 0.3 });

        // Set name tag color based on character's speech color if available
        const nameTagBg = this.nameTag.getChildAt(0) as PIXI.Graphics;
        if (characterData.speechColor) {
          nameTagBg.tint = characterData.speechColor;
        } else {
          nameTagBg.tint = 0x3498db; // default blue
        }
      } else {
        this.nameTag.visible = false;
      }
    } else {
      this.nameTag.visible = false;
    }

    // Update dialogue text from the node text
    // (The actual text rendering is handled by DialogueBox class)
    this.updateDialogueText(node.getText());
  }

  private updateDialogueText(text: string): void {
    // Update the visible text in our dialogue box
    // (The actual typing animation is handled by DialogueBox)
    this.dialogueText.text = text;
  }

  private handleTypingStart(): void {
    // Hide continue indicator when typing starts
    this.continueIndicator.visible = false;
  }

  private handleTypingComplete(): void {
    // Show continue indicator when typing is complete
    this.continueIndicator.visible = true;
  }

  private handleDialogueEnd(node: any): void {
    // Hide dialogue box
    gsap.to(this.dialogueBox, { alpha: 0, duration: 0.3 });
    gsap.to(this.nameTag, { alpha: 0, duration: 0.3 });
    this.continueIndicator.visible = false;
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

    // Reposition dialogue box
    this.dialogueBox.position.set(50, height - 220);

    // Resize dialogue box background
    const dialogueBg = this.dialogueBox.getChildAt(0) as PIXI.Graphics;
    dialogueBg.clear();
    dialogueBg.beginFill(0x000000, 0.7);
    dialogueBg.drawRoundedRect(0, 0, width - 100, 200, 10);
    dialogueBg.endFill();

    // Update text wrap width
    this.dialogueText.style.wordWrapWidth = width - 140;

    // Reposition name tag
    this.nameTag.position.set(60, height - 260);

    // Update continue indicator position
    this.continueIndicator.position.set(width - 140, 170);

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
