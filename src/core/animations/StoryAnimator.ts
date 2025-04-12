import * as PIXI from 'pixi.js';
import { AnimationOptions } from '../../core/animations/AnimationManager';
import {
  AnimationSequence,
  AnimationSequenceOptions
} from '../../core/animations/AnimationSequence';
import { Game } from '../../game/Game';

/**
 * Predefined animation presets for story elements
 */
export type AnimationPreset =
  | 'fadeIn'
  | 'fadeOut'
  | 'popIn'
  | 'popOut'
  | 'slideInRight'
  | 'slideOutRight'
  | 'slideInLeft'
  | 'slideOutLeft'
  | 'slideInUp'
  | 'slideOutUp'
  | 'slideInDown'
  | 'slideOutDown'
  | 'pulse'
  | 'bounce'
  | 'shake'
  | 'heartbeat'
  | 'flicker';

/**
 * Story element animation options
 */
export interface StoryAnimationOptions extends AnimationOptions {
  delay?: number;
  scale?: number;
  distance?: number;
}

/**
 * StoryAnimator handles high-level animation sequences for storytelling
 */
export class StoryAnimator {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  /**
   * Create an animation sequence for a story scene
   * @param id Unique identifier for this sequence
   * @param options Sequence options
   * @returns The created animation sequence
   */
  createSequence(id: string, options: Partial<AnimationSequenceOptions> = {}): AnimationSequence {
    return this.game.animationManager.createSequence(id, options);
  }

  /**
   * Apply a predefined animation preset to a display object
   * @param target The target object to animate
   * @param preset The animation preset to apply
   * @param options Additional animation options
   * @returns The animation id
   */
  applyPreset(
    target: PIXI.DisplayObject,
    preset: AnimationPreset,
    options: StoryAnimationOptions = {}
  ): string {
    const id = `${preset}-${target.name || Date.now()}`;
    const duration = options.duration || 0.5;
    const ease = options.ease || 'power2.out';
    const delay = options.delay || 0;
    const scale = options.scale || 1;
    const distance = options.distance || 100;

    // Store original properties for reset
    const originalX = target.x;
    const originalY = target.y;
    const originalScale = target.scale.x;
    const originalAlpha = target.alpha;
    const originalRotation = target.rotation;

    switch (preset) {
      case 'fadeIn':
        target.alpha = 0;
        this.game.animationManager.animate(
          id,
          target,
          { alpha: originalAlpha },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'fadeOut':
        this.game.animationManager.animate(
          id,
          target,
          { alpha: 0 },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'popIn':
        target.alpha = 0;
        target.scale.set(0.5);
        this.game.animationManager.animate(
          id,
          target,
          {
            alpha: originalAlpha,
            scaleX: originalScale,
            scaleY: originalScale
          },
          {
            duration,
            ease: 'back.out',
            delay
          }
        );
        break;

      case 'popOut':
        this.game.animationManager.animate(
          id,
          target,
          {
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5
          },
          {
            duration,
            ease: 'back.in',
            delay
          }
        );
        break;

      case 'slideInRight':
        target.x = originalX + distance;
        target.alpha = 0;
        this.game.animationManager.animate(
          id,
          target,
          {
            x: originalX,
            alpha: originalAlpha
          },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'slideOutRight':
        this.game.animationManager.animate(
          id,
          target,
          {
            x: originalX + distance,
            alpha: 0
          },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'slideInLeft':
        target.x = originalX - distance;
        target.alpha = 0;
        this.game.animationManager.animate(
          id,
          target,
          {
            x: originalX,
            alpha: originalAlpha
          },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'slideOutLeft':
        this.game.animationManager.animate(
          id,
          target,
          {
            x: originalX - distance,
            alpha: 0
          },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'slideInUp':
        target.y = originalY - distance;
        target.alpha = 0;
        this.game.animationManager.animate(
          id,
          target,
          {
            y: originalY,
            alpha: originalAlpha
          },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'slideOutUp':
        this.game.animationManager.animate(
          id,
          target,
          {
            y: originalY - distance,
            alpha: 0
          },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'slideInDown':
        target.y = originalY + distance;
        target.alpha = 0;
        this.game.animationManager.animate(
          id,
          target,
          {
            y: originalY,
            alpha: originalAlpha
          },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'slideOutDown':
        this.game.animationManager.animate(
          id,
          target,
          {
            y: originalY + distance,
            alpha: 0
          },
          {
            duration,
            ease: ease as any,
            delay
          }
        );
        break;

      case 'pulse':
        const pulseTimeline = this.game.animationManager.createTimeline(id, {
          repeat: options.repeat || 2,
          yoyo: true
        });
        pulseTimeline.to(
          target,
          {
            scaleX: originalScale * 1.1,
            scaleY: originalScale * 1.1
          },
          0
        );
        break;

      case 'bounce':
        const bounceTimeline = this.game.animationManager.createTimeline(id, {
          repeat: options.repeat || 2,
          yoyo: true
        });
        bounceTimeline.to(
          target,
          {
            y: originalY - 20
          },
          0
        );
        break;

      case 'shake':
        const shakeTimeline = this.game.animationManager.createTimeline(id, {
          repeat: 5,
          yoyo: true
        });
        shakeTimeline.to(
          target,
          {
            x: originalX - 5 * scale
          },
          0
        );
        shakeTimeline.to(
          target,
          {
            x: originalX + 5 * scale
          },
          0.1
        );
        break;

      case 'heartbeat':
        const heartbeatTimeline = this.game.animationManager.createTimeline(id, {
          repeat: options.repeat || 1
        });
        heartbeatTimeline.to(
          target,
          {
            scaleX: originalScale * 1.1,
            scaleY: originalScale * 1.1,
            duration: 0.1
          },
          0
        );
        heartbeatTimeline.to(
          target,
          {
            scaleX: originalScale,
            scaleY: originalScale,
            duration: 0.1
          },
          0.1
        );
        heartbeatTimeline.to(
          target,
          {
            scaleX: originalScale * 1.15,
            scaleY: originalScale * 1.15,
            duration: 0.1
          },
          0.3
        );
        heartbeatTimeline.to(
          target,
          {
            scaleX: originalScale,
            scaleY: originalScale,
            duration: 0.5
          },
          0.4
        );
        break;

      case 'flicker':
        const flickerTimeline = this.game.animationManager.createTimeline(id, {
          repeat: options.repeat || 0
        });
        flickerTimeline.to(target, { alpha: 0.7, duration: 0.05 }, 0);
        flickerTimeline.to(target, { alpha: originalAlpha, duration: 0.05 }, 0.05);
        flickerTimeline.to(target, { alpha: 0.5, duration: 0.05 }, 0.15);
        flickerTimeline.to(target, { alpha: originalAlpha, duration: 0.05 }, 0.2);
        flickerTimeline.to(target, { alpha: 0.8, duration: 0.05 }, 0.3);
        flickerTimeline.to(target, { alpha: originalAlpha, duration: 0.05 }, 0.35);
        break;
    }

    return id;
  }

  /**
   * Create a character entrance animation
   * @param character Character display object
   * @param fromDirection Direction to enter from
   * @param options Animation options
   * @returns Animation ID
   */
  characterEnter(
    character: PIXI.DisplayObject,
    fromDirection: 'left' | 'right' | 'top' | 'bottom' = 'right',
    options: StoryAnimationOptions = {}
  ): string {
    const preset =
      fromDirection === 'left'
        ? 'slideInLeft'
        : fromDirection === 'right'
          ? 'slideInRight'
          : fromDirection === 'top'
            ? 'slideInUp'
            : 'slideInDown';

    return this.applyPreset(character, preset, {
      duration: 0.8,
      ease: 'power3.out',
      ...options
    });
  }

  /**
   * Create a character exit animation
   * @param character Character display object
   * @param toDirection Direction to exit to
   * @param options Animation options
   * @returns Animation ID
   */
  characterExit(
    character: PIXI.DisplayObject,
    toDirection: 'left' | 'right' | 'top' | 'bottom' = 'right',
    options: StoryAnimationOptions = {}
  ): string {
    const preset =
      toDirection === 'left'
        ? 'slideOutLeft'
        : toDirection === 'right'
          ? 'slideOutRight'
          : toDirection === 'top'
            ? 'slideOutUp'
            : 'slideOutDown';

    return this.applyPreset(character, preset, {
      duration: 0.7,
      ease: 'power2.in',
      ...options
    });
  }

  /**
   * Create a dialogue box animation
   * @param dialogueBox Dialogue box display object
   * @param type Animation type
   * @param options Animation options
   * @returns Animation ID
   */
  animateDialogueBox(
    dialogueBox: PIXI.DisplayObject,
    type: 'show' | 'hide' | 'emphasize',
    options: StoryAnimationOptions = {}
  ): string {
    switch (type) {
      case 'show':
        return this.applyPreset(dialogueBox, 'slideInUp', {
          duration: 0.5,
          ease: 'back.out',
          ...options
        });
      case 'hide':
        return this.applyPreset(dialogueBox, 'slideOutDown', {
          duration: 0.4,
          ...options
        });
      case 'emphasize':
        return this.applyPreset(dialogueBox, 'pulse', {
          duration: 0.3,
          repeat: 1,
          ...options
        });
    }
  }

  /**
   * Animate a background transition
   * @param oldBg Old background (if any)
   * @param newBg New background to transition to
   * @param type Transition type
   * @param options Animation options
   * @returns Animation sequence
   */
  transitionBackground(
    oldBg: PIXI.Container | null,
    newBg: PIXI.Container,
    type: 'fade' | 'crossfade' | 'slideLeft' | 'slideRight' = 'fade',
    options: StoryAnimationOptions = {}
  ): AnimationSequence {
    const id = `bg-transition-${Date.now()}`;
    const sequence = this.createSequence(id);
    const duration = options.duration || 1.5;

    // Make sure the new background is in place but invisible
    newBg.alpha = 0;

    switch (type) {
      case 'fade':
        if (oldBg) {
          sequence.add({
            target: oldBg,
            props: { alpha: 0 },
            options: { duration: duration / 2 }
          });
        }

        sequence.add({
          target: newBg,
          props: { alpha: 1 },
          options: { duration: duration / 2 },
          position: oldBg ? '+=0' : 0
        });
        break;

      case 'crossfade':
        if (oldBg) {
          sequence.addParallel([
            {
              target: oldBg,
              props: { alpha: 0 },
              options: { duration }
            },
            {
              target: newBg,
              props: { alpha: 1 },
              options: { duration }
            }
          ]);
        } else {
          sequence.add({
            target: newBg,
            props: { alpha: 1 },
            options: { duration }
          });
        }
        break;

      case 'slideLeft':
        // Position new background to the right
        const originalX = newBg.x;
        newBg.x = originalX + newBg.width;
        newBg.alpha = 1;

        if (oldBg) {
          sequence.addParallel([
            {
              target: oldBg,
              props: { x: -oldBg.width },
              options: { duration, ease: 'power2.inOut' }
            },
            {
              target: newBg,
              props: { x: originalX },
              options: { duration, ease: 'power2.inOut' }
            }
          ]);
        } else {
          sequence.add({
            target: newBg,
            props: { x: originalX },
            options: { duration, ease: 'power2.out' }
          });
        }
        break;

      case 'slideRight':
        // Position new background to the left
        const origX = newBg.x;
        newBg.x = origX - newBg.width;
        newBg.alpha = 1;

        if (oldBg) {
          sequence.addParallel([
            {
              target: oldBg,
              props: { x: oldBg.width },
              options: { duration, ease: 'power2.inOut' }
            },
            {
              target: newBg,
              props: { x: origX },
              options: { duration, ease: 'power2.inOut' }
            }
          ]);
        } else {
          sequence.add({
            target: newBg,
            props: { x: origX },
            options: { duration, ease: 'power2.out' }
          });
        }
        break;
    }

    // Play the sequence immediately
    sequence.play();

    return sequence;
  }

  /**
   * Create a camera-like effect by moving the entire scene container
   * @param container The scene container to animate
   * @param type Camera movement type
   * @param options Animation options
   * @returns Animation ID
   */
  cameraEffect(
    container: PIXI.Container,
    type: 'shake' | 'zoom' | 'pan' | 'fadeToBlack',
    options: StoryAnimationOptions & {
      targetX?: number;
      targetY?: number;
      targetScale?: number;
    } = {}
  ): string {
    const id = `camera-${type}-${Date.now()}`;
    const originalX = container.x;
    const originalY = container.y;
    const originalScale = container.scale.x;

    switch (type) {
      case 'shake':
        const intensity = options.scale || 1;
        const shakeTimeline = this.game.animationManager.createTimeline(id);

        // Create a random shake pattern
        for (let i = 0; i < 10; i++) {
          const offsetX = (Math.random() * 20 - 10) * intensity;
          const offsetY = (Math.random() * 20 - 10) * intensity;

          shakeTimeline.to(
            container,
            {
              x: originalX + offsetX,
              y: originalY + offsetY,
              duration: 0.05
            },
            i * 0.05
          );
        }

        // Return to original position
        shakeTimeline.to(container, {
          x: originalX,
          y: originalY,
          duration: 0.2,
          ease: 'power2.out'
        });

        break;

      case 'zoom':
        const targetScale = options.targetScale || 1.5;
        this.game.animationManager.animate(
          id,
          container,
          {
            scaleX: targetScale,
            scaleY: targetScale
          },
          {
            duration: options.duration || 1,
            ease: (options.ease as any) || 'power2.inOut'
          }
        );
        break;

      case 'pan':
        const targetX = options.targetX !== undefined ? options.targetX : originalX;
        const targetY = options.targetY !== undefined ? options.targetY : originalY;

        this.game.animationManager.animate(
          id,
          container,
          {
            x: targetX,
            y: targetY
          },
          {
            duration: options.duration || 2,
            ease: (options.ease as any) || 'power1.inOut'
          }
        );
        break;

      case 'fadeToBlack':
        // Create a black overlay if needed
        let overlay = container.getChildByName('cameraOverlay') as PIXI.Graphics;

        if (!overlay) {
          overlay = new PIXI.Graphics();
          overlay.name = 'cameraOverlay';
          overlay.beginFill(0x000000);
          overlay.drawRect(
            0,
            0,
            this.game.getApp().renderer.width,
            this.game.getApp().renderer.height
          );
          overlay.endFill();
          overlay.alpha = 0;
          container.addChild(overlay);
        }

        this.game.animationManager.animate(
          id,
          overlay,
          {
            alpha: 1
          },
          {
            duration: options.duration || 1,
            ease: (options.ease as any) || 'power2.inOut'
          }
        );
        break;
    }

    return id;
  }
}
