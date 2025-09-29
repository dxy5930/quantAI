import React from 'react';
import type { ReactNode } from 'react';
import { CounterStore } from './counterStore';

export class RootStore {
  counterStore: CounterStore;

  constructor() {
    this.counterStore = new CounterStore();
  }
}

const StoreContext = React.createContext<RootStore | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = React.useState(() => new RootStore());
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export const useStore = (): RootStore => {
  const context = React.useContext(StoreContext);
  if (context === null) {
    throw new Error('useStore 必须在 StoreProvider 内使用');
  }
  return context;
};

export type { CounterStore }; 