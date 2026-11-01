/**
 * Standard QWERTY touch-typing finger map (标准英文打字指法).
 * One finger per key per the classic home-row technique:
 *   left pinky  ` 1 Q A Z        right index  6 7 Y U H J N M
 *   left ring   2 W S X          right middle 8 I K ,
 *   left middle 3 E D C          right ring   9 O L .
 *   left index  4 5 R T F G V B  right pinky  0 - = P [ ] ; ' / \
 *   thumbs: Space
 */

export type FingerType = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
export type HandSide = 'left' | 'right' | 'both';

export interface FingerInfo {
  id: string; // e.g. 'left-pinky'
  hand: HandSide;
  finger: FingerType;
  label: string; // 左手小指
  short: string; // 左小指
  mini: string; // 左小 (bubble corner label)
  color: string; // 500-level hex, readable in light & dark themes
}

const FINGER_STYLES: Record<FingerType, { name: string; color: string }> = {
  pinky: { name: '小指', color: '#f43f5e' }, // rose
  ring: { name: '无名指', color: '#f59e0b' }, // amber
  middle: { name: '中指', color: '#10b981' }, // emerald
  index: { name: '食指', color: '#0ea5e9' }, // sky
  thumb: { name: '拇指', color: '#8b5cf6' }, // violet
};

const makeFinger = (hand: HandSide, finger: FingerType): FingerInfo => {
  const { name, color } = FINGER_STYLES[finger];
  const handLabel = hand === 'left' ? '左手' : hand === 'right' ? '右手' : '';
  const handMini = hand === 'left' ? '左' : hand === 'right' ? '右' : '';
  const base = handLabel + name;
  return {
    id: `${hand}-${finger}`,
    hand,
    finger,
    label: base,
    short: base,
    mini: handMini + name.slice(0, 1), // 左小 / 右食 / 拇指
    color,
  };
};

const FINGERS = {
  leftPinky: makeFinger('left', 'pinky'),
  leftRing: makeFinger('left', 'ring'),
  leftMiddle: makeFinger('left', 'middle'),
  leftIndex: makeFinger('left', 'index'),
  rightIndex: makeFinger('right', 'index'),
  rightMiddle: makeFinger('right', 'middle'),
  rightRing: makeFinger('right', 'ring'),
  rightPinky: makeFinger('right', 'pinky'),
  thumb: makeFinger('both', 'thumb'),
};

const { leftPinky, leftRing, leftMiddle, leftIndex, rightIndex, rightMiddle, rightRing, rightPinky, thumb } = FINGERS;

const KEY_FINGER: Record<string, FingerInfo> = {
  '`': leftPinky, '1': leftPinky, q: leftPinky, a: leftPinky, z: leftPinky,
  '2': leftRing, w: leftRing, s: leftRing, x: leftRing,
  '3': leftMiddle, e: leftMiddle, d: leftMiddle, c: leftMiddle,
  '4': leftIndex, '5': leftIndex, r: leftIndex, t: leftIndex, f: leftIndex, g: leftIndex, v: leftIndex, b: leftIndex,
  '6': rightIndex, '7': rightIndex, y: rightIndex, u: rightIndex, h: rightIndex, j: rightIndex, n: rightIndex, m: rightIndex,
  '8': rightMiddle, i: rightMiddle, k: rightMiddle, ',': rightMiddle,
  '9': rightRing, o: rightRing, l: rightRing, '.': rightRing,
  '0': rightPinky, '-': rightPinky, '=': rightPinky, p: rightPinky, '[': rightPinky, ']': rightPinky,
  ';': rightPinky, "'": rightPinky, '\\': rightPinky, '/': rightPinky,
  ' ': thumb,
};

/** Finger that should press a key per standard touch typing; null for unmapped keys. */
export function getFingerInfo(key: string): FingerInfo | null {
  const k = key.toLowerCase();
  if (!k) return null;
  return KEY_FINGER[k] ?? null;
}

/** Legend order: left hand pinky→index, right hand index→pinky, thumbs. */
export const FINGER_LEGEND: FingerInfo[] = [
  leftPinky,
  leftRing,
  leftMiddle,
  leftIndex,
  rightIndex,
  rightMiddle,
  rightRing,
  rightPinky,
  thumb,
];

export const HOME_ROW_HINT = '基准键 ASDF · JKL;';
