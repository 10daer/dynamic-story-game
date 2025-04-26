import { assetsToLoad } from './data';
import { CharacterEmotion, CharacterPosition } from './game/characters/CharacterData';
import { Game } from './game/Game';
import { LoadingScene } from './game/scenes/LoadingScene';
import { MainMenuScene } from './game/scenes/MainMenu';
import { StoryScene } from './game/scenes/StoryScene';

// Create game instance
const game = new Game({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x111111
});

// Initialize and start the game
async function init(): Promise<void> {
  try {
    const loadingScene = new LoadingScene(game);
    game.sceneManager.register('loading', loadingScene);

    // Switch to loading scene first
    await game.sceneManager.switchTo('loading');

    // Setup loading listeners
    setupLoadingListeners();

    // Setup other event listeners
    setupEventListeners();

    // Queue all loading operations through the loading manager
    queueAllLoadingOperations();

    // Start the loading process with the loading manager
    await game.loadingManager.startLoading({
      title: 'Loading Game...',
      showProgressBar: true,
      switchToSceneAfter: 'mainMenu',
      transitionEffect: 'fade',
      minLoadTime: 1500 // Ensure loading screen shows for at least 1.5 seconds
    });

    game.start();
  } catch (error) {
    console.error('Game initialization failed:', error);
    alert('Failed to initialize the game. Please refresh the page.');
  }
}

function registerScenes(): void {
  const menuScene = new MainMenuScene(game);
  game.sceneManager.register('mainMenu', menuScene);

  // Dynamically register StoryScene for each sceneId
  game
    .getStoryManager()
    .getStory()
    ?.sceneIds.forEach((sceneId: string) => {
      const scene = new StoryScene(game);
      const camelCaseSceneId = sceneId.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      game.sceneManager.register(camelCaseSceneId, scene);
    });
}

// Queue all loading operations
function queueAllLoadingOperations(): void {
  // 1. Queue asset loading
  game.loadingManager.queue('assets', async () => {
    try {
      await game.assetManager.loadAll(assetsToLoad);
    } catch (error) {
      console.warn('Some assets failed to load:', error);
      throw error;
    }
  });

  // 2. Queue story loading
  game.loadingManager.queue('story', async () => {
    try {
      const storyData = await game.assetManager.loadText('assets/stories/story-grok.yaml');
      game.getStoryManager().loadFromYaml(storyData);
    } catch (error) {
      console.error('Failed to load story:', error);
      throw error;
    }
  });

  // 3. Queue scene registration
  game.loadingManager.queue('registerScenes', async () => {
    try {
      registerScenes();
    } catch (error) {
      console.error('Failed to register scenes:', error);
      throw error;
    }
  });

  // 3. Queue scene initialization
  game.loadingManager.queue('scenes', async () => {
    try {
      const scenes = game.sceneManager.getAllScenes();

      for (const [_, scene] of scenes) {
        await scene.init();
      }
    } catch (error) {
      console.error('Failed to initialize scenes:', error);
      throw error;
    }
  });

  // 4. Queue character creation
  game.loadingManager.queue('characters', async () => {
    try {
      await createCharacters();
    } catch (error) {
      console.error('Failed to create characters:', error);
      throw error;
    }
  });
}

// Create all game characters
async function createCharacters(): Promise<void> {
  // Register Alex character
  game.addCharacter('alex', {
    id: 'alex',
    name: 'Alex',
    displayName: 'Alex',
    description: 'A brave explorer with a curious spirit',
    defaultEmotion: CharacterEmotion.NEUTRAL,
    currentEmotion: CharacterEmotion.NEUTRAL,
    position: CharacterPosition.LEFT,
    poses: [
      {
        id: 'neutral',
        emotion: CharacterEmotion.NEUTRAL,
        texturePath: './assets/images/characters/alex/neutral.png'
      },
      {
        id: 'happy',
        emotion: CharacterEmotion.HAPPY,
        texturePath: './assets/images/characters/alex/happy.png'
      },
      {
        id: 'sad',
        emotion: CharacterEmotion.SAD,
        texturePath: './assets/images/characters/alex/sad.png'
      }
    ],
    isVisible: true,
    scale: 1.0,
    speechColor: 0x4e7bff,
    speechFont: 'Arial',
    customState: {
      bravery: 5,
      intelligence: 4,
      relationship_maya: 0
    }
  });

  // Register Maya character
  game.addCharacter('maya', {
    id: 'maya',
    name: 'Maya',
    displayName: 'Maya',
    description: 'A wise guide with ancient knowledge',
    defaultEmotion: CharacterEmotion.NEUTRAL,
    currentEmotion: CharacterEmotion.NEUTRAL,
    position: CharacterPosition.RIGHT,
    poses: [
      {
        id: 'neutral',
        emotion: CharacterEmotion.NEUTRAL,
        texturePath: './assets/images/characters/maya/neutral.png'
      },
      {
        id: 'happy',
        emotion: CharacterEmotion.HAPPY,
        texturePath: './assets/images/characters/maya/happy.png'
      },
      {
        id: 'thoughtful',
        emotion: CharacterEmotion.THOUGHTFUL,
        texturePath: './assets/images/characters/maya/thoughtful.png'
      }
    ],
    scale: 1.0,
    speechColor: 0x8a2be2,
    speechFont: 'Arial',
    customState: {
      wisdom: 8,
      patience: 7,
      relationship_alex: 0
    },
    isVisible: true
  });

  // Register Guide Character
  game.addCharacter('guide', {
    id: 'guide',
    name: 'Guide',
    displayName: 'The Guide',
    description: 'A mysterious figure who offers wisdom and cryptic clues.',
    defaultEmotion: CharacterEmotion.NEUTRAL,
    currentEmotion: CharacterEmotion.NEUTRAL,
    position: CharacterPosition.RIGHT,
    poses: [
      {
        id: 'neutral',
        emotion: CharacterEmotion.NEUTRAL,
        texturePath: 'assets/images/characters/guide/neutral.png'
      },
      {
        id: 'smiling',
        emotion: CharacterEmotion.HAPPY,
        texturePath: 'assets/images/characters/guide/smiling.png'
      },
      {
        id: 'concerned',
        emotion: CharacterEmotion.SAD,
        texturePath: 'assets/images/characters/guide/concerned.png'
      },
      {
        id: 'mysterious',
        emotion: CharacterEmotion.MYSTERIOUS,
        texturePath: 'assets/images/characters/guide/mysterious.png'
      }
    ],
    isVisible: true,
    scale: 1.0,
    speechColor: 0x888888,
    speechFont: 'Georgia',
    customState: {
      trust: 0,
      revealedSecrets: 0
    }
  });

  // Register PLayer Character
  game.addCharacter('player', {
    id: 'player',
    name: 'You',
    displayName: 'You',
    description: 'The main protagonist of the story.',
    defaultEmotion: CharacterEmotion.NEUTRAL,
    currentEmotion: CharacterEmotion.NEUTRAL,
    position: CharacterPosition.CENTER,
    poses: [
      {
        id: 'neutral',
        emotion: CharacterEmotion.NEUTRAL,
        texturePath: 'assets/images/characters/player/neutral.png'
      },
      {
        id: 'surprised',
        emotion: CharacterEmotion.SURPRISED,
        texturePath: 'assets/images/characters/player/surprised.png'
      },
      {
        id: 'determined',
        emotion: CharacterEmotion.DETERMINED,
        texturePath: 'assets/images/characters/player/determined.png'
      }
    ],
    isVisible: true,
    scale: 1.0,
    speechColor: 0x000000,
    speechFont: 'Verdana',
    customState: {
      courage: 3,
      decisionsMade: 0
    }
  });

  // Register Spirit Character
  game.addCharacter('spirit', {
    id: 'spirit',
    name: 'Spirit',
    displayName: 'Ancient Spirit',
    description: 'A powerful entity from another realm.',
    defaultEmotion: CharacterEmotion.ETHEREAL,
    currentEmotion: CharacterEmotion.ETHEREAL,
    position: CharacterPosition.LEFT,
    poses: [
      {
        id: 'ethereal',
        emotion: CharacterEmotion.ETHEREAL,
        texturePath: 'assets/images/characters/spirit/ethereal.png'
      },
      {
        id: 'powerful',
        emotion: CharacterEmotion.POWERFUL,
        texturePath: 'assets/images/characters/spirit/powerful.png'
      }
    ],
    isVisible: false,
    scale: 1.2,
    speechColor: 0x9400d3,
    speechFont: 'Times New Roman',
    customState: {
      energyLevel: 100,
      alignment: 'neutral'
    }
  });

  // Register Narrator Character
  game.addCharacter('narrator', {
    id: 'narrator',
    name: 'Narrator',
    displayName: 'Narrator',
    description: 'An unseen voice that guides the story and provides context.',
    defaultEmotion: CharacterEmotion.NEUTRAL,
    currentEmotion: CharacterEmotion.NEUTRAL,
    position: CharacterPosition.OFF_SCREEN_RIGHT,
    poses: [
      {
        id: 'default',
        emotion: CharacterEmotion.NEUTRAL,
        texturePath: 'assets/images/characters/narrator.png'
      }
    ],
    isVisible: false,
    scale: 1.0,
    speechColor: 0x333333,
    speechFont: 'Palatino',
    customState: {
      storyProgress: 0
    }
  });

  // Wait for character creation to complete
  // This ensures addCharacter promises resolve before continuing
  return new Promise<void>((resolve) => {
    // Give a small delay to ensure character events have fired
    setTimeout(() => resolve(), 100);
  });
}

// Setup loading-specific event listeners
function setupLoadingListeners(): void {
  // Listen for loading manager events
  game.loadingManager.on('loading:start', (options) => {
    // console.log('Loading started:', options);
  });

  game.loadingManager.on('loading:progress', (progress, itemKey) => {
    // console.log(
    //   `Loading progress: ${Math.floor(progress * 100)}%${itemKey ? ` (${itemKey})` : ''}`
    // );
  });

  game.loadingManager.on('loading:complete', () => {
    // console.log('Loading completed');
  });

  game.loadingManager.on('loading:error', (itemKey, error) => {
    console.error(`Loading error for ${itemKey}:`, error);
  });
}

// Setup game event listeners
function setupEventListeners(): void {
  // Listen for game-wide events
  game.on('game:resize', (width: number, height: number) => {
    // console.log(`Game resized to ${width}x${height}`);
  });

  // Listen for story-related events
  game.getStoryManager().on('story:start', () => {
    // console.log('Story started');
  });

  game.getStoryManager().on('story:complete', async () => {
    // Handle story completion, maybe show a special scene or return to menu
    await game.sceneManager.switchTo('mainMenu', 'fade');
  });

  game.getStoryManager().on('node:enter', (nodeId: string) => {
    // console.log(`Entered story node: ${nodeId}`);
  });

  game.getStoryManager().on('branch:complete', (branchId: string) => {
    // console.log(`Completed branch: ${branchId}`);
  });

  // Listen for character events
  game.characterManager.on('character:added', (characterId: string) => {
    // console.log(`Character added: ${characterId}`);
  });

  // Listen for save/load events
  game.stateManager.on('state:save', (saveId: string) => {
    // console.log(`Game saved with ID: ${saveId}`);
  });

  game.stateManager.on('state:load', (saveId: string) => {
    // console.log(`Game loaded from save ID: ${saveId}`);
  });

  // Setup keyboard shortcuts for debugging
  window.addEventListener('keydown', (event) => {
    // Ctrl+S to save
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      game.saveGame('quicksave');
    }

    // Ctrl+L to load
    if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      const saves = game.getSaveFiles();
      if (saves.length > 0) {
        game.loadGame(saves[0].id);
      } else {
        alert('No saves available to load');
      }
    }

    // Escape key to open menu
    if (event.key === 'Escape') {
      // If in story scene, return to menu
      if (game.sceneManager.getCurrentScene()?.constructor.name === 'StoryScene') {
        game.sceneManager.switchTo('mainMenu', 'fade');
      }
    }
  });
}

// Handle window load event
window.addEventListener('load', init);

// Handle window errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event);
  // Optionally implement a more user-friendly error screen here
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Optionally implement a more user-friendly error screen here
});
