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
  try {
    // If there are no recent tracks, the AI will recommend popular songs based on the prompt.
    // The prompt is designed to handle this case gracefully.
    return await recommendMusicFlow(input);
  } catch (error: any) {
    // Log the detailed error on the server for debugging purposes.
    // This is especially useful for API key or permission issues with the AI service.
    console.error(`[AI FLOW ERROR] Failed to execute recommendMusicFlow: ${error.message}`);
    
    // It's important to re-throw the error to let the client-side know something went wrong.
    // Next.js will sanitize this error for the client in production.
    throw new Error('Failed to get music recommendations from the server.');
  }
}
