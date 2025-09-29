export const noop = (): void => {};

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export default {
  noop,
  delay,
}; 