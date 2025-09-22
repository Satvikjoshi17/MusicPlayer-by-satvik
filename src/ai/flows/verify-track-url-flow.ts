'use server';
/**
 * @fileOverview An AI flow to verify if a YouTube URL is playable.
 */

import { ai } from '@/ai/genkit';
import { getStreamUrl } from '@/lib/api';
import { z } from 'genkit';

const VerifyTrackInputSchema = z.object({
  youtubeUrl: z.string().url().describe('The YouTube URL to verify.'),
});

// A tool that checks our own backend's streaming endpoint
const checkStreamability = ai.defineTool(
  {
    name: 'checkStreamability',
    description: 'Checks if a given YouTube URL can be successfully streamed by the application backend.',
    inputSchema: z.object({
      url: z.string().url(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
      const response = await getStreamUrl(input.url);
      // If we get a stream URL, it's considered a success.
      return { success: !!response.streamUrl };
    } catch (error: any) {
      // If the backend throws, it's a failure.
      return { success: false, error: error.message };
    }
  }
);

const verificationPrompt = ai.definePrompt({
    name: 'verifyTrackUrlPrompt',
    input: { schema: VerifyTrackInputSchema },
    output: { schema: z.boolean() },
    tools: [checkStreamability],
    prompt: `Given the YouTube URL, use the checkStreamability tool to determine if it is playable. 
    Return true if the tool's success field is true, otherwise return false.

    URL: {{{youtubeUrl}}}`,
});

export async function verifyTrackUrlFlow(input: z.infer<typeof VerifyTrackInputSchema>): Promise<boolean> {
    const llmResponse = await verificationPrompt(input);
    const output = llmResponse.output();
    if (output === undefined) {
        // If the LLM fails to return a boolean, assume the track is not verifiable.
        return false;
    }
    return output;
}
