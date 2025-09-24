/**
 * @fileOverview A flow to verify and enrich music recommendations.
 * This file is not a server action and should not be imported directly by client components.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
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
    outputSchema: z.custom<Track | null>(),
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
      return null;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`[findTrackTool] Failed to find track for "${title}" by ${artist}. Error: ${errorMessage}`);
      return null; // Return null on error to not block other verifications
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
    const totalTracks = input.recommendations.length;
    console.log(`[verifyRecommendationsFlow] Starting parallel verification for ${totalTracks} tracks.`);
    
    const verificationPromises = input.recommendations.map((rec) => {
      // No try-catch here, let the tool handle it gracefully by returning null
      return findTrackTool(rec);
    });

    // Use Promise.allSettled to ensure all verifications complete, even if some fail.
    const results = await Promise.allSettled(verificationPromises);

    const verifiedTracks = results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    );
    
    console.log('[verifyRecommendationsFlow] Finished verification process.');
    return {
      tracks: verifiedTracks,
    };
  }
);
