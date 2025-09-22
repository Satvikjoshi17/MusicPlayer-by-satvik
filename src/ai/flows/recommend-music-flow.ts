'use server';
/**
 * @fileOverview A music recommendation AI agent.
 *
 * - recommendMusic - A function that handles the music recommendation process.
 * - RecommendMusicInput - The input type for the recommendMusic function.
 * - RecommendMusicOutput - The return type for the recommendMusic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendedTrackSchema = z.object({
  artist: z.string().describe('The artist of the recommended song.'),
  title: z.string().describe('The title of the recommended song.'),
  url: z.string().url().describe("A YouTube URL for the recommended song."),
  duration: z.number().describe("The duration of the song in seconds."),
  reason: z.string().describe('A short, friendly sentence explaining why this track is recommended based on the recent tracks.'),
});

const RecommendMusicInputSchema = z.object({
  recentTracks: z.array(z.object({
    title: z.string(),
    artist: z.string(),
  })).describe('A list of recently played tracks.'),
});
export type RecommendMusicInput = z.infer<typeof RecommendMusicInputSchema>;

const RecommendMusicOutputSchema = z.object({
  recommendations: z.array(RecommendedTrackSchema).describe('A list of 4 recommended songs.'),
});
export type RecommendMusicOutput = z.infer<typeof RecommendMusicOutputSchema>;

export async function recommendMusic(input: RecommendMusicInput): Promise<RecommendMusicOutput> {
  return recommendMusicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendMusicPrompt',
  input: {schema: RecommendMusicInputSchema},
  output: {schema: RecommendMusicOutputSchema},
  prompt: `You are a music recommendation expert. Based on the following list of recently played tracks, please recommend 4 new and different songs that the user might like.

For each song, you must provide a valid YouTube URL and a short, friendly sentence explaining why you are recommending it (e.g., "Because you like [Artist/Genre], you might enjoy this.").

Provide a diverse list of recommendations based on the genres and artists of the recently played tracks. Do not recommend songs that are already in the recent tracks list.

Recently Played:
{{#each recentTracks}}
- "{{this.title}}" by {{this.artist}}
{{/each}}
`,
});

const recommendMusicFlow = ai.defineFlow(
  {
    name: 'recommendMusicFlow',
    inputSchema: RecommendMusicInputSchema,
    outputSchema: RecommendMusicOutputSchema,
  },
  async input => {
    if (input.recentTracks.length === 0) {
      return { recommendations: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
