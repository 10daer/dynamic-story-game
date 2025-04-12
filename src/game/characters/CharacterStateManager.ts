import { EventEmitter } from '../../core/events/EventEmitter';
import { StateManager } from '../../core/state/StateManager';
import { CharacterEmotion, CharacterState } from './CharacterData';

export class CharacterStateManager extends EventEmitter {
  private stateManager: StateManager;
  private characterStates: Map<string, CharacterState> = new Map();

  constructor(stateManager: StateManager) {
    super();
    this.stateManager = stateManager;

    // Initialize character namespace in StateManager if needed
    if (!this.stateManager.get('characters')) {
      this.stateManager.set('characters', {});
    }
  }

  /**
   * Initialize a character's state
   */
  public initializeCharacter(characterId: string, initialState: CharacterState): void {
    // Store in local map
    this.characterStates.set(characterId, { ...initialState });

    // Store in state manager
    this.stateManager.setNamespaced('characters', characterId, initialState);

    this.emit('character-state:initialized', characterId, initialState);
  }

  /**
   * Get a character's state
   */
  public getCharacterState(characterId: string): CharacterState | undefined {
    return this.characterStates.get(characterId);
  }

  /**
   * Update a character's state
   */
  public updateCharacterState(characterId: string, updates: Partial<CharacterState>): void {
    const currentState = this.characterStates.get(characterId);

    if (!currentState) {
      console.warn(`Character '${characterId}' not found in state manager`);
      return;
    }

    // Update local state
    const updatedState = { ...currentState, ...updates };
    this.characterStates.set(characterId, updatedState);

    // Update state manager
    this.stateManager.setNamespaced('characters', characterId, updatedState);

    this.emit('character-state:updated', characterId, updatedState, updates);
  }

  /**
   * Update character emotion
   */
  public setCharacterEmotion(characterId: string, emotion: CharacterEmotion): void {
    const currentState = this.characterStates.get(characterId);

    if (!currentState) {
      console.warn(`Character '${characterId}' not found in state manager`);
      return;
    }

    const updates = { currentEmotion: emotion };
    this.updateCharacterState(characterId, updates);

    this.emit('character-state:emotion-change', characterId, emotion);
  }

  // Add these methods to CharacterStateManager class

  /**
   * Register a state for a character (compatibility method)
   *
   * This method adapts the state registration to work with the existing CharacterStateManager
   * by storing states as flags in the character state.
   */
  public registerState(characterId: string, stateName: string, stateConfig: any): void {
    // Get character state
    const characterState = this.getCharacterState(characterId);

    if (!characterState) {
      console.warn(`Cannot register state: Character '${characterId}' not found in state manager`);
      return;
    }

    // Create updated state with the new state flag
    const updatedState = { ...characterState };

    // Initialize flags object if it doesn't exist
    if (!updatedState.customState.flags) {
      updatedState.customState.flags = {};
    }

    // Store state config as a flag
    updatedState.customState.flags[stateName] =
      stateConfig.value !== undefined ? stateConfig.value : true;

    // Update character state
    this.updateCharacterState(characterId, updatedState);

    // Emit state registered event
    this.emit('character-state:state-registered', characterId, stateName, stateConfig);
  }

  /**
   * Set a specific state for a character (compatibility method)
   *
   * This adapts the setState functionality to work with the existing CharacterStateManager.
   */
  public setState(characterId: string, stateName: string): boolean {
    // Get character state
    const characterState = this.getCharacterState(characterId);

    if (!characterState) {
      console.warn(`Cannot set state: Character '${characterId}' not found in state manager`);
      return false;
    }

    // Check if stateName is an emotion
    // This is a simplistic approach - in a real implementation, you might want to
    // have a list of valid emotions to check against
    if (
      ['happy', 'sad', 'angry', 'neutral', 'surprised', 'afraid', 'thinking'].includes(stateName)
    ) {
      // Set as emotion
      this.setCharacterEmotion(characterId, stateName as CharacterEmotion);
      return true;
    } else {
      // Set as a flag state
      const updatedState = { ...characterState };

      // Initialize flags object if it doesn't exist
      if (!updatedState.customState.flags) {
        updatedState.customState.flags = {};
      }

      // Set all other state flags to false (assuming exclusive states)
      for (const key in updatedState.customState.flags) {
        if (key.startsWith('state_')) {
          updatedState.customState.flags[key] = false;
        }
      }

      // Set the requested state to true
      const stateKey = stateName.startsWith('state_') ? stateName : `state_${stateName}`;
      updatedState.customState.flags[stateKey] = true;

      // Update character state
      this.updateCharacterState(characterId, updatedState);

      // Emit state changed event
      this.emit('character-state:state-changed', characterId, stateName);

      return true;
    }
  }

  /**
   * Reset character states
   */
  public reset(): void {
    this.clear();
    this.emit('character-state:reset');
  }

  /**
   * Check if a character state meets a condition
   */
  public checkCharacterCondition(
    characterId: string,
    property: keyof CharacterState | string,
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains',
    value: any
  ): boolean {
    // Get character state
    const characterState = this.characterStates.get(characterId);
    if (!characterState) return false;

    // Get property value (supports nested properties with dot notation)
    const propertyPath = property.split('.');
    let currentValue = characterState as any;

    for (const part of propertyPath) {
      if (currentValue === null || currentValue === undefined) return false;
      currentValue = currentValue[part];
    }

    // Perform comparison
    switch (operator) {
      case '==':
        return currentValue === value;
      case '!=':
        return currentValue !== value;
      case '>':
        return currentValue > value;
      case '>=':
        return currentValue >= value;
      case '<':
        return currentValue < value;
      case '<=':
        return currentValue <= value;
      case 'contains':
        if (Array.isArray(currentValue)) {
          return currentValue.includes(value);
        } else if (typeof currentValue === 'string') {
          return currentValue.includes(value);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Get all character states
   */
  public getAllCharacterStates(): Map<string, CharacterState> {
    return new Map(this.characterStates);
  }

  /**
   * Remove a character's state
   */
  public removeCharacterState(characterId: string): void {
    this.characterStates.delete(characterId);

    // Remove from state manager
    const characters = this.stateManager.get('characters') as Record<string, any>;
    if (characters && characters[characterId]) {
      delete characters[characterId];
      this.stateManager.set('characters', characters);
    }

    this.emit('character-state:removed', characterId);
  }

  /**
   * Load character states from save data
   */
  public loadFromSaveData(characterStates: Record<string, CharacterState>): void {
    // Clear current states
    this.characterStates.clear();

    // Load states from save data
    for (const [characterId, state] of Object.entries(characterStates)) {
      this.characterStates.set(characterId, state);
    }

    // Update state manager
    this.stateManager.set('characters', characterStates);

    this.emit('character-state:loaded', characterStates);
  }

  /**
   * Export character states for saving
   */
  public exportForSave(): Record<string, CharacterState> {
    const exportData: Record<string, CharacterState> = {};

    for (const [characterId, state] of this.characterStates.entries()) {
      exportData[characterId] = { ...state };
    }

    return exportData;
  }

  /**
   * Clear all character states
   */
  public clear(): void {
    this.characterStates.clear();
    this.stateManager.set('characters', {});
    this.emit('character-state:clear');
  }
}
