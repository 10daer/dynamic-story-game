import { EventEmitter } from '../events/EventEmitter';
import { StoryNode as IStoryNode, NodeMetadata, StoryChoice } from './StoryData';

export class StoryNode extends EventEmitter {
  private data: IStoryNode;

  constructor(nodeData: IStoryNode) {
    super();
    this.data = nodeData;
  }

  public setMetadata(metadata: NodeMetadata): void {
    this.data.metadata = metadata;
  }

  // Add a method to return properly typed metadata
  public getMetadata(): NodeMetadata | undefined {
    return this.data.metadata;
  }

  /**
   * Get the scene ID (for scene type nodes)
   */
  public getSceneId(): string | undefined {
    if (this.data.type === 'scene') {
      return this.data.sceneId;
    }
    return undefined;
  }

  /**
   * Get the mood of the node
   */
  public getMood(): string | undefined {
    // Return the mood if it exists, otherwise undefined
    return this.data.mood;
  }

  /**
   * Get the node ID
   */
  public getId(): string {
    return this.data.id;
  }

  /**
   * Get the node type
   */
  public getType(): string {
    return this.data.type;
  }

  /**
   * Get the text content for dialogue nodes
   */
  public getText(): string | undefined {
    return this.data.text;
  }

  /**
   * Get animations for this node with applied conditions
   */
  public getAnimations() {
    // Return animations if they exist
    return this.data.animations;
  }

  /**
   * Get background transition type if specified
   */
  public getBackgroundTransitionType(): string | undefined {
    if (typeof this.data.background === 'object' && this.data.background) {
      return this.data.background.transition;
    }
    return undefined;
  }

  /**
   * Get dialogue animation options if specified
   */
  public getDialogueOptions(): any | undefined {
    return this.data.dialogueOptions;
  }

  /**
   * Get the character ID for dialogue nodes
   */
  public getCharacterId(): string | undefined {
    return this.data.character;
  }

  /**
   * Get available choices for choice nodes
   */
  public getChoices(): StoryChoice[] {
    return this.data.choices || [];
  }

  /**
   * Get the next node ID
   */
  public getNextNodeId(): string | undefined {
    return this.data.nextNode;
  }

  /**
   * Get background information
   */
  public getBackground(): string | undefined {
    if (typeof this.data.background === 'string') {
      return this.data.background;
    } else if (this.data.background) {
      return this.data.background.id;
    }
    return undefined;
  }

  /**
   * Get character information for scene nodes
   */
  public getCharacters(): Array<{ id: string; position: string; expression?: string }> | undefined {
    return this.data.characters;
  }

  /**
   * Get audio information
   */
  public getAudio() {
    return this.data.audio;
  }

  /**
   * Get state changes to apply when entering this node
   */
  public getStateChanges(): Record<string, any> | undefined {
    return this.data.stateChanges;
  }

  /**
   * Evaluate if this node's condition is met based on the game state
   * @param gameState Current game state
   */
  public evaluateCondition(gameState: Record<string, any>): boolean {
    if (!this.data.condition) return true;

    // Simple condition evaluation for demonstration
    // In a real implementation, you might want to use a proper expression evaluator
    try {
      // Using Function constructor to evaluate the condition against the gameState
      // This is a simple approach but has security implications in a real app
      const conditionFn = new Function('state', `return ${this.data.condition};`);
      return conditionFn(gameState);
    } catch (error) {
      console.error(`Error evaluating condition for node ${this.data.id}:`, error);
      return false;
    }
  }

  /**
   * Execute the onEnter script if present
   * @param gameState Current game state
   */
  public executeOnEnter(gameState: Record<string, any>): void {
    if (!this.data.onEnter) return;

    try {
      const scriptFn = new Function('state', this.data.onEnter);
      scriptFn(gameState);
    } catch (error) {
      console.error(`Error executing onEnter script for node ${this.data.id}:`, error);
    }
  }

  /**
   * Execute the onExit script if present
   * @param gameState Current game state
   */
  public executeOnExit(gameState: Record<string, any>): void {
    if (!this.data.onExit) return;

    try {
      const scriptFn = new Function('state', this.data.onExit);
      scriptFn(gameState);
    } catch (error) {
      console.error(`Error executing onExit script for node ${this.data.id}:`, error);
    }
  }

  /**
   * Filter available choices based on conditions
   * @param gameState Current game state
   */
  public getAvailableChoices(gameState: Record<string, any>): StoryChoice[] {
    if (!this.data.choices) return [];

    return this.data.choices.filter((choice) => {
      if (!choice.condition) return true;

      try {
        const conditionFn = new Function('state', `return ${choice.condition};`);
        return conditionFn(gameState);
      } catch (error) {
        console.error(`Error evaluating condition for choice in node ${this.data.id}:`, error);
        return false;
      }
    });
  }

  /**
   * Get the raw node data
   */
  public getRawData(): IStoryNode {
    return this.data;
  }
}
