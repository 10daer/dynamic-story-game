import gsap from 'gsap';
import * as PIXI from 'pixi.js';
import { EventEmitter } from '../events/EventEmitter';
import { AnimationSequence, AnimationSequenceOptions } from './AnimationSequence';

export type EasingFunction =
  | 'none'
  | 'power1.in'
  | 'power1.out'
  | 'power1.inOut'
  | 'power2.in'
  | 'power2.out'
  | 'power2.inOut'
  | 'power3.in'
  | 'power3.out'
  | 'power3.inOut'
  | 'back.in'
  | 'back.out'
  | 'back.inOut'
  | 'elastic.in'
  | 'elastic.out'
  | 'elastic.inOut'
  | 'bounce.in'
  | 'bounce.out'
  | 'bounce.inOut'
  | 'circ.in'
  | 'circ.out'
  | 'circ.inOut'
  | 'expo.in'
  | 'expo.out'
  | 'expo.inOut'
  | 'sine.in'
  | 'sine.out'
  | 'sine.inOut';

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  ease?: EasingFunction;
  repeat?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export interface TimelineOptions extends AnimationOptions {
  // Timeline specific options could be added here
}

export class AnimationManager extends EventEmitter {
  private animations: Map<string, gsap.core.Tween> = new Map();
  private timelines: Map<string, gsap.core.Timeline> = new Map();
  private sequences: Map<string, AnimationSequence> = new Map();

  constructor() {
    super();

    // Add PIXI-specific properties for GSAP to work with
    gsap.registerPlugin({
      name: 'pixi',
      init: function (target: any, values: any) {
        // This runs when the tween is created
        if (target instanceof PIXI.DisplayObject) {
          // Handle special PIXI properties
          for (const p in values) {
            if (p === 'scale' && typeof values[p] === 'number') {
              // Allow setting both scaleX and scaleY with a single number
              values.scaleX = values.scaleY = values.scale;
              delete values.scale;
            }
          }
        }
        return true;
      }
    });
  }

  /**
   * Animate a display object with GSAP
   * @param id Unique identifier for this animation
   * @param target The PIXI DisplayObject to animate
   * @param props The properties to animate
   * @param options Animation options
   * @returns The created tween
   */
  animate(
    id: string,
    target: PIXI.DisplayObject,
    props: gsap.TweenVars,
    options: AnimationOptions = {}
  ): gsap.core.Tween {
    // Kill any existing animation with this id
    this.kill(id);

    const tween = gsap.to(target, {
      ...props,
      duration: options.duration || 1,
      delay: options.delay || 0,
      ease: options.ease || 'power2.out',
      repeat: options.repeat || 0,
      yoyo: options.yoyo || false,
      onStart: () => {
        this.emit('animationStart', { id, target });
        options.onStart?.();
      },
      onUpdate: () => {
        const progress = tween.progress();
        this.emit('animationUpdate', { id, target, progress });
        options.onUpdate?.(progress);
      },
      onComplete: () => {
        this.emit('animationComplete', { id, target });
        options.onComplete?.();
        this.animations.delete(id);
      }
    });

    this.animations.set(id, tween);
    return tween;
  }

  /**
   * Create a timeline of animations
   * @param id Unique identifier for this timeline
   * @param options Timeline options
   * @returns The created timeline
   */
  createTimeline(id: string, options: TimelineOptions = {}): gsap.core.Timeline {
    // Kill any existing timeline with this id
    this.killTimeline(id);

    const timeline = gsap.timeline({
      delay: options.delay || 0,
      repeat: options.repeat || 0,
      yoyo: options.yoyo || false,
      onStart: () => {
        this.emit('timelineStart', { id });
        options.onStart?.();
      },
      onUpdate: () => {
        const progress = timeline.progress();
        this.emit('timelineUpdate', { id, progress });
        options.onUpdate?.(progress);
      },
      onComplete: () => {
        this.emit('timelineComplete', { id });
        options.onComplete?.();
        this.timelines.delete(id);
      }
    });

    this.timelines.set(id, timeline);
    return timeline;
  }

  /**
   * Create an animation sequence
   * @param id Unique identifier for this sequence
   * @param options Sequence options
   * @returns The created animation sequence
   */
  createSequence(id: string, options: Partial<AnimationSequenceOptions> = {}): AnimationSequence {
    // If a sequence with this ID already exists, destroy it first
    if (this.sequences.has(id)) {
      this.sequences.get(id)?.destroy();
    }

    const sequence = new AnimationSequence(id, this, options);
    this.sequences.set(id, sequence);

    return sequence;
  }

  /**
   * Get an existing animation sequence by ID
   * @param id The sequence ID
   * @returns The animation sequence or undefined if not found
   */
  getSequence(id: string): AnimationSequence | undefined {
    return this.sequences.get(id);
  }

  /**
   * Check if a sequence exists
   * @param id The sequence ID
   * @returns Whether the sequence exists
   */
  hasSequence(id: string): boolean {
    return this.sequences.has(id);
  }

  /**
   * Kill an animation sequence by id
   * @param id The sequence id to kill
   */
  killSequence(id: string): void {
    const sequence = this.sequences.get(id);
    if (sequence) {
      sequence.destroy();
      this.sequences.delete(id);
      this.emit('sequenceKilled', { id });
    }
  }

  /**
   * Kill an animation by id
   * @param id The animation id to kill
   */
  kill(id: string): void {
    const tween = this.animations.get(id);
    if (tween) {
      tween.kill();
      this.animations.delete(id);
      this.emit('animationKilled', { id });
    }
  }

  /**
   * Kill a timeline by id
   * @param id The timeline id to kill
   */
  killTimeline(id: string): void {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.kill();
      this.timelines.delete(id);
      this.emit('timelineKilled', { id });
    }
  }

  /**
   * Kill all animations and timelines
   */
  killAll(): void {
    this.animations.forEach((tween, id) => {
      tween.kill();
      this.emit('animationKilled', { id });
    });

    this.timelines.forEach((timeline, id) => {
      timeline.kill();
      this.emit('timelineKilled', { id });
    });

    this.animations.clear();
    this.timelines.clear();
  }

  /**
   * Pause all animations and timelines
   */
  pauseAll(): void {
    gsap.globalTimeline.pause();
    this.emit('allPaused');
  }

  /**
   * Resume all animations and timelines
   */
  resumeAll(): void {
    gsap.globalTimeline.resume();
    this.emit('allResumed');
  }

  /**
   * Check if an animation is active
   * @param id The animation id to check
   * @returns Whether the animation is active
   */
  isAnimating(id: string): boolean {
    return this.animations.has(id) || this.timelines.has(id);
  }
}
