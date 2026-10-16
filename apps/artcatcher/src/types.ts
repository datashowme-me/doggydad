export type CameraAngle = 'FRONT' | 'ISOMETRIC' | 'TOP_DOWN' | 'SIDE' | 'CLOSE_UP' | 'FREE';

export type GameState =
  | 'IDLE'
  | 'MOVING'
  | 'DROPPING'
  | 'GRABBING'
  | 'ASCENDING'
  | 'RETURNING'
  | 'RELEASING'
  | 'WIN';

export interface PrizeMetadata {
  id: string;
  name: string;
  originalArtwork: string;
  artist: string;
  year: string;
  museum: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
  accentColor: string;
  figurineType:
    | 'bear' | 'cat' | 'bunny' | 'whale' | 'scream' | 'dog' | 'capybara' | 'lion'
    | 'rainbow_pony' | 'twilight_pony' | 'pinkie_pony' | 'fluttershy_pony'
    | 'applejack_pony' | 'rarity_pony' | 'celestia_pony' | 'luna_pony'
    | 'dali_clock' | 'warhol_soup' | 'kusama_pumpkin' | 'angel_pup'
    | 'teletubby_tinky' | 'teletubby_dipsy' | 'teletubby_laalaa' | 'teletubby_po';
}

export interface CollectionItem {
  prizeId: string;
  caughtCount: number;
  firstCaughtAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  condition: (stats: GameStats) => boolean;
}

export interface GameStats {
  totalAttempts: number;
  totalCatches: number;
  distinctPrizesCaught: number;
  coinsSpent: number;
  consecutiveMisses: number;
  viewAnglesSwitched: number;
}
