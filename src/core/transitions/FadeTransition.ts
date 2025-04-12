import * as PIXI from 'pixi.js';
import { Game } from '../../game/Game';
import { Scene } from '../../game/scenes/Scene';

export class FadeTransition {
  private duration: number = 0.5;
  private ease: string = 'power2.out';

  constructor(duration?: number, ease?: string) {
    if (duration) this.duration = duration;
    if (ease) this.ease = ease;
  }

  async execute(game: Game, currentScene: Scene | null, nextScene: Scene): Promise<void> {
    return new Promise<void>((resolve) => {
      // Create overlay for transition
      const overlay = new PIXI.Graphics();
      overlay.beginFill(0x000000);
      overlay.drawRect(0, 0, game.getApp().renderer.width, game.getApp().renderer.height);
      overlay.endFill();
      overlay.alpha = 0;

      // Create container for smooth transitions
      const transitionContainer = new PIXI.Container();
      game.getStage().addChild(transitionContainer);

      // Add current scene to transition container if it exists
      if (currentScene) {
        // Clone the current scene's container to avoid removal issues
        const currentSceneSnapshot = new PIXI.Container();
        const texture = game.getApp().renderer.generateTexture(currentScene.getContainer());
        const sprite = new PIXI.Sprite(texture);
        currentSceneSnapshot.addChild(sprite);
        transitionContainer.addChild(currentSceneSnapshot);
      }

      // Add overlay to transition container
      transitionContainer.addChild(overlay);

      // Prepare next scene but make it invisible initially
      nextScene.getContainer().alpha = 0;

      // Fade in the overlay using AnimationManager
      const overlayFadeInId = 'transition-overlay-in';
      game.animationManager.animate(
        overlayFadeInId,
        overlay,
        { alpha: 1 },
        {
          duration: this.duration / 2,
          ease: this.ease as any,
          onComplete: () => {
            // Next scene preparation
            if (currentScene) {
              currentScene.exit(); // Properly exit the current scene
            }

            nextScene.enter(); // Enter the next scene
            nextScene.getContainer().alpha = 0; // Keep it invisible
            transitionContainer.addChild(nextScene.getContainer());

            // Fade in the next scene
            const nextSceneFadeInId = 'transition-scene-in';
            game.animationManager.animate(
              nextSceneFadeInId,
              nextScene.getContainer(),
              { alpha: 1 },
              {
                duration: 0.01
              }
            );

            // Fade out the overlay
            const overlayFadeOutId = 'transition-overlay-out';
            game.animationManager.animate(
              overlayFadeOutId,
              overlay,
              { alpha: 0 },
              {
                duration: this.duration / 2,
                ease: this.ease as any,
                onComplete: () => {
                  // Clean up transition
                  game.getStage().removeChild(transitionContainer);
                  transitionContainer.destroy({ children: true });

                  resolve();
                }
              }
            );
          }
        }
      );
    });
  }
}
