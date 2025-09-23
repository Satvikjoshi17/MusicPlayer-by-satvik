/**
 * @fileOverview The internal implementation of the music recommendation AI agent.
 * This file is not a server action and should not be imported directly by client components.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { verifyRecommendationsFlow } from './verify-recommendations-flow.internal';
import type { Track } from '@/lib/types';


const RecommendedTrackIdeaSchema = z.object({
  artist: z.string().describe('The artist of the recommended song.'),
  title: z.string().describe('The title of the recommended song.'),
});

const RecommendMusicInputSchema = z.object({
  recentTracks: z.array(z.object({
    title: z.string(),
    artist: z.string(),
  })).describe('A list of recently played tracks.'),
});
export type RecommendMusicInput = z.infer<typeof RecommendMusicInputSchema>;

const RecommendMusicOutputSchema = z.object({
  playlistTitle: z.string().describe("A creative and short title for the recommended playlist based on the user's history (e.g., 'Indie Chill', 'Sunset Grooves')."),
  recommendations: z.array(RecommendedTrackIdeaSchema).describe('A list of 6 recommended songs for the playlist.'),
});


const RecommendMusicVerifiedOutputSchema = z.object({
  playlistTitle: z.string(),
  recommendations: z.array(z.custom<Track>()),
});
export type RecommendMusicOutput = z.infer<typeof RecommendMusicVerifiedOutputSchema>;

const prompt = ai.definePrompt({
  name: 'recommendMusicPrompt',
  input: {schema: RecommendMusicInputSchema},
  output: {schema: RecommendMusicOutputSchema},
  prompt: `You are an expert DJ who creates personalized playlists. Based on the user's listening history, create a themed playlist of 6 songs.

You must provide:
1.  A creative, short title for the playlist (e.g., "Late Night Drive", "Acoustic Mornings").
2.  A list of 6 new and different songs that the user might like. Provide just the artist and title.

CRITICAL INSTRUCTIONS:
- Provide a diverse list of recommendations based on the genres and artists of the recently played tracks.
- Do not recommend songs that are already in the recent tracks list.
- If the list of recent tracks is very short (1 or 2 songs), create a "Discovery Weekly" style playlist with popular tracks from related genres.
- Do not provide a reason, a URL, or any other text in your response. Just the artist and title.
- Only recommend real, existing songs by the specified artists.

Recently Played:
{{#each recentTracks}}
- "{{this.title}}" by {{this.artist}}
{{/each}}
`,
});

export const recommendMusicFlow = ai.defineFlow(
  {
    name: 'recommendMusicFlow',
    inputSchema: RecommendMusicInputSchema,
    outputSchema: RecommendMusicVerifiedOutputSchema,
  },
  async input => {
    // Step 1: Get creative ideas from the LLM.
    const {output: ideas} = await prompt(input);
    if (!ideas) {
      throw new Error('Failed to get recommendation ideas from AI');
    }

    // Step 2: Verify and enrich the ideas using the verification flow.
    const verifiedOutput = await verifyRecommendationsFlow({recommendations: ideas.recommendations});
    
    // The verification flow now returns an array of Tracks or nulls. Filter out the nulls.
    const validTracks = verifiedOutput.tracks.filter((t): t is Track => t !== null);

    return {
      playlistTitle: ideas.playlistTitle,
      recommendations: validTracks,
    };
  }
);
