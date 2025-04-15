import { StoryNode } from '../../core/story/StoryNode';
import { Character } from './Character';
import {
  CharacterAction,
  CharacterAnimation,
  CharacterEmotion,
  CharacterPosition,
  CharacterState
} from './CharacterData';

/**
 * A service that intelligently generates character actions from story nodes
 * using context awareness, state tracking, and narrative flow analysis
 */
export class CharacterActionGenerator {
  // Track character states to make intelligent decisions
  private characterStates: Map<string, CharacterState> = new Map();
  // Track scene context for narrative continuity
  private currentSceneId: string | null = null;
  // Track node sequence for flow analysis
  private previousNodeIds: string[] = [];

  constructor() {}

  /**
   * Generate a sequence of character actions from a story node
   * with context awareness and narrative intelligence
   */
  public generateActionsFromNode(
    node: StoryNode,
    characters: Map<string, Character>
  ): CharacterAction[] {
    const actions: CharacterAction[] = [];
    const nodeType = node.getType();
    const nodeId = node.getId();

    // Update node history for flow analysis
    this.previousNodeIds.unshift(nodeId);
    if (this.previousNodeIds.length > 5) this.previousNodeIds.pop();

    // Update scene context if this is a scene node
    if (nodeType === 'scene') {
      const sceneId = node.getSceneId();
      if (sceneId) {
        this.currentSceneId = sceneId;

        // Handle character setup for the scene
        const sceneCharacters = node.getCharacters();
        if (sceneCharacters) {
          // First handle character exits if needed
          this.generateCharacterExits(sceneCharacters, characters, actions);

          // Then handle character entrances and positioning
          this.generateCharacterEntrances(sceneCharacters, characters, actions);
        }
      }
    }

    // Handle dialogue-specific actions
    if (nodeType === 'dialogue') {
      const characterId = node.getCharacterId();
      const text = node.getText();
      const mood = node.getMood();

      if (characterId && characters.has(characterId)) {
        // Get character's current state
        const state = this.getCharacterState(characterId, characters);

        // Determine if character needs to enter the scene
        if (!state.isVisible) {
          actions.push({
            type: 'ENTER',
            characterId,
            position: CharacterPosition.CENTER,
            emotion: this.determineEmotion(mood, state)
          });
        }

        // Change emotion if needed
        if (mood && this.emotionNeedsChanging(mood, state)) {
          actions.push({
            type: 'CHANGE_EMOTION',
            characterId,
            emotion: this.determineEmotion(mood, state)
          });
        }

        // Add speak action if there's text
        if (text) {
          actions.push({
            type: 'SPEAK',
            characterId,
            text,
            emotion: this.determineEmotion(mood, state)
          });

          // Add an emote animation after speaking if appropriate
          if (this.shouldEmoteAfterSpeaking(text, mood)) {
            actions.push({
              type: 'ANIMATE',
              characterId,
              animation: CharacterAnimation.EMOTE,
              customParams: { intensity: this.determineEmoteIntensity(text, mood) }
            });
          }
        }
      }
    }

    // Apply any explicit animations from the node
    const animations = node.getAnimations();
    if (animations) {
      animations.forEach((animation) => {
        if (animation.target && characters.has(animation.target)) {
          // Convert story animation to character action
          actions.push(this.convertAnimationToAction(animation));
        }
      });
    }

    return actions;
  }

  /**
   * Generate actions to remove characters not in the new scene
   */
  private generateCharacterExits(
    sceneCharacters: Array<{ id: string; position: string; expression?: string }>,
    characters: Map<string, Character>,
    actions: CharacterAction[]
  ): void {
    // Get list of character IDs in the new scene
    const sceneCharacterIds = sceneCharacters.map((c) => c.id);

    // Check each active character to see if they should exit
    for (const [characterId, character] of characters.entries()) {
      const state = character.getState();
      if (state.isVisible && !sceneCharacterIds.includes(characterId)) {
        // Character is visible but not in the new scene - make them exit
        actions.push({
          type: 'EXIT',
          characterId,
          position:
            state.position === CharacterPosition.LEFT
              ? CharacterPosition.OFF_SCREEN_LEFT
              : CharacterPosition.OFF_SCREEN_RIGHT,
          duration: this.determineTransitionDuration(character, 'exit')
        });
      }
    }
  }

  /**
   * Generate actions to introduce and position characters in the scene
   */
  private generateCharacterEntrances(
    sceneCharacters: Array<{ id: string; position: string; expression?: string }>,
    characters: Map<string, Character>,
    actions: CharacterAction[]
  ): void {
    sceneCharacters.forEach((sceneChar) => {
      const character = characters.get(sceneChar.id);
      if (!character) return;

      const state = character.getState();
      const targetPosition = this.convertPositionString(sceneChar.position);

      // If character is not visible, make them enter
      if (!state.isVisible) {
        actions.push({
          type: 'ENTER',
          characterId: sceneChar.id,
          position: targetPosition,
          emotion: this.convertExpressionString(sceneChar.expression) || state.currentEmotion,
          duration: this.determineTransitionDuration(character, 'enter')
        });
      }
      // If character is visible but in wrong position, move them
      else if (state.position !== targetPosition) {
        actions.push({
          type: 'MOVE',
          characterId: sceneChar.id,
          position: targetPosition,
          duration: this.determineTransitionDuration(character, 'move')
        });
      }

      // Update emotion if needed
      if (
        sceneChar.expression &&
        this.convertExpressionString(sceneChar.expression) !== state.currentEmotion
      ) {
        actions.push({
          type: 'CHANGE_EMOTION',
          characterId: sceneChar.id,
          emotion: this.convertExpressionString(sceneChar.expression) || CharacterEmotion.NEUTRAL
        });
      }
    });
  }

  /**
   * Get current character state, creating default if needed
   */
  private getCharacterState(
    characterId: string,
    characters: Map<string, Character>
  ): CharacterState {
    const character = characters.get(characterId);
    if (!character) {
      // Return a default state if character not found
      return {
        id: characterId,
        position: CharacterPosition.OFF_SCREEN_LEFT,
        currentEmotion: CharacterEmotion.NEUTRAL,
        isVisible: false,
        customState: {}
      };
    }

    // Get actual state from character and cache it
    const state = character.getState();
    this.characterStates.set(characterId, state);
    return state;
  }

  /**
   * Convert a position string from the story to a CharacterPosition enum
   */
  private convertPositionString(position: string): CharacterPosition {
    switch (position.toLowerCase()) {
      case 'left':
        return CharacterPosition.LEFT;
      case 'center':
        return CharacterPosition.CENTER;
      case 'right':
        return CharacterPosition.RIGHT;
      case 'offscreenleft':
        return CharacterPosition.OFF_SCREEN_LEFT;
      case 'offscreenright':
        return CharacterPosition.OFF_SCREEN_RIGHT;
      default:
        return CharacterPosition.CENTER;
    }
  }

  /**
   * Convert an expression string from the story to a CharacterEmotion enum
   */
  private convertExpressionString(expression?: string): CharacterEmotion | undefined {
    if (!expression) return undefined;

    switch (expression.toLowerCase()) {
      case 'neutral':
        return CharacterEmotion.NEUTRAL;
      case 'happy':
        return CharacterEmotion.HAPPY;
      case 'sad':
        return CharacterEmotion.SAD;
      case 'angry':
        return CharacterEmotion.ANGRY;
      case 'surprised':
        return CharacterEmotion.SURPRISED;
      case 'thoughtful':
        return CharacterEmotion.THOUGHTFUL;
      case 'worried':
        return CharacterEmotion.WORRIED;
      case 'excited':
        return CharacterEmotion.EXCITED;
      default:
        return CharacterEmotion.NEUTRAL;
    }
  }

  /**
   * Determine if an emotion change is needed based on the mood and current state
   */
  private emotionNeedsChanging(mood: string, state: CharacterState): boolean {
    const targetEmotion = this.determineEmotion(mood, state);
    return targetEmotion !== state.currentEmotion;
  }

  /**
   * Intelligently determine appropriate emotion based on mood and context
   */
  private determineEmotion(mood: string | undefined, state: CharacterState): CharacterEmotion {
    if (!mood) return state.currentEmotion;

    // Direct mapping of mood strings to emotions
    switch (mood.toLowerCase()) {
      case 'happy':
      case 'joyful':
      case 'cheerful':
        return CharacterEmotion.HAPPY;

      case 'sad':
      case 'unhappy':
      case 'depressed':
        return CharacterEmotion.SAD;

      case 'angry':
      case 'mad':
      case 'furious':
        return CharacterEmotion.ANGRY;

      case 'surprised':
      case 'shocked':
      case 'astonished':
        return CharacterEmotion.SURPRISED;

      case 'thoughtful':
      case 'contemplative':
      case 'pensive':
        return CharacterEmotion.THOUGHTFUL;

      case 'worried':
      case 'anxious':
      case 'nervous':
        return CharacterEmotion.WORRIED;

      case 'excited':
      case 'enthusiastic':
      case 'thrilled':
        return CharacterEmotion.EXCITED;

      case 'neutral':
      default:
        return CharacterEmotion.NEUTRAL;
    }
  }

  /**
   * Determine transition duration based on character and action type
   */
  private determineTransitionDuration(character: Character, actionType: string): number {
    // You could base this on character traits, distance, or other factors
    switch (actionType) {
      case 'enter':
        return 0.8;
      case 'exit':
        return 0.7;
      case 'move':
        return 0.5;
      default:
        return 0.5;
    }
  }

  /**
   * Analyze text and mood to determine if character should emote after speaking
   */
  private shouldEmoteAfterSpeaking(text: string, mood?: string): boolean {
    // Look for exclamation marks or question marks
    if (text.includes('!') || text.includes('?')) return true;

    // Emote for certain moods
    if (mood && ['excited', 'angry', 'surprised'].includes(mood.toLowerCase())) return true;

    // Simple probability-based emoting (30% chance)
    return Math.random() < 0.3;
  }

  /**
   * Determine emote animation intensity based on text analysis
   */
  private determineEmoteIntensity(text: string, mood?: string): number {
    let intensity = 0.5; // Default medium intensity

    // Increase intensity for exclamations
    const exclamationCount = (text.match(/!/g) || []).length;
    intensity += exclamationCount * 0.1;

    // Adjust for question marks
    const questionCount = (text.match(/\?/g) || []).length;
    intensity += questionCount * 0.05;

    // Adjust for CAPS (shouting)
    const capsRatio =
      text.split(' ').filter((word) => word === word.toUpperCase() && word.length > 1).length /
      text.split(' ').length;
    intensity += capsRatio * 0.2;

    // Adjust for mood
    if (mood) {
      switch (mood.toLowerCase()) {
        case 'excited':
        case 'angry':
          intensity += 0.2;
          break;
        case 'surprised':
          intensity += 0.15;
          break;
        case 'sad':
        case 'thoughtful':
          intensity -= 0.1;
          break;
      }
    }

    // Clamp between 0.1 and 1.0
    return Math.min(Math.max(intensity, 0.1), 1.0);
  }

  /**
   * Convert a StoryAnimation to a CharacterAction
   */
  private convertAnimationToAction(animation: any): CharacterAction {
    const action: CharacterAction = {
      type: 'ANIMATE',
      characterId: animation.target,
      animation: animation.type,
      customParams: animation.parameters || {}
    };

    if (animation.duration) {
      action.duration = animation.duration;
    }

    return action;
  }

  /**
   * Helper method to generate more natural character interactions
   * based on narrative context
   */
  public generateContextualActions(
    currentNode: StoryNode,
    nextNode: StoryNode | null,
    characters: Map<string, Character>
  ): CharacterAction[] {
    const actions: CharacterAction[] = [];

    // If no next node, we can't do contextual actions
    if (!nextNode) return actions;

    // Current and next character IDs
    const currentCharId = currentNode.getCharacterId();
    const nextCharId = nextNode.getCharacterId();

    // If we're switching speakers, generate actions for the transition
    if (currentCharId && nextCharId && currentCharId !== nextCharId) {
      // Get character states
      const currentChar = characters.get(currentCharId);
      const nextChar = characters.get(nextCharId);

      if (currentChar && nextChar) {
        const currentState = currentChar.getState();
        const nextState = nextChar.getState();

        // If next speaker isn't visible, bring them in
        if (!nextState.isVisible) {
          // Determine enter position based on relation to current speaker
          const enterPosition = this.determineEnterPosition(currentState.position);

          actions.push({
            type: 'ENTER',
            characterId: nextCharId,
            position: enterPosition,
            emotion: nextNode.getMood()
              ? this.determineEmotion(nextNode.getMood(), nextState)
              : nextState.currentEmotion
          });
        }

        // Have current speaker look in direction of next speaker
        if (currentState.isVisible && nextState.isVisible) {
          // Only add if speakers are in different positions
          if (currentState.position !== nextState.position) {
            actions.push({
              type: 'ANIMATE',
              characterId: currentCharId,
              animation: 'lookAt',
              customParams: { target: nextState.position }
            });
          }
        }
      }
    }

    return actions;
  }

  /**
   * Determine best enter position based on current speaker position
   */
  private determineEnterPosition(currentPosition: CharacterPosition): CharacterPosition {
    switch (currentPosition) {
      case CharacterPosition.LEFT:
        return CharacterPosition.RIGHT;
      case CharacterPosition.RIGHT:
        return CharacterPosition.LEFT;
      case CharacterPosition.CENTER:
        // Randomly choose left or right
        return Math.random() < 0.5 ? CharacterPosition.LEFT : CharacterPosition.RIGHT;
      default:
        return CharacterPosition.CENTER;
    }
  }

  /**
   * Reset the generator state (e.g., between scenes or chapters)
   */
  public reset(): void {
    this.characterStates.clear();
    this.currentSceneId = null;
    this.previousNodeIds = [];
  }
}
