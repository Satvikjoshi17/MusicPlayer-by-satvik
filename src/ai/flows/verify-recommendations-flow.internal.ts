/**
 * @fileOverview A flow to verify and enrich music recommendations.
 * This file is not a server action and should not be imported directly by client components.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchTracks as searchTracksApi } from '@/lib/api';
import type { Track } from '@/lib/types';


// Tool to find a specific track using the existing search API
const findTrackTool = ai.defineTool(
  {
    name: 'findTrack',
    description: 'Find a specific song by title and artist to get its full details, including a playable URL and thumbnail.',
    inputSchema: z.object({
      title: z.string().describe("The title of the song to search for."),
      artist: z.string().describe("The artist of the song."),
    }),
    outputSchema: z.custom<Track>(),
  },
  async ({ title, artist }) => {
    console.log(`[findTrackTool] Searching for track: "${title}" by ${artist}`);
    try {
      const results = await searchTracksApi(`${title} by ${artist}`);
      if (results && results.length > 0) {
        console.log(`[findTrackTool] Found track: "${results[0].title}" (ID: ${results[0].id})`);
        return results[0]; 
      }
      console.warn(`[findTrackTool] No tracks found for "${title}" by ${artist}.`);
      throw new Error('No tracks found.');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`[findTrackTool] Failed to find track for "${title}" by ${artist}. Error: ${errorMessage}`);
      throw new Error(`Could not find a playable track for ${title} by ${artist}.`);
    }
  }
);

// Define the schema for the input to this verification flow.
const VerifyRecommendationsInputSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    artist: z.string(),
  })),
});

// Define the schema for the output of this flow. It can include nulls for tracks that couldn't be verified.
const VerifyRecommendationsOutputSchema = z.object({
  tracks: z.array(z.custom<Track | null>()).describe("An array of verified tracks. If a track cannot be verified, it will be null."),
});
  

export const verifyRecommendationsFlow = ai.defineFlow(
  {
    name: 'verifyRecommendationsFlow',
    inputSchema: VerifyRecommendationsInputSchema,
    outputSchema: VerifyRecommendationsOutputSchema,
  },
  async (input) => {
    console.log('[verifyRecommendationsFlow] Starting verification for', input.recommendations.length, 'tracks.');
    
    const verifiedTracks: (Track | null)[] = [];

    // Process recommendations sequentially to avoid rate-limiting the backend API.
    for (const rec of input.recommendations) {
        try {
            console.log(`[verifyRecommendationsFlow] Fetching URL for: "${rec.title}" by ${rec.artist}`);
            const track = await findTrackTool(rec);
            verifiedTracks.push(track);
            console.log(`[verifyRecommendationsFlow] Fetched successfully for: "${rec.title}"`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[verifyRecommendationsFlow] Verification failed for "${rec.title}" by ${rec.artist}: ${errorMessage}`);
            verifiedTracks.push(null); // Push null if a track can't be verified.
        }
    }
    
    console.log('[verifyRecommendationsFlow] Finished verification process.');
    return {
      tracks: verifiedTracks,
    };
  }
);
