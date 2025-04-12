import { AnimationPreset } from '../../core/animations/StoryAnimator';
import { EasingFunction } from '../animations/AnimationManager';

/**
 * Defines the structure for story content in YAML/JSON format
 */

// Add dialogue-specific properties
export interface DialogueOptions {
  speed?: number; // Text display speed
  autoProgress?: boolean; // Auto progress after text is shown
  textEffects?: {
    type: 'wave' | 'shake' | 'bounce' | 'typewriter';
    intensity?: number;
  };
}

/**
 * Interface for choice options in dialogues
 */
export interface StoryChoice {
  id: string;
  text: string;
  nextNode: string;
  condition?: string; // Condition based on game state
  stateChanges?: Record<string, any>; // State changes when this choice is selected
}

/**
 * Interface for character definition
 */
export interface StoryCharacter {
  id: string;
  name: string;
  displayName?: string;
  avatarId?: string;
  textColor?: string;
  textSpeed?: number; // Characters per second
}

/**
 * Interface for background definition
 */
export interface StoryBackground {
  id: string;
  imageId: string;
  transition?: string;
}

/**
 * Interface for animation definition
 */
export interface StoryAnimation {
  target: string; // Target element ID
  type: string | AnimationPreset; // Animation type or preset
  duration?: number;
  delay?: number;
  ease?: EasingFunction;
  scale?: number;
  distance?: number;
  repeat?: number;
  direction?: 'left' | 'right' | 'top' | 'bottom'; // For character enter/exit
  parameters?: Record<string, any>;

  // For camera effects
  cameraEffect?: {
    type: 'shake' | 'zoom' | 'pan' | 'fadeToBlack';
    targetX?: number;
    targetY?: number;
    targetScale?: number;
  };

  // For background transitions
  backgroundTransition?: {
    type: 'fade' | 'crossfade' | 'slideLeft' | 'slideRight';
  };

  // For dialogue box animations
  dialogueBoxAnimation?: {
    type: 'show' | 'hide' | 'emphasize';
  };
}

/**
 * Interface for audio definition
 */
export interface StoryAudio {
  id: string;
  file: string;
  volume?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export interface NodeMetadata {
  transition?:
    | string
    | {
        type: string;
        duration?: number;
      };
  effect?:
    | string
    | {
        type: string;
        intensity?: number;
        duration?: number;
      };
  animation?: {
    in?: string;
    out?: string;
  };
  textSpeed?: number;
  textEffect?: string;
  emotion?: string;
  choiceAnimation?: string;
}

/**
 * Interface for a single node in the story
 */
export interface StoryNode {
  id: string;
  type: 'dialogue' | 'scene' | 'choice' | 'branch' | 'end';

  // Dialogue specific properties
  character?: string;
  text?: string;
  textSpeed?: number;

  // Choice specific properties
  choices?: StoryChoice[];

  // Scene specific properties
  background?: string | StoryBackground;
  characters?: Array<{ id: string; position: string; expression?: string }>;

  // Effects
  animations?: StoryAnimation[];
  audio?: string | StoryAudio;

  // Branch logic
  condition?: string;
  onEnter?: string; // Script to run when entering this node
  onExit?: string; // Script to run when exiting this node

  // Navigation
  nextNode?: string;

  // State changes
  stateChanges?: Record<string, any>;

  // Metadata
  tags?: string[];

  dialogueOptions?: DialogueOptions;
  metadata?: NodeMetadata;
  sceneId: string;

  characterId?: string;
  mood?: string;

  // condition?: {
  //   variable: string;
  //   operator: string;
  //   value: any;
  // };
}

/**
 * Interface for the entire story structure
 */
export interface Story {
  id: string;
  title: string;
  author?: string;
  version?: string;

  // Story metadata
  description?: string;
  tags?: string[];

  // Assets required by the story
  assets?: {
    images?: Record<string, string>;
    audio?: Record<string, string>;
    characters?: Record<string, StoryCharacter>;
    backgrounds?: Record<string, StoryBackground>;
  };

  // Initial game state
  initialState?: Record<string, any>;

  // Starting node
  startNode: string;

  // Story content
  nodes: Record<string, StoryNode>;
}
