
'use client';

import { useContext } from 'react';
import { PlayerContext } from '@/context/player-context';

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
