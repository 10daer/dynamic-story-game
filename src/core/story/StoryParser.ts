import YAML from 'yaml';
import { Story, StoryNode } from './StoryData';

export class StoryParser {
  /**
   * Parse a JSON story file
   * @param jsonData The JSON data to parse
   */
  public static parseFromJson(jsonData: string): Story {
    try {
      const parsedData = JSON.parse(jsonData);
      return this.validateStory(parsedData);
    } catch (error) {
      throw new Error(`Failed to parse story JSON: ${error}`);
    }
  }

  /**
   * Parse a YAML story file
   * @param yamlData The YAML data to parse
   */
  public static parseFromYaml(yamlData: string): Story {
    try {
      const parsedData = YAML.parse(yamlData);
      const story = this.validateStory(parsedData);
      return story;
    } catch (error) {
      throw new Error(`Failed to parse story YAML: ${error}`);
    }
  }

  /**
   * Validate the story structure
   * @param data The story data to validate
   */
  private static validateStory(data: any): Story {
    // Check required fields
    if (!data.id) throw new Error('Story must have an ID');
    if (!data.title) throw new Error('Story must have a title');
    if (!data.startNode) throw new Error('Story must have a startNode');
    if (!data.nodes || Object.keys(data.nodes).length === 0) {
      throw new Error('Story must have at least one node');
    }

    // Validate that startNode exists in nodes
    if (!data.nodes[data.startNode]) {
      throw new Error(`Start node '${data.startNode}' does not exist in story nodes`);
    }

    // Validate each node
    // for (const [nodeId, node] of Object.entries(data.nodes)) {
    //   this.validateNode(nodeId, node as StoryNode, data.nodes);
    // }

    // Check for unreachable nodes (optional, can be resource-intensive for large stories)
    // this.checkForUnreachableNodes(data);

    return data as Story;
  }

  /**
   * Validate a story node
   * @param nodeId The ID of the node
   * @param node The node to validate
   * @param allNodes All nodes in the story
   */
  private static validateNode(
    nodeId: string,
    node: StoryNode,
    allNodes: Record<string, StoryNode>
  ): void {
    // Check node type
    if (!node.type) {
      throw new Error(`Node '${nodeId}' must have a type`);
    }

    // Validate based on node type
    switch (node.type) {
      case 'dialogue':
        if (!node.text) {
          throw new Error(`Dialogue node '${nodeId}' must have text`);
        }
        break;

      case 'choice':
        if (!node.choices || node.choices.length === 0) {
          throw new Error(`Choice node '${nodeId}' must have at least one choice`);
        }

        // Validate that all choice nextNodes exist
        for (const choice of node.choices) {
          if (!choice.nextNode) {
            throw new Error(`Choice in node '${nodeId}' must have a nextNode`);
          }

          if (!allNodes[choice.nextNode]) {
            throw new Error(
              `Choice nextNode '${choice.nextNode}' in node '${nodeId}' does not exist`
            );
          }
        }
        break;

      case 'branch':
        if (!node.condition) {
          throw new Error(`Branch node '${nodeId}' must have a condition`);
        }

        if (!node.nextNode) {
          throw new Error(`Branch node '${nodeId}' must have a nextNode`);
        }
        break;

      case 'scene':
        if (allNodes[nodeId].type === 'scene' && !allNodes[nodeId].sceneId) {
          throw new Error(`Branch node '${nodeId}' must have a sceneId`);
        }
        break;

      case 'end':
        // End nodes don't need validation
        break;

      default:
        throw new Error(`Unknown node type '${node.type}' in node '${nodeId}'`);
    }

    // Validate nextNode exists if specified
    if (node.nextNode && !allNodes[node.nextNode]) {
      throw new Error(`NextNode '${node.nextNode}' in node '${nodeId}' does not exist`);
    }

    // Validate animations if present
    if (node.animations) {
      for (const animation of node.animations) {
        if (!animation.target) {
          throw new Error(`Animation in node '${nodeId}' must have a target`);
        }
        if (!animation.type) {
          throw new Error(`Animation in node '${nodeId}' must have a type`);
        }
      }
    }

    // Validate dialogue options if present
    if (node.dialogueOptions) {
      // Basic validation for dialogue options
      if (
        node.dialogueOptions.textEffects &&
        !['wave', 'shake', 'bounce', 'typewriter'].includes(node.dialogueOptions.textEffects.type)
      ) {
        throw new Error(`Invalid text effect type in node '${nodeId}'`);
      }
    }
  }

  /**
   * Check for unreachable nodes in the story
   * @param story The story data
   */
  private static checkForUnreachableNodes(story: Story): void {
    const reachableNodes = new Set<string>();

    // Function to recursively mark nodes as reachable
    const markReachable = (nodeId: string) => {
      if (reachableNodes.has(nodeId)) return;

      reachableNodes.add(nodeId);
      const node = story.nodes[nodeId];

      if (node.nextNode) {
        markReachable(node.nextNode);
      }

      if (node.choices) {
        for (const choice of node.choices) {
          markReachable(choice.nextNode);
        }
      }
    };

    // Start marking from the start node
    markReachable(story.startNode);

    // Check for unreachable nodes
    const unreachableNodes = Object.keys(story.nodes).filter(
      (nodeId) => !reachableNodes.has(nodeId)
    );

    if (unreachableNodes.length > 0) {
      console.warn(`Story has unreachable nodes: ${unreachableNodes.join(', ')}`);
    }
  }
}
