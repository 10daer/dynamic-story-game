import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { EventEmitter } from '../../core/events/EventEmitter';
import { StoryChoice } from '../../core/story/StoryData';
import { Game } from '../Game';

export class ChoiceSystem extends EventEmitter {
  private game: Game;
  private container: PIXI.Container;
  private choices: StoryChoice[] = [];
  private choiceButtons: PIXI.Container[] = [];

  private width: number;
  private padding: number = 15;
  private spacing: number = 10;
  private buttonHeight: number = 50;

  private buttonTextStyle: PIXI.TextStyle;
  private selectedIndex: number = -1;

  // Animation properties
  private buttonDefaultColor: number = 0x444444;
  private buttonHoverColor: number = 0x666666;
  private buttonSelectedColor: number = 0x888888;
  private currentAnimation: gsap.core.Timeline | null = null;

  constructor(
    game: Game,
    options: {
      width?: number;
      padding?: number;
      spacing?: number;
      buttonHeight?: number;
      buttonColor?: number;
      buttonHoverColor?: number;
      buttonSelectedColor?: number;
      buttonTextColor?: number;
    } = {}
  ) {
    super();

    this.game = game;

    // Set dimensions
    this.width = options.width || game.getApp().screen.width * 0.6;
    this.padding = options.padding || 15;
    this.spacing = options.spacing || 10;
    this.buttonHeight = options.buttonHeight || 50;

    // Set colors
    this.buttonDefaultColor = options.buttonColor || 0x444444;
    this.buttonHoverColor = options.buttonHoverColor || 0x666666;
    this.buttonSelectedColor = options.buttonSelectedColor || 0x888888;

    // Create container
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.container.alpha = 0; // Start invisible for animations

    // Create text style
    this.buttonTextStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fill: options.buttonTextColor || 0xffffff,
      wordWrap: true,
      wordWrapWidth: this.width - this.padding * 2
    });

    // Add container to stage
    game.getStage().addChild(this.container);

    // Setup keyboard navigation
    this.setupKeyboardNavigation();
  }

  /**
   * Setup keyboard navigation for choices
   */
  private setupKeyboardNavigation(): void {
    window.addEventListener('keydown', (e) => {
      if (!this.container.visible) return;

      switch (e.key) {
        case 'ArrowUp':
          this.navigateChoices(-1);
          break;
        case 'ArrowDown':
          this.navigateChoices(1);
          break;
        case 'Enter':
          if (this.selectedIndex >= 0 && this.selectedIndex < this.choices.length) {
            this.selectChoice(this.selectedIndex);
          }
          break;
      }
    });
  }

  /**
   * Navigate choices with keyboard
   * @param direction Direction to navigate (1 for down, -1 for up)
   */
  private navigateChoices(direction: number): void {
    if (this.choices.length === 0) return;

    // Update selected index
    let newIndex = this.selectedIndex + direction;

    // Wrap around
    if (newIndex < 0) {
      newIndex = this.choices.length - 1;
    } else if (newIndex >= this.choices.length) {
      newIndex = 0;
    }

    // Update selection with animation
    this.setSelectedIndex(newIndex);
  }

  /**
   * Set the selected choice index with animation
   * @param index Index to select
   */
  private setSelectedIndex(index: number): void {
    // Reset previous selection
    if (this.selectedIndex >= 0 && this.selectedIndex < this.choiceButtons.length) {
      const prevButton = this.choiceButtons[this.selectedIndex];
      const prevBackground = prevButton.getChildAt(0) as PIXI.Graphics;
      gsap.to(prevBackground, {
        pixi: { tint: this.buttonDefaultColor },
        duration: 0.2
      });
    }

    // Update selected index
    this.selectedIndex = index;

    // Apply new selection with animation
    if (this.selectedIndex >= 0 && this.selectedIndex < this.choiceButtons.length) {
      const newButton = this.choiceButtons[this.selectedIndex];
      const newBackground = newButton.getChildAt(0) as PIXI.Graphics;

      // Animate button selection
      gsap.to(newBackground, {
        pixi: { tint: this.buttonHoverColor },
        duration: 0.2
      });

      // Subtle scale animation for selected button
      gsap.to(newButton.scale, {
        x: 1.03,
        y: 1.03,
        duration: 0.2,
        ease: 'back.out'
      });

      // Reset scale of other buttons
      this.choiceButtons.forEach((button, i) => {
        if (i !== this.selectedIndex) {
          gsap.to(button.scale, {
            x: 1,
            y: 1,
            duration: 0.2
          });
        }
      });
    }
  }

  /**
   * Show choices with animation
   * @param choices Array of choices to display
   * @param animationType Type of animation for displaying choices
   */
  public show(choices: StoryChoice[], animationType: string = 'stagger'): void {
    this.choices = choices;
    this.selectedIndex = -1;

    // Clear any ongoing animations
    if (this.currentAnimation) {
      this.currentAnimation.kill();
      this.currentAnimation = null;
    }

    // Clear existing buttons
    this.clearChoiceButtons();

    // Create new buttons
    this.createChoiceButtons();

    // Position container
    this.positionContainer();

    // Make container visible but transparent for animation
    this.container.visible = true;
    this.container.alpha = 0;

    // Animate container appearance
    gsap.to(this.container, {
      alpha: 1,
      duration: 0.3,
      ease: 'power2.inOut'
    });

    // Animate choices based on animation type
    this.animateChoicesIn(animationType);

    // Emit show event
    this.emit('choices:show', choices);
  }

  /**
   * Animate choices appearing
   * @param animationType Type of animation
   */
  private animateChoicesIn(animationType: string): void {
    const timeline = gsap.timeline();

    switch (animationType) {
      case 'stagger':
        // Hide all buttons initially
        this.choiceButtons.forEach((button) => {
          button.alpha = 0;
          button.x = -20;
        });

        // Stagger animate them in
        timeline.to(this.choiceButtons, {
          alpha: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.1,
          ease: 'back.out'
        });
        break;

      case 'fade':
        this.choiceButtons.forEach((button) => {
          button.alpha = 0;
        });

        timeline.to(this.choiceButtons, {
          alpha: 1,
          duration: 0.5,
          stagger: 0.1
        });
        break;

      case 'scale':
        this.choiceButtons.forEach((button) => {
          button.alpha = 0;
          button.scale.set(0.8, 0.8);
        });

        timeline.to(this.choiceButtons, {
          alpha: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'back.out(1.2)'
        });
        break;

      default:
        // No animation, just make them visible
        this.choiceButtons.forEach((button) => {
          button.alpha = 1;
        });
        break;
    }

    this.currentAnimation = timeline;
  }

  /**
   * Clear existing choice buttons
   */
  private clearChoiceButtons(): void {
    this.container.removeChildren();
    this.choiceButtons = [];
  }

  /**
   * Create choice buttons
   */
  private createChoiceButtons(): void {
    let totalHeight = 0;

    this.choices.forEach((choice, index) => {
      const button = this.createChoiceButton(choice, index);
      button.position.y = totalHeight;
      totalHeight += button.height + this.spacing;

      this.container.addChild(button);
      this.choiceButtons.push(button);
    });
  }

  /**
   * Create a single choice button
   * @param choice Choice data
   * @param index Choice index
   */
  private createChoiceButton(choice: StoryChoice, index: number): PIXI.Container {
    const button = new PIXI.Container();

    // Create button background
    const background = new PIXI.Graphics();
    background
      .beginFill(this.buttonDefaultColor)
      .drawRoundedRect(0, 0, this.width, this.buttonHeight, 5)
      .endFill();

    // Create button text
    const text = new PIXI.Text(choice.text, this.buttonTextStyle);
    text.position.set(this.padding, (this.buttonHeight - text.height) / 2);

    // Add to button container
    button.addChild(background, text);

    // Use eventMode instead of interactive
    button.eventMode = 'dynamic'; // 'dynamic' is equivalent to interactive = true
    button.cursor = 'pointer';

    // Setup button events with animations
    button.on('pointerover', () => {
      gsap.to(background, {
        pixi: { tint: this.buttonHoverColor },
        duration: 0.2
      });

      gsap.to(button.scale, {
        x: 1.03,
        y: 1.03,
        duration: 0.2,
        ease: 'back.out'
      });

      this.setSelectedIndex(index);
    });

    button.on('pointerout', () => {
      if (this.selectedIndex !== index) {
        gsap.to(background, {
          pixi: { tint: this.buttonDefaultColor },
          duration: 0.2
        });

        gsap.to(button.scale, {
          x: 1,
          y: 1,
          duration: 0.2
        });
      }
    });

    button.on('pointerdown', () => {
      gsap.to(background, {
        pixi: { tint: this.buttonSelectedColor },
        duration: 0.1
      });

      gsap.to(button.scale, {
        x: 0.98,
        y: 0.98,
        duration: 0.1
      });
    });

    button.on('pointerup', () => {
      this.selectChoice(index);
    });

    return button;
  }

  /**
   * Position the choices container
   */
  private positionContainer(): void {
    const totalHeight = this.container.height;

    this.container.position.set(
      (this.game.getApp().screen.width - this.width) / 2,
      (this.game.getApp().screen.height - totalHeight) / 2
    );
  }

  /**
   * Select a choice with animation
   * @param index Choice index
   */
  public selectChoice(index: number): void {
    if (index < 0 || index >= this.choices.length) return;

    const choice = this.choices[index];
    const button = this.choiceButtons[index];
    const background = button.getChildAt(0) as PIXI.Graphics;

    // Animate button selection
    gsap.to(background, {
      pixi: { tint: this.buttonSelectedColor },
      duration: 0.1
    });

    // Animate button press
    gsap.to(button.scale, {
      x: 0.95,
      y: 0.95,
      duration: 0.1,
      onComplete: () => {
        // Animation for hiding choices
        this.animateChoicesOut(() => {
          // Hide container when animation completes
          this.hide();

          // Emit selection event
          this.emit('choice:selected', choice, index);
        });
      }
    });
  }

  /**
   * Animate choices disappearing
   * @param onComplete Callback when animation completes
   */
  private animateChoicesOut(onComplete: () => void): void {
    // Create staggered exit animation
    const timeline = gsap.timeline({
      onComplete
    });

    // Animate each button out
    timeline.to(this.choiceButtons, {
      alpha: 0,
      x: 20,
      duration: 0.2,
      stagger: 0.05,
      ease: 'power1.in'
    });

    // Fade out container
    timeline.to(
      this.container,
      {
        alpha: 0,
        duration: 0.2
      },
      '-=0.1'
    );

    this.currentAnimation = timeline;
  }

  /**
   * Hide the choices
   */
  public hide(): void {
    this.container.visible = false;

    // Emit hide event
    this.emit('choices:hide');
  }

  /**
   * Check if choices are currently visible
   */
  public isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Get the choices container
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Kill any GSAP animations
    if (this.currentAnimation) {
      this.currentAnimation.kill();
    }
    gsap.killTweensOf(this.container);
    this.choiceButtons.forEach((button) => {
      gsap.killTweensOf(button);
      gsap.killTweensOf(button.scale);
      gsap.killTweensOf(button.getChildAt(0));
    });

    this.container.removeAllListeners();
    this.container.destroy({ children: true });
    this.clear(); // Clear all event listeners
  }
}
