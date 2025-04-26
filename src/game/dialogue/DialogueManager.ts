import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { StoryAnimator } from '../../core/animations/StoryAnimator';
import { EventEmitter } from '../../core/events/EventEmitter';
import { StoryManager } from '../../core/story/StoryManager';
import { StoryNode } from '../../core/story/StoryNode';
import { CharacterActionGenerator } from '../characters/CharacterActionGenerator';
import { Game } from '../Game';
import { ChoiceSystem } from './ChoiceSystem';
import { DialogueBox, DialogueDisplayOptions } from './DialogueBox';

export interface CharacterDefinition {
  name: string;
  displayName?: string;
  textColor?: number;
  textSpeed?: number;
  animationIn?: string;
  animationOut?: string;
  soundEffect?: string;
  mood?: Record<string, number | string>;
}

export class DialogueManager extends EventEmitter {
  private game: Game;
  private storyManager: StoryManager;
  private dialogueBox: DialogueBox;
  private choiceSystem: ChoiceSystem;
  private animator: StoryAnimator;

  private characterActionGenerator: CharacterActionGenerator;

  private isDialogueActive: boolean = false;
  private characters: Record<string, CharacterDefinition> = {};
  private defaultAnimationIn: string = 'fadeIn';
  private defaultAnimationOut: string = 'fadeOut';
  private defaultChoiceAnimationIn: string = 'stagger';

  constructor(game: Game, storyManager: StoryManager, animator?: StoryAnimator) {
    super();

    this.game = game;
    this.storyManager = storyManager;
    this.characterActionGenerator = new CharacterActionGenerator();
    this.animator = animator || new StoryAnimator(game);

    // Create dialogue box with animator
    this.dialogueBox = new DialogueBox(game, { animator: this.animator });

    // Create choice system
    this.choiceSystem = new ChoiceSystem(game);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for story events
    this.storyManager.on('node:enter', this.handleNodeEnter.bind(this));
    this.storyManager.on('story:start', () => {
      // Handle story start - make sure first node is processed
      const startNode = this.storyManager.getCurrentNode();
      if (startNode) {
        this.handleNodeEnter(startNode);
      }
    });

    // Listen for dialogue events
    this.dialogueBox.on('dialogue:continue', this.handleDialogueContinue.bind(this));

    // Listen for choice events
    this.choiceSystem.on('choice:selected', this.handleChoiceSelected.bind(this));
  }

  /**
   * Handle entering a new story node
   * @param node New node that was entered
   */
  private handleNodeEnter(node: StoryNode): void {
    // Get node metadata (if any)
    const metadata = node.getMetadata() || {};
    const characterId = node.getCharacterId() || 'narrator';

    // Generate character actions from the node
    if (this.game.characterManager) {
      // Get all available characters from character manager
      const characters = this.game.characterManager.getAllCharacters();

      // Generate actions for this node
      const characterActions = this.characterActionGenerator.generateActionsFromNode(
        node,
        characters
      );

      // Execute the generated actions
      if (characterActions.length > 0) {
        this.game.characterManager.executeActionSequence(characterActions);
      }

      // If we're using contextual actions between nodes, we could potentially
      // look ahead to the next node in the story and generate transition actions
      const nextNode = this.storyManager.getNode(node.getNextNodeId() as string); // You would need to implement this method
      if (nextNode) {
        const contextualActions = this.characterActionGenerator.generateContextualActions(
          node,
          nextNode,
          characters
        );

        if (contextualActions.length > 0) {
          this.game.characterManager.executeActionSequence(contextualActions);
        }
      }

      // Ensure character exists if needed (your existing code)
      if (characterId) {
        const character = this.game.characterManager.getCharacter(characterId);
        if (!character) {
          // Create character if it doesn't exist yet
          this.game.characterManager.createCharacter(characterId);
        }
      }
    }

    // Handle node based on type
    switch (node.getType()) {
      case 'dialogue':
        this.showDialogue(node);
        break;

      case 'choice':
        // For choice nodes, we might show dialogue first, then choices
        this.showDialogue(node, () => {
          this.showChoices(node);
        });
        break;

      case 'scene':
        // Handle scene transition based on metadata
        if (metadata.transition) {
          this.handleSceneTransition(metadata.transition, () => {
            // Show dialogue if present after transition
            if (node.getText()) {
              // Small delay to let scene transition happen first
              setTimeout(() => {
                this.showDialogue(node);
              }, 100);
            }
          });
        } else if (node.getText()) {
          // Just show dialogue if no transition
          this.showDialogue(node);
        }
        // Handle background change if present
        if (node.getBackground()) {
          // Tell the SceneManager to change the background
          this.game.sceneManager.changeBackground(node.getBackground() as string);
        }
        break;

      case 'end':
        // Handle end of story
        this.hideDialogue();
        this.emit('dialogue:story-end');
        break;
    }

    // Execute any scene effects based on metadata
    if (metadata.effect) {
      this.executeSceneEffect(metadata.effect);
    }
  }

  /**
   * Handle scene transition
   * @param transition Transition type or configuration
   * @param onComplete Callback after transition completes
   */
  private handleSceneTransition(transition: string | any, onComplete?: () => void): void {
    let transitionType = 'fade';

    if (typeof transition === 'string') {
      transitionType = transition;
    } else if (typeof transition === 'object') {
      transitionType = transition.type || 'fade';
    }

    const currentNode = this.storyManager.getCurrentNode();
    if (!currentNode) return;

    const sceneId = currentNode.getSceneId();
    if (!sceneId) {
      if (onComplete) onComplete();
      return;
    }

    const camelCaseSceneId = sceneId.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    const sceneManager = this.game.sceneManager;

    // Scene change handler
    const onSceneChanged = () => {
      sceneManager.off('scene:changed', onSceneChanged);

      // Call completion callback
      if (onComplete) onComplete();
    };

    // Listen to scene:changed with extended logic
    sceneManager.on('scene:changed', onSceneChanged);

    // Perform the transition
    sceneManager.switchTo(camelCaseSceneId, transitionType);
  }

  /**
   * Execute scene effect based on metadata
   * @param effect Effect type or configuration
   */
  private executeSceneEffect(effect: string | any): void {
    if (typeof effect === 'string') {
      switch (effect) {
        case 'shake':
          // Shake the screen
          const stage = this.game.getStage();
          gsap.to(stage, {
            x: '+=10',
            duration: 0.05,
            repeat: 10,
            yoyo: true,
            onComplete: () => {
              stage.x = 0;
            }
          });
          break;

        case 'flash':
          // Flash white
          const flash = new PIXI.Graphics();
          flash.beginFill(0xffffff);
          flash.drawRect(0, 0, this.game.getApp().screen.width, this.game.getApp().screen.height);
          flash.endFill();
          flash.alpha = 0;

          this.game.getStage().addChild(flash);

          gsap.to(flash, {
            alpha: 1,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              flash.destroy();
            }
          });
          break;
      }
    }
  }

  /**
   * Show dialogue for a node
   * @param node Node containing dialogue
   * @param onComplete Callback after dialogue is shown
   */
  private showDialogue(node: StoryNode, onComplete?: () => void): void {
    const text = node.getText();
    if (!text) {
      if (onComplete) onComplete();
      return;
    }

    this.isDialogueActive = true;

    // Get dialogue display options
    const displayOptions: DialogueDisplayOptions = {};

    // Get character info if available
    const characterId = node.getCharacterId();
    let characterName: string | undefined;

    if (characterId && this.characters[characterId]) {
      const character = this.characters[characterId];
      characterName = character.displayName || character.name;

      // Set character-specific display options
      displayOptions.textColor = character.textColor;
      displayOptions.textSpeed = character.textSpeed;
      displayOptions.animationIn = character.animationIn || this.defaultAnimationIn;
      displayOptions.animationOut = character.animationOut || this.defaultAnimationOut;

      // Check for mood settings
      const mood = node.getMood() || 'default';
      if (character.mood && character.mood[mood]) {
        const moodSettings = character.mood[mood];

        // Apply mood-specific color if defined
        if (typeof moodSettings === 'number') {
          displayOptions.characterColor = moodSettings;
        }
      }
    } else {
      // Use default animations if no character
      displayOptions.animationIn = this.defaultAnimationIn;
      displayOptions.animationOut = this.defaultAnimationOut;
    }

    // Handle any node-specific animation overrides from metadata
    const metadata = node.getMetadata() || {};
    if (metadata.animation?.in) {
      displayOptions.animationIn = metadata.animation.in;
    }
    if (metadata.animation?.out) {
      displayOptions.animationOut = metadata.animation.out;
    }
    if (metadata.textSpeed) {
      displayOptions.textSpeed = metadata.textSpeed;
    }
    if (metadata.textEffect) {
      // Apply custom text effect later
    }

    // Show the dialogue box with all options
    this.dialogueBox.show(text, characterName, displayOptions);

    // If there's an emotional effect, apply it
    if (metadata.emotion) {
      switch (metadata.emotion) {
        case 'excited':
          this.dialogueBox.shake(3, 0.2);
          break;
        case 'angry':
          this.dialogueBox.shake(8, 0.4);
          break;
        case 'surprised':
          this.dialogueBox.pulse();
          break;
      }
    }

    // Emit dialogue start event
    this.emit('dialogue:start', node);

    // If there's a completion handler
    if (onComplete) {
      // We need to wait until the dialogue typing is complete
      const onTypingComplete = () => {
        // Clean up this one-time listener
        this.dialogueBox.off('dialogue:typing:complete', onTypingComplete);
        onComplete();
      };

      this.dialogueBox.on('dialogue:typing:complete', onTypingComplete);
    }
  }

  /**
   * Show choices for a node
   * @param node Node containing choices
   */
  private showChoices(node: StoryNode): void {
    const availableChoices = node.getAvailableChoices(this.storyManager.getGameState());

    if (availableChoices.length === 0) {
      console.warn('No available choices for this node!');
      return;
    }

    // Get node metadata for choice animations
    const metadata = node.getMetadata() || {};
    const choiceAnimation = metadata.choiceAnimation || this.defaultChoiceAnimationIn;

    // Hide dialogue if we need to
    if (this.dialogueBox.isVisible()) {
      // If we have text in a choice node, keep it showing
      // otherwise hide it before showing choices
      if (!node.getText()) {
        this.dialogueBox.hide('fadeOut');
      }
    }

    // Show the choices with animation
    this.choiceSystem.show(availableChoices, choiceAnimation);

    // Emit choices shown event
    this.emit('choices:shown', availableChoices);
  }

  /**
   * Handle dialogue continue button press
   */
  private handleDialogueContinue(): void {
    const currentNode = this.storyManager.getCurrentNode();
    if (!currentNode) return;

    // Get node metadata for animation
    const metadata = currentNode.getMetadata() || {};
    const animationOut = metadata.animation?.out || this.defaultAnimationOut;

    // If in a choice node, show choices
    if (currentNode.getType() === 'choice') {
      this.dialogueBox.hide(animationOut);
      setTimeout(() => {
        this.showChoices(currentNode);
      }, 300); // Small delay for smoother transition
      return;
    }

    // For dialogue and scene nodes, progress to next node
    if (currentNode.getNextNodeId()) {
      this.dialogueBox.hide(animationOut);
      setTimeout(() => {
        this.storyManager.progress();
      }, 300); // Small delay for smoother transition
    } else {
      // End of dialogue branch
      this.hideDialogue();
      this.emit('dialogue:end', currentNode);
    }
  }

  /**
   * Handle choice selection
   * @param choice The selected choice
   * @param index The index of the selected choice
   */
  private handleChoiceSelected(choice: any, index: number): void {
    setTimeout(() => {
      this.storyManager.makeChoice(index);
    }, 300); // Small delay after choice animation
  }

  /**
   * Register a character
   * @param id Character ID
   * @param name Character name
   * @param options Additional character options
   */
  public registerCharacter(
    id: string,
    name: string,
    options: Omit<CharacterDefinition, 'name'> = {}
  ): void {
    this.characters[id] = {
      name,
      ...options
    };
  }

  /**
   * Register multiple characters
   * @param characters Character definitions
   */
  public registerCharacters(characters: Record<string, CharacterDefinition>): void {
    this.characters = {
      ...this.characters,
      ...characters
    };
  }

  /**
   * Set default animations
   * @param animations Default animation configuration
   */
  public setDefaultAnimations(animations: {
    dialogueIn?: string;
    dialogueOut?: string;
    choiceIn?: string;
  }): void {
    if (animations.dialogueIn) {
      this.defaultAnimationIn = animations.dialogueIn;
    }
    if (animations.dialogueOut) {
      this.defaultAnimationOut = animations.dialogueOut;
    }
    if (animations.choiceIn) {
      this.defaultChoiceAnimationIn = animations.choiceIn;
    }
  }

  /**
   * Hide dialogue elements
   */
  public hideDialogue(): void {
    this.isDialogueActive = false;
    this.dialogueBox.hide(this.defaultAnimationOut);
    this.choiceSystem.hide();
  }

  /**
   * Check if dialogue is active
   */
  public isActive(): boolean {
    return this.isDialogueActive;
  }

  /**
   * Get the dialogue box
   */
  public getDialogueBox(): DialogueBox {
    return this.dialogueBox;
  }

  /**
   * Get the choice system
   */
  public getChoiceSystem(): ChoiceSystem {
    return this.choiceSystem;
  }

  /**
   * Set the default text speed
   * @param charsPerSecond Characters per second
   */
  public setDefaultTextSpeed(charsPerSecond: number): void {
    this.dialogueBox.setTextSpeed(charsPerSecond);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.dialogueBox.destroy();
    this.choiceSystem.destroy();
    this.clear(); // Clear all event listeners
  }
}
