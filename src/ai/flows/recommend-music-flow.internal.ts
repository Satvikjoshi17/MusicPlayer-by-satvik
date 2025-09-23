/**
 * @fileOverview The internal implementation of the music recommendation AI agent.
 * This file is not a server action and should not be imported directly by client components.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
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
- Provide a diverse list of recommendations with a mix of genres and artists, including some new and different from the user's history.
- Do not recommend songs that are already in the recent tracks list.
- If the list of recent tracks is very short (1 or 2 songs), create a "Discovery Weekly" style playlist with popular tracks from related genres.
- Do not provide a reason, a URL, or any other text in your response. Just the artist and title.

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
    console.log('[recommendMusicFlow] Starting recommendation flow...');
    
    // Step 1: Get creative ideas from the LLM.
    console.log('[recommendMusicFlow] Getting playlist ideas from AI...');
    const {output: ideas} = await prompt(input);
    if (!ideas || !ideas.recommendations || ideas.recommendations.length === 0) {
      console.error('[recommendMusicFlow] Failed to get recommendation ideas from AI. The AI response was empty or had no recommendations.');
      return { playlistTitle: 'AI Recommendations', recommendations: [] };
    }
    console.log(`[recommendMusicFlow] AI generated playlist title: "${ideas.playlistTitle}"`);
    console.log(`[recommendMusicFlow] AI generated ${ideas.recommendations.length} song ideas.`);


    // Step 2: Verify and enrich the ideas using the verification flow.
    console.log('[recommendMusicFlow] Starting verification process for song ideas...');
    const verifiedOutput = await verifyRecommendationsFlow({recommendations: ideas.recommendations});
    
    const validTracks = verifiedOutput.tracks.filter((t): t is Track => t !== null);
    console.log(`[recommendMusicFlow] Verification complete. Found ${validTracks.length} valid tracks out of ${ideas.recommendations.length} ideas.`);

    const result = {
      playlistTitle: ideas.playlistTitle,
      recommendations: validTracks,
    };

    console.log('[recommendMusicFlow] Returning final playlist to client.');
    return result;
  }
);
