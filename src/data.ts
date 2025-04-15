import { AssetItem } from './core/assets/Assetmanager';

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

  {
    key: 'char_alex_neutral',
    url: 'assets/images/characters/alex/neutral.png',
    type: 'image'
  },
  {
    key: 'char_alex_happy',
    url: 'assets/images/characters/alex/happy.png',
    type: 'image'
  },
  {
    key: 'char_alex_sad',
    url: 'assets/images/characters/alex/sad.png',
    type: 'image'
  },
  {
    key: 'char_maya_neutral',
    url: 'assets/images/characters/maya/neutral.png',
    type: 'image'
  },
  {
    key: 'char_maya_happy',
    url: 'assets/images/characters/maya/happy.png',
    type: 'image'
  },
  {
    key: 'char_maya_thoughtful',
    url: 'assets/images/characters/maya/thoughtful.png',
    type: 'image'
  },
  {
    key: 'char_narrator',
    url: 'assets/images/characters/narrator.png',
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

export { assetsToLoad };
