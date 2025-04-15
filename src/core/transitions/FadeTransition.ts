import * as PIXI from 'pixi.js';
import { Game } from '../../game/Game';
import { Scene } from '../../game/scenes/Scene';

export class FadeTransition {
  private duration: number = 0.5;
  private ease: string = 'power2.out';

  constructor(duration?: number, ease?: string) {
    if (duration !== undefined) this.duration = duration;
    if (ease !== undefined) this.ease = ease;
  }

  async execute(game: Game, currentScene: Scene | null, nextScene: Scene): Promise<void> {
    console.log(
      `Starting fade transition from ${currentScene?.constructor.name} to ${nextScene.constructor.name}`
    );

    return new Promise<void>((resolve, reject) => {
      try {
        // Create overlay for transition
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000);
        overlay.drawRect(0, 0, game.getApp().renderer.width, game.getApp().renderer.height);
        overlay.endFill();
        overlay.alpha = 0;

        // Create a standalone transition container that exists above all other elements
        const transitionContainer = new PIXI.Container();
        transitionContainer.sortableChildren = true;
        transitionContainer.zIndex = 9999; // Ensure it's on top
        game.getStage().addChild(transitionContainer);

        // Add overlay to transition container
        transitionContainer.addChild(overlay);

        // Ensure nextScene is initialized but not yet visible
        nextScene.getContainer().alpha = 0;

        // If it's not already in the stage, add it
        if (!nextScene.getContainer().parent) {
          game.getStage().addChild(nextScene.getContainer());
        }

        // Step 1: Fade the overlay in
        const fadeInId = 'transition-overlay-in';
        game.animationManager.animate(
          fadeInId,
          overlay,
          { alpha: 1 },
          {
            duration: this.duration / 2,
            ease: this.ease as any,
            onComplete: async () => {
              try {
                // Step 2: Exit current scene if it exists
                if (currentScene) {
                  // Make sure any existing animations on the current scene are stopped
                  try {
                    await currentScene.exit();
                  } catch (error) {
                    console.warn('Error during scene exit:', error);
                    // Continue anyway
                  }

                  // Remove current scene from stage to avoid overlap
                  if (currentScene.getContainer().parent) {
                    currentScene.getContainer().parent.removeChild(currentScene.getContainer());
                  }
                }

                // Step 3: Enter the next scene
                try {
                  await nextScene.enter();
                } catch (error) {
                  console.warn('Error during scene enter:', error);
                  // Continue anyway
                }

                // Ensure next scene is visible
                nextScene.getContainer().alpha = 1;

                // Step 4: Fade out the overlay
                const fadeOutId = 'transition-overlay-out';
                game.animationManager.animate(
                  fadeOutId,
                  overlay,
                  { alpha: 0 },
                  {
                    duration: this.duration / 2,
                    ease: this.ease as any,
                    onComplete: () => {
                      // Clean up transition
                      game.getStage().removeChild(transitionContainer);
                      transitionContainer.destroy({ children: true });
                      console.log('Fade transition completed successfully');
                      resolve();
                    }
                  }
                );
              } catch (innerError) {
                console.error('Error during transition sequence:', innerError);

                // Emergency cleanup
                game.getStage().removeChild(transitionContainer);
                transitionContainer.destroy({ children: true });

                // Ensure next scene is visible anyway
                nextScene.getContainer().alpha = 1;
                if (!nextScene.getContainer().parent) {
                  game.getStage().addChild(nextScene.getContainer());
                }

                reject(innerError);
              }
            }
          }
        );
      } catch (error) {
        console.error('Fatal error in fade transition:', error);
        reject(error);
      }
    });
  }
}
