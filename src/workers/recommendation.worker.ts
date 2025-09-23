/// <reference lib="webworker" />
import { recommendMusic, RecommendMusicInput, RecommendMusicOutput } from '@/ai/flows/recommend-music-flow';

self.addEventListener('message', async (event: MessageEvent<RecommendMusicInput>) => {
  try {
    const result: RecommendMusicOutput = await recommendMusic(event.data);
    self.postMessage(result);
  } catch (error: any) {
    console.error('Error in recommendation worker:', error);
    self.postMessage({ error: error.message || 'An unknown error occurred in the worker.' });
  }
});
