import * as PIXI from 'pixi.js';
import { AssetManager } from '../../core/assets/Assetmanager';
import { EventEmitter } from '../../core/events/EventEmitter';
import { Game } from '../Game';
import { Character } from './Character';
import {
  CharacterAction,
  CharacterData,
  CharacterEmotion,
  CharacterPosition
} from './CharacterData';

export class CharacterManager extends EventEmitter {
  private game: Game;
  private characters: Map<string, Character> = new Map();
  private container: PIXI.Container;
  private assetManager: AssetManager;
  private characterDataRegistry: Map<string, CharacterData> = new Map();

  constructor(game: Game) {
    super();

    this.game = game;
    this.assetManager = game.assetManager;

    // Create main container for all characters
    this.container = new PIXI.Container();
    this.container.name = 'characters-container';

    // Add container to the game stage
    game.getStage().addChild(this.container);
  }

  /**
   * Register a character definition
   */
  public registerCharacter(characterData: CharacterData): void {
    this.characterDataRegistry.set(characterData.id, characterData);
    this.emit('character:registered', characterData.id);
  }

  /**
   * Register multiple character definitions
   */
  public registerCharacters(characterDataList: CharacterData[]): void {
    for (const characterData of characterDataList) {
      this.registerCharacter(characterData);
    }
  }

  /**
   * Create a character instance and add it to the scene
   */
  public async createCharacter(characterId: string): Promise<Character | null> {
    // Check if character is already created
    if (this.characters.has(characterId)) {
      return this.characters.get(characterId) || null;
    }

    // Get character data from registry
    const characterData = this.characterDataRegistry.get(characterId);
    if (!characterData) {
      console.error(`Character data not found for ID: ${characterId}`);
      return null;
    }

    // Create new character instance
    const character = new Character(characterData);

    // Initialize character
    await character.initialize();

    // Add character to map and scene
    this.characters.set(characterId, character);
    this.container.addChild(character.getContainer());

    // Set initial position off-screen
    character.setPosition(CharacterPosition.OFF_SCREEN_LEFT, false);

    // Emit event
    this.emit('character:created', characterId);

    return character;
  }

  /**
   * Get a character by ID
   */
  public getCharacter(characterId: string): Character | undefined {
    return this.characters.get(characterId);
  }

  /**
   * Check if character exists
   */
  public hasCharacter(characterId: string): boolean {
    return this.characters.has(characterId);
  }

  /**
   * Execute a character action
   */
  public async executeAction(action: CharacterAction): Promise<void> {
    const { characterId, type } = action;

    // Get or create character
    let character = this.getCharacter(characterId);
    if (!character) {
      const createdCharacter = await this.createCharacter(characterId);
      if (!createdCharacter) {
        console.error(`Failed to create character: ${characterId}`);
        return;
      }
      character = createdCharacter;
    }

    // Execute action based on type
    switch (type) {
      case 'ENTER':
        await character.enter(
          action.position || CharacterPosition.CENTER,
          action.position === CharacterPosition.RIGHT
            ? CharacterPosition.OFF_SCREEN_RIGHT
            : CharacterPosition.OFF_SCREEN_LEFT,
          action.duration || 0.8
        );
        break;

      case 'EXIT':
        await character.exit(
          action.position ||
            (character.getState().position === CharacterPosition.LEFT
              ? CharacterPosition.OFF_SCREEN_LEFT
              : CharacterPosition.OFF_SCREEN_RIGHT),
          action.duration || 0.8
        );
        break;

      case 'MOVE':
        if (action.position) {
          await character.setPosition(action.position, true, action.duration || 0.5);
        }
        break;

      case 'CHANGE_EMOTION':
        if (action.emotion) {
          await character.setEmotion(action.emotion);
        }
        break;

      case 'ANIMATE':
        if (action.animation) {
          await character.playAnimation(action.animation, action.customParams);
        }
        break;

      case 'SPEAK':
        // This would typically trigger dialogue display
        // We'll assume DialogueManager handles this separately
        this.emit('character:speak', characterId, action.text, action.emotion);
        break;

      default:
        console.warn(`Unknown character action type: ${type}`);
    }

    // Emit action complete event
    this.emit('character:action-complete', action);
  }

  /**
   * Execute a sequence of character actions
   */
  public async executeActionSequence(actions: CharacterAction[]): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  /**
   * Remove a character from the scene
   */
  public removeCharacter(characterId: string): void {
    const character = this.characters.get(characterId);
    if (character) {
      character.destroy();
      this.characters.delete(characterId);
      this.emit('character:removed', characterId);
    }
  }

  /**
   * Remove all characters from the scene
   */
  public removeAllCharacters(): void {
    for (const characterId of this.characters.keys()) {
      this.removeCharacter(characterId);
    }
  }

  /**
   * Get all active characters
   */
  public getAllCharacters(): Map<string, Character> {
    return new Map(this.characters);
  }

  /**
   * Update all characters
   */
  public update(deltaTime: number): void {
    for (const character of this.characters.values()) {
      character.update(deltaTime);
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.removeAllCharacters();
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
    this.clear(); // Clear event listeners
  }
}
