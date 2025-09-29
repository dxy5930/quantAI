import { makeAutoObservable } from 'mobx';

export class CounterStore {
  value: number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment(by: number = 1): void {
    this.value += by;
  }

  decrement(by: number = 1): void {
    this.value -= by;
  }

  reset(): void {
    this.value = 0;
  }

  get isPositive(): boolean {
    return this.value > 0;
  }
}

export type CounterStoreSnapshot = {
  value: number;
}; 