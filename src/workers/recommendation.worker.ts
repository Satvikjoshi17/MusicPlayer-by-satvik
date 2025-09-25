
/// <reference lib="webworker" />
import { recommendMusic, RecommendMusicInput, RecommendMusicOutput } from '@/ai/flows/recommend-music-flow';

const WORKER_TIMEOUT = 90000; // 90 seconds

self.addEventListener('message', async (event: MessageEvent<RecommendMusicInput>) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Recommendation worker timed out after 90 seconds.')), WORKER_TIMEOUT)
  );

  try {
    const result = await Promise.race([
      recommendMusic(event.data),
      timeoutPromise
    ]);
    
    // The type assertion is safe because if timeoutPromise rejects, we'll be in the catch block.
    self.postMessage(result as RecommendMusicOutput);
  } catch (error: any) {
    console.error('Error in recommendation worker:', error);
    self.postMessage({ error: error.message || 'An unknown error occurred in the worker.' });
  }
});
