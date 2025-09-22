'use server';
/**
 * @fileOverview A utility to verify if a YouTube URL is playable.
 */

import { getStreamUrl } from '@/lib/api';
import { z } from 'genkit';

const VerifyTrackInputSchema = z.object({
  youtubeUrl: z.string().url().describe('The YouTube URL to verify.'),
});

/**
 * Checks if a given YouTube URL can be successfully streamed by the application backend.
 * This is a simple server action that does not involve an LLM.
 * @param input The track URL to verify.
 * @returns A boolean indicating if the track is streamable.
 */
export async function verifyTrackUrl(input: z.infer<typeof VerifyTrackInputSchema>): Promise<boolean> {
  try {
    const controller = new AbortController();
    // Give it a 10-second timeout, as we call this multiple times.
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await getStreamUrl(input.youtubeUrl, controller.signal);
    clearTimeout(timeoutId);

    // If we get a stream URL, it's considered a success.
    return !!response.streamUrl;
  } catch (error: any) {
    // If the backend throws or times out, it's a failure.
    console.warn(`Verification failed for URL: ${input.youtubeUrl}`, error.message);
    return false;
  }
}
