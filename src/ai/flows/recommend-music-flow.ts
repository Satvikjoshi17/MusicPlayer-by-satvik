'use server';
/**
 * @fileOverview A server action to trigger the music recommendation AI flow.
 *
 * - recommendMusic - A function that handles the music recommendation process.
 * - RecommendMusicInput - The input type for the recommendMusic function.
 * - RecommendMusicOutput - The return type for the recommendMusic function.
 */

import { recommendMusicFlow, RecommendMusicInput, RecommendMusicOutput } from './recommend-music-flow.internal';

// Re-export types for client-side usage
export type { RecommendMusicInput, RecommendMusicOutput };

export async function recommendMusic(input: RecommendMusicInput): Promise<RecommendMusicOutput> {
  // If there are no recent tracks, the AI will recommend popular songs based on the prompt.
  // The prompt is designed to handle this case gracefully.
  return recommendMusicFlow(input);
}
