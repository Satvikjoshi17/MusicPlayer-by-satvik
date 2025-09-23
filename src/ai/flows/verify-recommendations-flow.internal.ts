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
    try {
      // Use a more specific query for better results.
      const results = await searchTracksApi(`${title} by ${artist}`);
      // Find the best match. Often the first result is good enough.
      if (results && results.length > 0) {
        return results[0]; 
      }
      throw new Error('No tracks found.');
    } catch (e) {
      console.error(`Failed to find track for ${title} by ${artist}`, e);
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
    
    const verifiedTracks: (Track | null)[] = [];

    // Process recommendations sequentially to avoid rate-limiting the backend API.
    for (const rec of input.recommendations) {
        try {
            const track = await findTrackTool(rec);
            verifiedTracks.push(track);
        } catch (error) {
            console.warn(`Verification failed for "${rec.title}" by ${rec.artist}: ${error instanceof Error ? error.message : String(error)}`);
            verifiedTracks.push(null); // Push null if a track can't be verified.
        }
    }

    return {
      tracks: verifiedTracks,
    };
  }
);
