import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { StoryAnimator } from '../../core/animations/StoryAnimator';
import { EventEmitter } from '../../core/events/EventEmitter';
import { Game } from '../Game';

export interface DialogueDisplayOptions {
  textSpeed?: number;
  animationIn?: string;
  animationOut?: string;
  soundEffect?: string;
  characterColor?: number;
  textColor?: number;
}

export class DialogueBox extends EventEmitter {
  private game: Game;
  private container: PIXI.Container;
  private background: PIXI.Graphics;
  private nameBox: PIXI.Container;
  private nameText: PIXI.Text;
  private contentText: PIXI.Text;
  private continueIndicator: PIXI.Sprite | PIXI.Graphics;
  private animator: StoryAnimator;

  private textContent: string = '';
  private visibleText: string = '';
  private textSpeed: number = 40; // Characters per second
  private isTyping: boolean = false;
  private lastTypingTime: number = 0;
  private typingInterval: number | null = null;

  private width: number;
  private height: number;
  private padding: number = 20;

  private textStyle: PIXI.TextStyle;
  private nameStyle: PIXI.TextStyle;

  private textContainer: PIXI.Container;
  private currentAnimation: gsap.core.Tween | null = null;

  constructor(
    game: Game,
    options: {
      width?: number;
      height?: number;
      padding?: number;
      backgroundColor?: number;
      backgroundAlpha?: number;
      textColor?: number;
      textSize?: number;
      nameColor?: number;
      nameSize?: number;
      textSpeed?: number;
      animator?: StoryAnimator;
    } = {}
  ) {
    super();

    this.game = game;
    this.animator = options.animator || new StoryAnimator(game);

    // Set dimensions
    this.width = options.width || game.getApp().screen.width * 0.8;
    this.height = options.height || game.getApp().screen.height * 0.2;
    this.padding = options.padding || 20;
    this.textSpeed = options.textSpeed || 40;

    // Create container
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.container.alpha = 0; // Start invisible for animations

    // Create text styles
    this.textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: options.textSize || 24,
      fill: options.textColor || 0xffffff,
      wordWrap: true,
      wordWrapWidth: this.width - this.padding * 2
    });

    this.nameStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: options.nameSize || 20,
      fontWeight: 'bold',
      fill: options.nameColor || 0xffffff
    });

    // Create text container for better animations
    this.textContainer = new PIXI.Container();
    this.textContainer.position.set(this.padding, this.padding);

    // Create background with rounded corners
    this.background = new PIXI.Graphics();
    this.background
      .beginFill(options.backgroundColor || 0x000000, options.backgroundAlpha || 0.7)
      .drawRoundedRect(0, 0, this.width, this.height, 10)
      .endFill();

    // Create name box
    this.nameBox = new PIXI.Container();
    const nameBackground = new PIXI.Graphics();
    nameBackground.beginFill(0x000000, 0.8).drawRoundedRect(0, 0, 150, 30, 5).endFill();

    this.nameText = new PIXI.Text('', this.nameStyle);
    this.nameText.position.set(10, 5);

    this.nameBox.addChild(nameBackground, this.nameText);
    this.nameBox.position.set(20, -15);
    this.nameBox.visible = false;
    this.nameBox.alpha = 0; // Start invisible for animations

    // Create content text
    this.contentText = new PIXI.Text('', this.textStyle);
    this.textContainer.addChild(this.contentText);

    // Create continue indicator as animated triangle
    this.continueIndicator = new PIXI.Graphics();
    (this.continueIndicator as PIXI.Graphics)
      .beginFill(0xffffff)
      .drawPolygon([0, 0, 15, 10, 0, 20])
      .endFill();

    this.continueIndicator.position.set(
      this.width - this.padding - 15,
      this.height - this.padding - 10
    );
    this.continueIndicator.visible = false;
    this.continueIndicator.alpha = 0; // Start invisible for animations

    // Add everything to container
    this.container.addChild(
      this.background,
      this.nameBox,
      this.textContainer,
      this.continueIndicator
    );

    // Position the container
    this.container.position.set(
      (game.getApp().screen.width - this.width) / 2,
      game.getApp().screen.height - this.height - 50
    );

    // Add container to stage
    game.getStage().addChild(this.container);

    // Setup animation for continue indicator
    this.setupContinueAnimation();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup animation for continue indicator
   */
  private setupContinueAnimation(): void {
    // Use GSAP for smoother animation
    gsap.to(this.continueIndicator, {
      x: '+=6',
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Make the dialogue box interactive
    this.container.eventMode = 'static'; // Use 'static' for non-moving interactive elements
    this.container.on('pointerdown', this.handleClick.bind(this));

    // Keyboard listener for advancing text
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleClick();
      }
    });
  }

  /**
   * Handle click events
   */
  private handleClick(): void {
    if (!this.container.visible) return;

    if (this.isTyping) {
      // If currently typing, show all text immediately
      this.completeTyping();
    } else {
      // If not typing, emit continue event
      this.emit('dialogue:continue');
    }
  }

  /**
   * Show the dialogue box with animation
   * @param text The text to display
   * @param characterName Optional character name
   * @param options Display options
   */
  public show(text: string, characterName?: string, options: DialogueDisplayOptions = {}): void {
    // Cancel any ongoing animations
    if (this.currentAnimation) {
      this.currentAnimation.kill();
      this.currentAnimation = null;
    }

    this.container.visible = true;
    this.textContent = text;
    this.visibleText = '';
    this.continueIndicator.visible = false;

    // Set text speed if provided
    if (options.textSpeed !== undefined) {
      this.textSpeed = options.textSpeed;
    }

    // Update name box
    if (characterName) {
      this.nameBox.visible = true;
      this.nameText.text = characterName;

      // Resize name background if needed
      const nameBackground = this.nameBox.getChildAt(0) as PIXI.Graphics;
      nameBackground.clear();
      nameBackground
        .beginFill(0x000000, 0.8)
        .drawRoundedRect(0, 0, this.nameText.width + 20, 30, 5)
        .endFill();

      // Animate name box in
      gsap.fromTo(
        this.nameBox,
        { alpha: 0, y: -25 },
        { alpha: 1, y: -15, duration: 0.3, ease: 'back.out' }
      );
    } else {
      this.nameBox.visible = false;
    }

    // Animate the dialogue box in
    const animationIn = options.animationIn || 'fadeIn';
    this.animateDialogueIn(animationIn);

    // Set character text color if provided
    if (options.characterColor !== undefined) {
      this.setTextColor(options.characterColor);
    }

    // Start typing animation after entrance animation completes
    setTimeout(() => {
      this.startTyping();
    }, 300);

    // Emit show event
    this.emit('dialogue:show', text, characterName);
  }

  /**
   * Animate the dialogue box in
   * @param animationType Animation type
   */
  private animateDialogueIn(animationType: string): void {
    this.container.alpha = 0;

    // Set initial state based on animation type
    switch (animationType) {
      case 'slideUp':
        this.container.y = this.game.getApp().screen.height;
        this.currentAnimation = gsap.to(this.container, {
          alpha: 1,
          y: this.game.getApp().screen.height - this.height - 50,
          duration: 0.5,
          ease: 'back.out'
        });
        break;

      case 'expand':
        this.container.scale.set(0.8, 0.8);
        this.container.alpha = 0;
        this.currentAnimation = gsap.to(this.container, {
          alpha: 1,
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.2)'
        });
        break;

      case 'fadeIn':
      default:
        this.currentAnimation = gsap.to(this.container, {
          alpha: 1,
          duration: 0.3,
          ease: 'power2.inOut'
        });
        break;
    }
  }

  /**
   * Hide the dialogue box with animation
   * @param animationType Animation type
   */
  public hide(animationType: string = 'fadeOut'): void {
    // Cancel any ongoing animations
    if (this.currentAnimation) {
      this.currentAnimation.kill();
      this.currentAnimation = null;
    }

    this.stopTyping();

    // Animate out based on animation type
    switch (animationType) {
      case 'slideDown':
        this.currentAnimation = gsap.to(this.container, {
          alpha: 0,
          y: this.game.getApp().screen.height + 50,
          duration: 0.4,
          ease: 'back.in',
          onComplete: () => {
            this.container.visible = false;
            this.emit('dialogue:hide');
          }
        });
        break;

      case 'contract':
        this.currentAnimation = gsap.to(this.container, {
          alpha: 0,
          scale: 0.8,
          duration: 0.3,
          ease: 'back.in',
          onComplete: () => {
            this.container.visible = false;
            this.emit('dialogue:hide');
          }
        });
        break;

      case 'fadeOut':
      default:
        this.currentAnimation = gsap.to(this.container, {
          alpha: 0,
          duration: 0.3,
          ease: 'power2.inOut',
          onComplete: () => {
            this.container.visible = false;
            this.emit('dialogue:hide');
          }
        });
        break;
    }
  }

  /**
   * Start typing animation
   */
  private startTyping(): void {
    this.isTyping = true;
    this.lastTypingTime = performance.now();
    this.contentText.text = '';

    // Clear existing interval if any
    if (this.typingInterval !== null) {
      clearInterval(this.typingInterval);
    }

    // Set interval for typing effect
    const msPerChar = 1000 / this.textSpeed;
    this.typingInterval = window.setInterval(() => {
      this.updateTyping();
    }, msPerChar);

    // Emit typing start event
    this.emit('dialogue:typing:start');
  }

  /**
   * Update typing animation
   */
  private updateTyping(): void {
    if (this.visibleText.length < this.textContent.length) {
      // Show next character
      this.visibleText = this.textContent.substring(0, this.visibleText.length + 1);
      this.contentText.text = this.visibleText;

      // Play typing sound if available
      // this.playTypingSound();

      // Emit typing update event
      this.emit('dialogue:typing:update', this.visibleText);
    } else {
      // Typing complete
      this.completeTyping();
    }
  }

  /**
   * Complete typing animation immediately
   */
  public completeTyping(): void {
    this.stopTyping();
    this.visibleText = this.textContent;
    this.contentText.text = this.visibleText;

    // Animate continue indicator appearing
    this.continueIndicator.visible = true;
    gsap.fromTo(
      this.continueIndicator,
      { alpha: 0, x: this.width - this.padding - 10 },
      { alpha: 1, x: this.width - this.padding - 15, duration: 0.3, ease: 'back.out' }
    );

    // Emit typing complete event
    this.emit('dialogue:typing:complete');
  }

  /**
   * Stop typing animation
   */
  private stopTyping(): void {
    this.isTyping = false;

    if (this.typingInterval !== null) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
  }

  /**
   * Shake the dialogue box (for emphasis or character emotion)
   * @param intensity Shake intensity
   * @param duration Shake duration
   */
  public shake(intensity: number = 5, duration: number = 0.3): void {
    gsap.to(this.container, {
      x: `+=${intensity}`,
      duration: 0.05,
      repeat: Math.floor(duration / 0.1),
      yoyo: true,
      ease: 'none'
    });
  }

  /**
   * Pulse the dialogue box (for emphasis)
   */
  public pulse(): void {
    gsap.to(this.container.scale, {
      x: 1.05,
      y: 1.05,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  }

  /**
   * Check if dialogue is currently visible
   */
  public isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Check if typing animation is in progress
   */
  public isCurrentlyTyping(): boolean {
    return this.isTyping;
  }

  /**
   * Set typing speed
   * @param charsPerSecond Characters per second
   */
  public setTextSpeed(charsPerSecond: number): void {
    this.textSpeed = charsPerSecond;
  }

  /**
   * Set text color
   * @param color Text color
   */
  public setTextColor(color: number): void {
    this.textStyle.fill = color;
    this.contentText.style = this.textStyle;
  }

  /**
   * Get the dialogue container
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.typingInterval !== null) {
      clearInterval(this.typingInterval);
    }

    // Kill any GSAP animations
    if (this.currentAnimation) {
      this.currentAnimation.kill();
    }
    gsap.killTweensOf(this.container);
    gsap.killTweensOf(this.continueIndicator);
    gsap.killTweensOf(this.nameBox);

    window.removeEventListener('keydown', this.handleClick.bind(this));
    this.container.removeAllListeners();
    this.container.destroy({ children: true });
    this.clear(); // Clear all event listeners
  }
}
