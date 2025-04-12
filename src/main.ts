import { AssetItem } from './core/assets/Assetmanager';
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
    console.log('Starting game initialization...');

    // Register scenes
    const loadingScene = new LoadingScene(game);
    game.sceneManager.register('loading', loadingScene);

    const menuScene = new MainMenuScene(game);
    game.sceneManager.register('mainMenu', menuScene);

    const storyScene = new StoryScene(game);
    game.sceneManager.register('story', storyScene);

    // Switch to loading scene first
    await game.sceneManager.switchTo('loading');

    // Setup asset loading
    const assetsToLoad: AssetItem[] = [
      // 🌄 Backgrounds
      {
        key: 'forest_entrance',
        url: 'assets/images/backgrounds/forest_entrance.jpg',
        type: 'image'
      },
      {
        key: 'forest_clearing',
        url: 'assets/images/backgrounds/forest_clearing.jpg',
        type: 'image'
      },
      { key: 'ancient_tree', url: 'assets/images/backgrounds/ancient_tree.jpg', type: 'image' },
      { key: 'ruined_temple', url: 'assets/images/backgrounds/ruined_temple.jpg', type: 'image' },
      { key: 'forest_path', url: 'assets/images/backgrounds/forest_path.jpg', type: 'image' },
      {
        key: 'magical_crystal',
        url: 'assets/images/backgrounds/magical_crystal.jpg',
        type: 'image'
      },
      { key: 'forest_exit', url: 'assets/images/backgrounds/forest_exit.jpg', type: 'image' },
      { key: 'sacred_altar', url: 'assets/images/backgrounds/sacred_altar.jpg', type: 'image' },
      {
        key: 'temple_interior',
        url: 'assets/images/backgrounds/temple_interior.jpg',
        type: 'image'
      },
      { key: 'night_forest', url: 'assets/images/backgrounds/night_forest.jpg', type: 'image' },

      // 🎭 Characters
      {
        key: 'char_guide_neutral',
        url: 'assets/images/characters/guide/neutral.png',
        type: 'image'
      },
      {
        key: 'char_guide_smiling',
        url: 'assets/images/characters/guide/smiling.png',
        type: 'image'
      },
      {
        key: 'char_guide_concerned',
        url: 'assets/images/characters/guide/concerned.png',
        type: 'image'
      },
      {
        key: 'char_guide_mysterious',
        url: 'assets/images/characters/guide/mysterious.png',
        type: 'image'
      },
      {
        key: 'char_player_neutral',
        url: 'assets/images/characters/player/neutral.png',
        type: 'image'
      },
      {
        key: 'char_player_surprised',
        url: 'assets/images/characters/player/surprised.png',
        type: 'image'
      },
      {
        key: 'char_player_determined',
        url: 'assets/images/characters/player/determined.png',
        type: 'image'
      },
      {
        key: 'char_spirit_ethereal',
        url: 'assets/images/characters/spirit/ethereal.png',
        type: 'image'
      },
      {
        key: 'char_spirit_powerful',
        url: 'assets/images/characters/spirit/powerful.png',
        type: 'image'
      },

      // 🔊 Audio
      { key: 'forest_ambience', url: 'assets/audio/ambience/forest.mp3', type: 'audio' },
      { key: 'mystery_theme', url: 'assets/audio/music/mystery_theme.mp3', type: 'audio' },
      { key: 'magical_discovery', url: 'assets/audio/sfx/magical_discovery.mp3', type: 'audio' },
      { key: 'danger_theme', url: 'assets/audio/music/danger_theme.mp3', type: 'audio' },
      { key: 'victory_theme', url: 'assets/audio/music/victory_theme.mp3', type: 'audio' },
      { key: 'heart_beat', url: 'assets/audio/sfx/heart_beat.mp3', type: 'audio' },
      { key: 'crystal_hum', url: 'assets/audio/sfx/crystal_hum.mp3', type: 'audio' },
      { key: 'leaves_rustle', url: 'assets/audio/sfx/leaves_rustle.mp3', type: 'audio' },
      { key: 'ancient_whispers', url: 'assets/audio/sfx/ancient_whispers.mp3', type: 'audio' },
      { key: 'tree_communion', url: 'assets/audio/sfx/tree_communion.mp3', type: 'audio' }
    ];

    // Load assets
    try {
      await game.assetManager.loadAll(assetsToLoad);
      console.log('Assets loaded successfully');
    } catch (error) {
      console.warn('Some assets failed to load:', error);
      alert('Some assets could not be loaded. The game may not display correctly.');
    }

    // Register characters
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
          texturePath: './assets/characters/alex/neutral.png'
        },
        {
          id: 'happy',
          emotion: CharacterEmotion.HAPPY,
          texturePath: './assets/characters/alex/happy.png'
        },
        {
          id: 'sad',
          emotion: CharacterEmotion.SAD,
          texturePath: './assets/characters/alex/sad.png'
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
          texturePath: './assets/characters/maya/neutral.png'
        },
        {
          id: 'happy',
          emotion: CharacterEmotion.HAPPY,
          texturePath: './assets/characters/maya/happy.png'
        },
        {
          id: 'thoughtful',
          emotion: CharacterEmotion.THOUGHTFUL,
          texturePath: './assets/characters/maya/thoughtful.png'
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

    // Initialize scenes
    await loadingScene.init();
    await menuScene.init();
    await storyScene.init();

    // Load a sample story from file (this will need to be created)
    try {
      // This assumes you have a story file available
      await game.loadStory('assets/stories/story.yaml', 'yaml');
      console.log('Story loaded successfully');
    } catch (error) {
      console.error('Failed to load story:', error);
      alert('Could not load the story. Please try again later.');
    }

    // Setup event listeners
    setupEventListeners();

    // Switch to main menu after loading is complete
    await game.sceneManager.switchTo('mainMenu', 'fade');

    // Start the game
    game.start();
    console.log('Game started successfully');
  } catch (error) {
    console.error('Game initialization failed:', error);
    alert('Failed to initialize the game. Please refresh the page.');
  }
}

// Setup game event listeners
function setupEventListeners(): void {
  // Listen for game-wide events
  game.on('game:resize', (width: number, height: number) => {
    console.log(`Game resized to ${width}x${height}`);
  });

  // Listen for story-related events
  game.getStoryManager().on('story:start', () => {
    console.log('Story started');
  });

  game.getStoryManager().on('story:complete', () => {
    console.log('Story completed');
    // Handle story completion, maybe show a special scene or return to menu
    game.sceneManager.switchTo('mainMenu', 'fade');
  });

  game.getStoryManager().on('node:enter', (nodeId: string) => {
    console.log(`Entered story node: ${nodeId}`);
  });

  game.getStoryManager().on('branch:complete', (branchId: string) => {
    console.log(`Completed branch: ${branchId}`);
  });

  // Listen for character events
  game.characterManager.on('character:added', (characterId: string) => {
    console.log(`Character added: ${characterId}`);
  });

  // Listen for save/load events
  game.stateManager.on('state:save', (saveId: string) => {
    console.log(`Game saved with ID: ${saveId}`);
  });

  game.stateManager.on('state:load', (saveId: string) => {
    console.log(`Game loaded from save ID: ${saveId}`);
  });

  // Setup keyboard shortcuts for debugging
  window.addEventListener('keydown', (event) => {
    // Ctrl+S to save
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      game.saveGame('quicksave').then((saveId) => {
        console.log(`Game quicksaved with ID: ${saveId}`);
      });
    }

    // Ctrl+L to load
    if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      const saves = game.getSaveFiles();
      if (saves.length > 0) {
        game.loadGame(saves[0].id);
      } else {
        console.log('No saves available to load');
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
window.addEventListener('load', () => {
  init().catch((error) => {
    console.error('Game initialization error:', error);
    alert('An error occurred while starting the game. Please refresh the page.');
  });
});

// Handle window errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Optionally implement a more user-friendly error screen here
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Optionally implement a more user-friendly error screen here
});
