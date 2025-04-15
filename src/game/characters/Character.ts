import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { EventEmitter } from '../../core/events/EventEmitter';
import {
  CharacterAnimation,
  CharacterData,
  CharacterEmotion,
  CharacterPosition,
  CharacterState
} from './CharacterData';

export class Character extends EventEmitter {
  private data: CharacterData;
  private state: CharacterState;
  private container: PIXI.Container;
  private sprite: PIXI.Sprite | null = null;
  private animations: Map<string, any> = new Map();
  private currentTween: gsap.core.Tween | null = null;

  constructor(characterData: CharacterData) {
    super();

    this.data = characterData;
    this.state = {
      id: characterData.id,
      position: CharacterPosition.OFF_SCREEN_LEFT,
      currentEmotion: characterData.defaultEmotion,
      isVisible: false,
      customState: {}
    };

    this.container = new PIXI.Container();
    this.container.name = `character-${characterData.id}`;
    this.container.visible = false;

    // Set initial scale if provided
    if (characterData.scale) {
      this.container.scale.set(characterData.scale);
    }
  }

  /**
   * Initialize character with the default pose
   */
  public async initialize(): Promise<void> {
    await this.setEmotion(this.data.defaultEmotion);
    this.emit('character:initialized', this.data.id);
  }

  /**
   * Set character emotion by changing the texture
   */
  public async setEmotion(emotion: CharacterEmotion): Promise<void> {
    const pose = this.data.poses.find((p) => p.emotion === emotion);

    if (!pose) {
      console.warn(
        `Emotion '${emotion}' not found for character '${this.data.id}', using default.`
      );
      return;
    }

    // Store previous sprite for transition if needed
    const oldSprite = this.sprite;

    // Create new sprite with the emotion texture
    // In a real implementation, you'd load this from your asset manager
    const texture = PIXI.Texture.from(pose.texturePath);
    this.sprite = new PIXI.Sprite(texture);

    // Center the sprite anchor
    this.sprite.anchor.set(0.5, 1.0); // Bottom center anchor

    // Add new sprite to container
    this.container.addChild(this.sprite);

    // Remove old sprite after a short delay (allowing for fade transition)
    if (oldSprite) {
      gsap.to(oldSprite, {
        alpha: 0,
        duration: 0.2,
        onComplete: () => {
          if (oldSprite.parent) {
            oldSprite.parent.removeChild(oldSprite);
          }
        }
      });
    }

    // Update state
    this.state.currentEmotion = emotion;

    // Emit event
    this.emit('character:emotion-change', this.data.id, emotion);
  }

  /**
   * Set character position
   */
  public setPosition(
    position: CharacterPosition,
    animated: boolean = true,
    duration: number = 0.5
  ): Promise<void> {
    return new Promise((resolve) => {
      // Calculate x position based on the screen width
      let targetX: number;
      const screenWidth = window.innerWidth;

      switch (position) {
        case CharacterPosition.LEFT:
          targetX = screenWidth * 0.25;
          break;
        case CharacterPosition.CENTER:
          targetX = screenWidth * 0.5;
          break;
        case CharacterPosition.RIGHT:
          targetX = screenWidth * 0.75;
          break;
        case CharacterPosition.OFF_SCREEN_LEFT:
          targetX = -200;
          break;
        case CharacterPosition.OFF_SCREEN_RIGHT:
          targetX = screenWidth + 200;
          break;
        default:
          targetX = screenWidth * 0.5;
      }

      if (animated && this.container.visible) {
        // Cancel any existing animations
        if (this.currentTween) {
          this.currentTween.kill();
        }

        // Animate to new position
        this.currentTween = gsap.to(this.container, {
          x: targetX,
          duration,
          ease: 'power2.inOut',
          onComplete: () => {
            this.state.position = position;
            this.currentTween = null;
            this.emit('character:position-change', this.data.id, position);
            resolve();
          }
        });
      } else {
        // Set position immediately
        this.container.x = targetX;
        this.state.position = position;
        this.emit('character:position-change', this.data.id, position);
        resolve();
      }
    });
  }

  /**
   * Show the character
   */
  public show(animated: boolean = true, duration: number = 0.5): Promise<void> {
    return new Promise((resolve) => {
      this.container.visible = true;

      if (animated) {
        // Start with 0 opacity
        this.container.alpha = 0;

        // Fade in
        gsap.to(this.container, {
          alpha: 1,
          duration,
          ease: 'power2.inOut',
          onComplete: () => {
            this.state.isVisible = true;
            this.emit('character:show', this.data.id);
            resolve();
          }
        });
      } else {
        this.container.alpha = 1;
        this.state.isVisible = true;
        this.emit('character:show', this.data.id);
        resolve();
      }
    });
  }

  /**
   * Hide the character
   */
  public hide(animated: boolean = true, duration: number = 0.5): Promise<void> {
    return new Promise((resolve) => {
      if (animated && this.container.visible) {
        // Fade out
        gsap.to(this.container, {
          alpha: 0,
          duration,
          ease: 'power2.inOut',
          onComplete: () => {
            this.container.visible = false;
            this.state.isVisible = false;
            this.emit('character:hide', this.data.id);
            resolve();
          }
        });
      } else {
        this.container.visible = false;
        this.container.alpha = 0;
        this.state.isVisible = false;
        this.emit('character:hide', this.data.id);
        resolve();
      }
    });
  }

  /**
   * Play an animation on the character
   */
  public playAnimation(animationId: CharacterAnimation | string, params?: any): Promise<void> {
    return new Promise((resolve) => {
      // In a real implementation, you'd trigger the appropriate animation
      // This could be PIXI.AnimatedSprite or a custom animation system

      // For now, we'll just emit an event and resolve
      this.state.currentAnimation = animationId as CharacterAnimation;
      this.emit('character:animation', this.data.id, animationId, params);

      // Simulate animation duration
      setTimeout(() => {
        this.state.currentAnimation = undefined;
        this.emit('character:animation-complete', this.data.id, animationId);
        resolve();
      }, 1000); // Simulated 1-second animation
    });
  }

  /**
   * Make character enter the scene
   */
  public enter(
    position: CharacterPosition = CharacterPosition.CENTER,
    startPosition: CharacterPosition = CharacterPosition.OFF_SCREEN_LEFT,
    duration: number = 0.8
  ): Promise<void> {
    return new Promise(async (resolve) => {
      // Set initial position off-screen
      await this.setPosition(startPosition, false);

      // Show character
      await this.show(false);

      // Animate to target position
      await this.setPosition(position, true, duration);

      resolve();
    });
  }

  /**
   * Make character exit the scene
   */
  public exit(
    exitPosition: CharacterPosition = CharacterPosition.OFF_SCREEN_RIGHT,
    duration: number = 0.8
  ): Promise<void> {
    return new Promise(async (resolve) => {
      // Animate to exit position
      await this.setPosition(exitPosition, true, duration);

      // Hide character
      await this.hide(true, 0.2);

      resolve();
    });
  }

  /**
   * Get character display container
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }

  /**
   * Get character data
   */
  public getData(): CharacterData {
    return this.data;
  }

  /**
   * Get character state
   */
  public getState(): CharacterState {
    return { ...this.state };
  }

  /**
   * Update character (called each frame)
   */
  public update(deltaTime: number): void {
    // Update animations or other time-based effects
    // This is a placeholder for any per-frame updates needed
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.currentTween) {
      this.currentTween.kill();
    }

    this.container.destroy({ children: true });
    this.clear(); // Clear event listeners
  }
}
