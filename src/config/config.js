export const circleTime = 5 * 1e3 // 30 * 1e3 // 一次循环的时间，单位ms
export const groupSize = 6
export const fontSeq = [
  [1, 2, 6, 3, 5, 4],
  [2, 3, 1, 4, 6, 5],
  [3, 4, 2, 5, 1, 6],
  [4, 5, 3, 6, 2, 1],
  [5, 6, 4, 1, 3, 2],
  [6, 1, 5, 2, 4, 3],
];
export const fontSeqIdx = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, -1, -1, -1 -1]
export const questionCompleteStep = 4 // group的个数
export const screenSeq = [0, 1, 1, 0,  1, 0, 0, 1,  0, 1, 1, 0,  1, 0, 0, 1] // 0是内屏，1是外屏
export const hasRelax = false