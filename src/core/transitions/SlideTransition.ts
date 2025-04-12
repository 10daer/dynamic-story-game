import * as PIXI from 'pixi.js';
import { Game } from '../../game/Game';
import { Scene } from '../../game/scenes/Scene';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export class SlideTransition {
  private duration: number = 0.7;
  private direction: SlideDirection;
  private ease: string = 'power2.inOut';

  constructor(direction: SlideDirection = 'right', duration?: number, ease?: string) {
    this.direction = direction;
    if (duration) this.duration = duration;
    if (ease) this.ease = ease;
  }

  async execute(game: Game, currentScene: Scene | null, nextScene: Scene): Promise<void> {
    return new Promise<void>((resolve) => {
      // Create container for transition
      const transitionContainer = new PIXI.Container();
      game.getStage().addChild(transitionContainer);

      // Set up initial positions
      const screenWidth = game.getApp().renderer.width;
      const screenHeight = game.getApp().renderer.height;

      let startX = 0;
      let startY = 0;
      let endX = 0;
      let endY = 0;

      switch (this.direction) {
        case 'left':
          startX = screenWidth;
          endX = -screenWidth;
          break;
        case 'right':
          startX = -screenWidth;
          endX = screenWidth;
          break;
        case 'up':
          startY = screenHeight;
          endY = -screenHeight;
          break;
        case 'down':
          startY = -screenHeight;
          endY = screenHeight;
          break;
      }

      // Create a snapshot of the current scene if it exists
      if (currentScene && currentScene.isActiveScene()) {
        const currentSceneSnapshot = new PIXI.Container();
        const texture = game.getApp().renderer.generateTexture(currentScene.getContainer());
        const sprite = new PIXI.Sprite(texture);
        currentSceneSnapshot.addChild(sprite);
        transitionContainer.addChild(currentSceneSnapshot);

        // Exit the current scene
        currentScene.exit();

        // Setup animation for current scene
        const currentSceneAnimId = 'transition-current-scene';
        game.animationManager.animate(
          currentSceneAnimId,
          currentSceneSnapshot,
          {
            x: endX,
            y: endY
          },
          {
            duration: this.duration,
            ease: this.ease as any
          }
        );
      }

      // Prepare and position the next scene
      nextScene.enter();
      const nextSceneContainer = nextScene.getContainer();
      nextSceneContainer.x = startX;
      nextSceneContainer.y = startY;
      transitionContainer.addChild(nextSceneContainer);

      // Animate the next scene
      const nextSceneAnimId = 'transition-next-scene';
      game.animationManager.animate(
        nextSceneAnimId,
        nextSceneContainer,
        {
          x: 0,
          y: 0
        },
        {
          duration: this.duration,
          ease: this.ease as any,
          onComplete: () => {
            // Clean up transition
            game.getStage().removeChild(transitionContainer);
            transitionContainer.removeChild(nextSceneContainer); // Don't destroy next scene container

            // Make sure next scene container is properly positioned in stage
            game.getStage().addChild(nextSceneContainer);

            // Destroy transition container
            transitionContainer.destroy({ children: true });

            resolve();
          }
        }
      );
    });
  }
}

// If you need a BaseTransition interface for consistency
export interface SceneTransition {
  execute(game: Game, currentScene: Scene | null, nextScene: Scene): Promise<void>;
}
