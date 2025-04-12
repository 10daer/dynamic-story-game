import * as PIXI from 'pixi.js';
import { Scene } from '../../game/scenes/Scene';
import { SceneManager } from '../../game/scenes/SceneManager';
import { AnimationPreset, StoryAnimator } from '../animations/StoryAnimator';
import { EventEmitter } from '../events/EventEmitter';
import { StoryNode as IStoryNode, Story } from './StoryData';
import { StoryNode } from './StoryNode';
import { StoryParser } from './StoryParser';

export class StoryManager extends EventEmitter {
  private story: Story | null = null;
  private nodes: Map<string, StoryNode> = new Map();
  private currentNode: StoryNode | null = null;
  private gameState: Record<string, any> = {};
  private history: string[] = [];
  private storyAnimator?: StoryAnimator;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager, storyAnimator?: StoryAnimator) {
    super();
    this.sceneManager = sceneManager;
    this.storyAnimator = storyAnimator;
  }

  /**
   * Load a story from JSON data
   * @param jsonData JSON story data
   */
  public loadFromJson(jsonData: string): void {
    try {
      this.story = StoryParser.parseFromJson(jsonData);
      this.initializeStory();
    } catch (error) {
      console.error('Failed to load story from JSON:', error);
      throw error;
    }
  }

  private handleNodeAnimations(node: StoryNode): void {
    if (!this.storyAnimator || !node) return;

    const animations = node.getAnimations();
    if (!animations || animations.length === 0) return;

    // Process each animation defined in the node
    animations.forEach((animation) => {
      // Find the target element - this would depend on your rendering system
      // In a real implementation, you'd need to get the actual PIXI.DisplayObject
      const target = this.findTargetElement(animation.target);
      if (!target) return;

      // Apply the animation based on its type
      if (typeof animation.type === 'string') {
        if (this.storyAnimator?.applyPreset) {
          this.storyAnimator.applyPreset(target, animation.type as AnimationPreset, {
            duration: animation.duration,
            delay: animation.delay,
            ease: animation.ease,
            scale: animation.scale,
            distance: animation.distance
          });
        }
      }

      // Handle special animation cases
      if (animation.cameraEffect && this.storyAnimator?.cameraEffect) {
        const effect = animation.cameraEffect;
        // Assuming the scene container is accessible
        const sceneContainer = this.getSceneContainer();
        if (sceneContainer) {
          this.storyAnimator.cameraEffect(sceneContainer, effect.type, {
            targetX: effect.targetX,
            targetY: effect.targetY,
            targetScale: effect.targetScale,
            duration: animation.duration
          });
        }
      }

      // Similar handling for other special animation types...
    });
  }

  // Helper method to find target elements - implementation depends on your rendering system
  private findTargetElement(targetId: string): PIXI.DisplayObject | null {
    const sceneContainer = this.getSceneContainer();
    if (!sceneContainer) return null;

    const search = (container: PIXI.Container): PIXI.DisplayObject | null => {
      for (const child of container.children) {
        if (child.name === targetId) {
          return child;
        }
        if (child instanceof PIXI.Container) {
          const found = search(child);
          if (found) return found;
        }
      }
      return null;
    };

    return search(sceneContainer);
  }

  // Helper method to get the scene container
  private getSceneContainer(): PIXI.Container | null {
    const scene: Scene | null = this.sceneManager.getCurrentScene();
    if (!scene) return null;
    return scene.getContainer();
  }

  /**
   * Load a story from YAML data
   * @param yamlData YAML story data
   */
  public loadFromYaml(yamlData: string): void {
    try {
      this.story = StoryParser.parseFromYaml(yamlData);
      this.initializeStory();
    } catch (error) {
      console.error('Failed to load story from YAML:', error);
      throw error;
    }
  }

  // Add these methods to the StoryManager class

  /**
   * Get the current node ID
   */
  public getCurrentNodeId(): string | null {
    return this.currentNode ? this.currentNode.getId() : null;
  }

  /**
   * Get list of visited nodes
   */
  public getVisitedNodes(): string[] {
    return [...this.history];
  }

  /**
   * Get list of completed branches
   */
  public getCompletedBranches(): string[] {
    const completedBranches: string[] = [];

    for (const [nodeId, node] of this.nodes.entries()) {
      if (node.getType() === 'branch' && this.history.includes(nodeId)) {
        completedBranches.push(nodeId);
      }
    }

    return completedBranches;
  }

  /**
   * Load story progress from save data
   * @param currentNodeId Current node ID
   * @param visitedNodes Array of visited node IDs
   * @param completedBranches Array of completed branch IDs
   */
  public loadProgress(
    currentNodeId: string | null,
    visitedNodes: string[] = [],
    completedBranches: string[] = []
  ): void {
    if (!this.story) return;

    // Reset story state
    this.gameState = { ...this.story.initialState };

    // Update history
    this.history = [...visitedNodes];

    // Navigate to current node
    if (currentNodeId && this.nodes.has(currentNodeId)) {
      // Reset current node
      this.currentNode = null;

      // Navigate to the saved node
      this.navigateToNode(currentNodeId);

      // Emit story resumed event
      this.emit('story:resumed', currentNodeId);
    } else {
      // If no valid current node, restart from beginning
      this.start();
    }
  }

  /**
   * Check if a specific node ID exists
   * @param nodeId Node ID to check
   */
  public hasNode(nodeId: string): boolean {
    return this.nodes.has(nodeId);
  }

  /**
   * Get all available nodes
   */
  public getAllNodes(): Map<string, StoryNode> {
    return new Map(this.nodes);
  }

  /**
   * Get all nodes of a specific type
   * @param type Node type
   */
  public getNodesByType(type: string): StoryNode[] {
    const result: StoryNode[] = [];

    for (const node of this.nodes.values()) {
      if (node.getType() === type) {
        result.push(node);
      }
    }

    return result;
  }

  /**
   * Jump to a specific node (bypassing normal flow)
   * This is useful for debugging or special control flow
   * @param nodeId Node ID to jump to
   * @param preserveHistory Whether to preserve history
   */
  public jumpToNode(nodeId: string, preserveHistory: boolean = false): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node with ID "${nodeId}" does not exist`);
    }

    // If not preserving history, clear it
    if (!preserveHistory) {
      this.history = [];
    }

    // Navigate to node
    this.navigateToNode(nodeId);

    // Emit jump event
    this.emit('story:jump', nodeId, preserveHistory);
  }

  /**
   * Initialize the story after loading
   */
  private initializeStory(): void {
    if (!this.story) return;

    // Clear existing nodes
    this.nodes.clear();

    // Create node objects
    for (const [nodeId, nodeData] of Object.entries(this.story.nodes)) {
      this.nodes.set(nodeId, new StoryNode(nodeData));
    }

    // Initialize game state
    this.gameState = { ...this.story.initialState };

    // Clear history
    this.history = [];

    // Emit story loaded event
    this.emit('story:loaded', this.story);
  }

  /**
   * Start the story
   */
  public start(): void {
    if (!this.story) {
      throw new Error('No story loaded');
    }

    this.navigateToNode(this.story.startNode);
    this.emit('story:started', this.story);
  }

  /**
   * Navigate to a specific node
   * @param nodeId ID of the node to navigate to
   */
  public navigateToNode(nodeId: string): void {
    // Existing navigation code...
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node with ID "${nodeId}" does not exist`);
    }

    // Execute onExit for current node if it exists
    if (this.currentNode) {
      this.currentNode.executeOnExit(this.gameState);
      this.emit('node:exit', this.currentNode);
    }

    // Update current node
    const prevNode = this.currentNode;
    this.currentNode = this.nodes.get(nodeId)!;

    // Add to history
    this.history.push(nodeId);

    // Apply state changes
    const stateChanges = this.currentNode.getStateChanges();
    if (stateChanges) {
      this.updateGameState(stateChanges);
    }

    // Execute onEnter for new node
    this.currentNode.executeOnEnter(this.gameState);

    // Handle node animations - new method
    this.handleNodeAnimations(this.currentNode);

    // Emit node changed event
    this.emit('node:enter', this.currentNode, prevNode);

    // Handle automatic progression for specific node types
    this.handleAutoProgress();
  }

  /**
   * Handle automatic progression based on node type
   */
  private handleAutoProgress(): void {
    if (!this.currentNode) return;

    const nodeType = this.currentNode.getType();

    switch (nodeType) {
      case 'scene':
        // For scene nodes, get scene ID and check if it exists
        const sceneId = this.currentNode.getSceneId();

        // If scene ID is specified and scene exists
        if (sceneId && this.sceneManager.hasScene(sceneId)) {
          // Get transition type from metadata (if any)
          const metadata = this.currentNode.getMetadata();
          const transition = metadata?.transition || 'default';
          const transitionType = typeof transition === 'string' ? transition : transition.type;

          // Use timeout to allow the current flow to complete
          setTimeout(() => {
            this.sceneManager.switchTo(sceneId, transitionType);
          }, 0);
        } else {
          // No scene ID or invalid scene ID - just progress to next node
          const nextNodeId = this.currentNode.getNextNodeId();
          if (nextNodeId) {
            setTimeout(() => this.navigateToNode(nextNodeId), 0);
          }
        }
        break;

      case 'branch':
        // For branch nodes, evaluate condition and progress automatically
        if (this.currentNode.evaluateCondition(this.gameState)) {
          const nextNodeId = this.currentNode.getNextNodeId();
          if (nextNodeId) {
            // Use setTimeout to allow the current flow to complete first
            setTimeout(() => this.navigateToNode(nextNodeId), 0);
          }
        }
        break;

      // Other types don't auto-progress
      case 'dialogue':
      case 'choice':
      case 'end':
        break;
    }
  }

  /**
   * Make a choice in a choice node
   * @param choiceIndex Index of the choice to make
   */
  public makeChoice(choiceIndex: number): void {
    if (!this.currentNode || this.currentNode.getType() !== 'choice') {
      throw new Error('Cannot make a choice: Current node is not a choice node');
    }

    const availableChoices = this.currentNode.getAvailableChoices(this.gameState);

    if (choiceIndex < 0 || choiceIndex >= availableChoices.length) {
      throw new Error(`Invalid choice index: ${choiceIndex}`);
    }

    const choice = availableChoices[choiceIndex];

    // Apply state changes from the choice
    if (choice.stateChanges) {
      this.updateGameState(choice.stateChanges);
    }

    // Emit choice made event
    this.emit('choice:made', choice, choiceIndex);

    // Navigate to the next node
    this.navigateToNode(choice.nextNode);
  }

  /**
   * Progress to the next node (for dialogue/scene nodes)
   */
  public progress(): void {
    if (!this.currentNode) {
      throw new Error('Cannot progress: No current node');
    }

    if (this.currentNode.getType() === 'choice') {
      throw new Error('Cannot progress: Current node is a choice node, use makeChoice instead');
    }

    if (this.currentNode.getType() === 'end') {
      throw new Error('Cannot progress: Current node is an end node');
    }

    const nextNodeId = this.currentNode.getNextNodeId();

    if (!nextNodeId) {
      throw new Error('Cannot progress: Current node has no next node defined');
    }

    this.navigateToNode(nextNodeId);
  }

  /**
   * Update the game state
   * @param changes State changes to apply
   */
  public updateGameState(changes: Record<string, any>): void {
    const prevState = { ...this.gameState };

    // Apply changes
    this.gameState = {
      ...this.gameState,
      ...changes
    };

    // Emit state changed event
    this.emit('state:changed', this.gameState, prevState, changes);
  }

  /**
   * Get the current node
   */
  public getCurrentNode(): StoryNode | null {
    return this.currentNode;
  }

  /**
   * Get the current game state
   */
  public getGameState(): Record<string, any> {
    return { ...this.gameState };
  }

  /**
   * Get the loaded story
   */
  public getStory(): Story | null {
    return this.story;
  }

  /**
   * Get node history
   */
  public getHistory(): string[] {
    return [...this.history];
  }

  /**
   * Reset the story back to the start
   */
  public reset(): void {
    if (!this.story) return;

    // Reset game state
    this.gameState = { ...this.story.initialState };

    // Clear history
    this.history = [];

    // Reset current node
    this.currentNode = null;

    // Emit reset event
    this.emit('story:reset');

    // Start from beginning
    this.start();
  }

  /**
   * Get a specific node by ID
   * @param nodeId Node ID
   */
  public getNode(nodeId: string): StoryNode | undefined {
    return this.nodes.get(nodeId);
  }
}
