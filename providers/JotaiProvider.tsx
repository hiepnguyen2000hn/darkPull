'use client';

import { Provider, createStore } from 'jotai';
import { ReactNode } from 'react';

// Shared store instance - used by both Provider and external setters
export const appStore = createStore();

interface JotaiProviderProps {
  children: ReactNode;
}

export function JotaiProvider({ children }: JotaiProviderProps) {
  return <Provider store={appStore}>{children}</Provider>;
}
