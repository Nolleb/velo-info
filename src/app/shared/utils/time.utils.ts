export function minutesToTimeString(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) {
    return '00:00:00';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  const padZero = (num: number) => num.toString().padStart(2, '0');

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}
