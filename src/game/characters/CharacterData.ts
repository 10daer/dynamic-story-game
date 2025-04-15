export enum CharacterPosition {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  OFF_SCREEN_LEFT = 'offScreenLeft',
  OFF_SCREEN_RIGHT = 'offScreenRight'
}

export enum CharacterEmotion {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  SURPRISED = 'surprised',
  THOUGHTFUL = 'thoughtful',
  WORRIED = 'worried',
  EXCITED = 'excited',
  DETERMINED = 'determined',
  POWERFUL = 'powerful',
  ETHEREAL = 'ethereal'
}

export enum CharacterAnimation {
  IDLE = 'idle',
  TALK = 'talk',
  WALK_IN = 'walkIn',
  WALK_OUT = 'walkOut',
  EMOTE = 'emote',
  CUSTOM = 'custom'
}

export interface CharacterPose {
  id: string;
  emotion: CharacterEmotion;
  texturePath: string;
  animationSequence?: string; // For animated poses, references an animation ID
}

export interface CharacterConfig extends CharacterData, CharacterState {}

export interface CharacterData {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  defaultEmotion: CharacterEmotion;
  poses: CharacterPose[];
  scale?: number;
  speechColor?: number; // PIXI color format (hex)
  speechFont?: string;
  meta?: Record<string, any>; // Any additional character-specific data
}

export interface CharacterState {
  id: string;
  position: CharacterPosition;
  currentEmotion: CharacterEmotion;
  currentAnimation?: CharacterAnimation;
  isVisible: boolean;
  customState: Record<string, any>; // For additional state info
}

export interface CharacterAction {
  type: 'ENTER' | 'EXIT' | 'MOVE' | 'CHANGE_EMOTION' | 'ANIMATE' | 'SPEAK';
  characterId: string;
  position?: CharacterPosition;
  emotion?: CharacterEmotion;
  animation?: CharacterAnimation | string;
  duration?: number;
  text?: string;
  audioId?: string;
  customParams?: Record<string, any>;
}
