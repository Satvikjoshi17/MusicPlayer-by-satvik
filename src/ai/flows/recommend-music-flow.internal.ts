/**
 * @fileOverview The internal implementation of the music recommendation AI agent.
 * This file is not a server action and should not be imported directly by client components.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendedTrackSchema = z.object({
  artist: z.string().describe('The artist of the recommended song.'),
  title: z.string().describe('The title of the recommended song.'),
  url: z.string().url().describe("A YouTube URL for the recommended song."),
  duration: z.number().describe("The duration of the song in seconds."),
  reason: z.string().describe('A short, friendly sentence explaining why this track is recommended based on the playlist theme.'),
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
  recommendations: z.array(z.object({
    artist: z.string().describe('The artist of the recommended song.'),
    title: z.string().describe('The title of the recommended song.'),
    url: z.string().url().describe("A YouTube URL for the recommended song."),
    duration: z.number().describe("The duration of the song in seconds."),
    reason: z.string().optional().describe('A short, friendly sentence explaining why this track is recommended based on the playlist theme.'),
  })).describe('A list of 4 recommended songs for the playlist.'),
});
export type RecommendMusicOutput = z.infer<typeof RecommendMusicOutputSchema>;

const prompt = ai.definePrompt({
  name: 'recommendMusicPrompt',
  input: {schema: RecommendMusicInputSchema},
  output: {schema: RecommendMusicOutputSchema},
  prompt: `You are an expert DJ who creates personalized playlists. Based on the user's listening history, create a themed playlist of 4 songs.

You must provide:
1. A creative, short title for the playlist (e.g., "Late Night Drive", "Acoustic Mornings", "Synthwave Dreams").
2. A list of 4 new and different songs that the user might like, matching the playlist theme.

For each song, you must provide a valid YouTube URL. Do not provide a reason.

Provide a diverse list of recommendations based on the genres and artists of the recently played tracks. Do not recommend songs that are already in the recent tracks list.

If the list of recent tracks is very short (1 or 2 songs), create a "Discovery Weekly" style playlist with popular tracks from related genres.

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
    outputSchema: RecommendMusicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
