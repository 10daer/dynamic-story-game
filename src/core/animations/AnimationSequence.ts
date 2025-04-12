import * as PIXI from 'pixi.js';
import { EventEmitter } from '../events/EventEmitter';
import { AnimationManager, AnimationOptions } from './AnimationManager';

export type SequenceStep = {
  target: PIXI.DisplayObject;
  props: gsap.TweenVars;
  options?: AnimationOptions;
  position?: string | number; // Position in timeline ("+=0.5", "-=0.2", 0, 1.5, etc.)
};

export interface AnimationSequenceOptions {
  id: string;
  duration?: number;
  paused?: boolean;
  repeat?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export class AnimationSequence extends EventEmitter {
  private id: string;
  private animationManager: AnimationManager;
  private timeline: gsap.core.Timeline;
  private steps: SequenceStep[] = [];
  private isPlaying: boolean = false;
  private isPaused: boolean = false;

  constructor(
    id: string,
    animationManager: AnimationManager,
    options: Partial<AnimationSequenceOptions> = {}
  ) {
    super();
    this.id = id;
    this.animationManager = animationManager;
    this.timeline = this.animationManager.createTimeline(id, {
      repeat: options.repeat,
      yoyo: options.yoyo,
      onStart: () => {
        this.isPlaying = true;
        this.emit('sequence:start', { id: this.id });
        options.onStart?.();
      },
      onUpdate: (progress) => {
        this.emit('sequence:update', { id: this.id, progress });
        options.onUpdate?.(progress);
      },
      onComplete: () => {
        this.isPlaying = false;
        this.emit('sequence:complete', { id: this.id });
        options.onComplete?.();
      }
    });

    // Pause the timeline initially if paused option is true
    if (options.paused) {
      this.timeline.pause();
      this.isPaused = true;
    }
  }

  /**
   * Add an animation step to the sequence
   * @param step The animation step configuration
   * @returns this instance for chaining
   */
  public add(step: SequenceStep): AnimationSequence {
    this.steps.push(step);

    this.timeline.to(
      step.target,
      {
        ...step.props,
        duration: step.options?.duration || 1,
        ease: step.options?.ease || 'power2.out'
      },
      step.position
    );

    return this;
  }

  /**
   * Add multiple animation steps to run in parallel
   * @param steps Array of animation steps
   * @param position Position in the timeline
   * @returns this instance for chaining
   */
  public addParallel(steps: SequenceStep[], position?: string | number): AnimationSequence {
    const parallelPosition = position || '+=0';

    steps.forEach((step) => {
      this.timeline.to(
        step.target,
        {
          ...step.props,
          duration: step.options?.duration || 1,
          ease: step.options?.ease || 'power2.out'
        },
        parallelPosition
      );
    });

    return this;
  }

  /**
   * Add a delay in the sequence
   * @param duration Duration in seconds
   * @returns this instance for chaining
   */
  public addDelay(duration: number): AnimationSequence {
    this.timeline.to({}, { duration });
    return this;
  }

  /**
   * Add a function call at a specific point in the sequence
   * @param callback Function to call
   * @param position Position in the timeline
   * @returns this instance for chaining
   */
  public addCallback(callback: () => void, position?: string | number): AnimationSequence {
    this.timeline.call(callback, [], position);
    return this;
  }

  /**
   * Play the animation sequence
   * @returns this instance for chaining
   */
  public play(): AnimationSequence {
    if (this.isPaused) {
      this.timeline.resume();
      this.isPaused = false;
    } else if (!this.isPlaying) {
      this.timeline.play(0);
    }

    this.isPlaying = true;
    this.emit('sequence:play', { id: this.id });
    return this;
  }

  /**
   * Pause the animation sequence
   * @returns this instance for chaining
   */
  public pause(): AnimationSequence {
    if (this.isPlaying && !this.isPaused) {
      this.timeline.pause();
      this.isPaused = true;
      this.emit('sequence:pause', { id: this.id });
    }
    return this;
  }

  /**
   * Resume the animation sequence
   * @returns this instance for chaining
   */
  public resume(): AnimationSequence {
    if (this.isPaused) {
      this.timeline.resume();
      this.isPaused = false;
      this.emit('sequence:resume', { id: this.id });
    }
    return this;
  }

  /**
   * Stop and reset the animation sequence
   * @returns this instance for chaining
   */
  public stop(): AnimationSequence {
    this.timeline.pause(0);
    this.isPlaying = false;
    this.isPaused = false;
    this.emit('sequence:stop', { id: this.id });
    return this;
  }

  /**
   * Seek to a specific point in the sequence
   * @param position Position in seconds or normalized progress (0-1)
   * @param suppressEvents Whether to suppress events
   * @returns this instance for chaining
   */
  public seek(position: number, suppressEvents: boolean = false): AnimationSequence {
    this.timeline.seek(position, suppressEvents);
    return this;
  }

  /**
   * Get the current progress of the sequence (0-1)
   */
  public getProgress(): number {
    return this.timeline.progress();
  }

  /**
   * Get the total duration of the sequence
   */
  public getDuration(): number {
    return this.timeline.duration();
  }

  /**
   * Check if the sequence is currently playing
   */
  public isActive(): boolean {
    return this.isPlaying && !this.isPaused;
  }

  /**
   * Kill and clean up the sequence
   */
  public destroy(): void {
    this.animationManager.killTimeline(this.id);
    this.steps = [];
    this.clear(); // Clear all event listeners
  }
}
