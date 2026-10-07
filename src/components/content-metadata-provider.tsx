'use client';

import { createContext, useContext } from 'react';
import type { LogMeta, WritingMeta } from '@/lib/content/types';

type ContentMetadataContextValue = {
  writings: WritingMeta[];
  logs: LogMeta[];
};

const ContentMetadataContext = createContext<ContentMetadataContextValue>({
  writings: [],
  logs: [],
});

type ProviderProps = {
  writings: WritingMeta[];
  logs: LogMeta[];
  children: React.ReactNode;
};

export function ContentMetadataProvider({ writings, logs, children }: ProviderProps) {
  return (
    <ContentMetadataContext.Provider value={{ writings, logs }}>
      {children}
    </ContentMetadataContext.Provider>
  );
}

export function useContentMetadata() {
  return useContext(ContentMetadataContext);
}
