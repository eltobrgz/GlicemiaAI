
'use server';

/**
 * @fileOverview Converts text to speech using Google AI.
 * - textToSpeech - The main flow function that converts text to a playable audio data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

// Input schema for the TTS flow, expecting a simple string.
export const TextToSpeechInputSchema = z.string();

// Output schema for the TTS flow, returning the audio as a data URI string.
export const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a base64-encoded WAV data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

/**
 * Converts PCM audio data buffer to a Base64-encoded WAV string.
 * @param pcmData The raw PCM audio buffer from the AI model.
 * @param channels Number of audio channels.
 * @param rate Sample rate of the audio.
 * @param sampleWidth Bytes per sample.
 * @returns A promise that resolves to the Base64-encoded WAV string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// Define the Genkit flow for text-to-speech conversion.
const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (textToSpeak) => {
    if (!textToSpeak) {
      throw new Error('Input text cannot be empty.');
    }

    // Generate audio from the AI model.
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A standard, clear voice
          },
        },
      },
      prompt: textToSpeak,
    });

    if (!media?.url) {
      throw new Error('No audio media was returned from the AI model.');
    }

    // The returned URL is a data URI with base64 PCM data. We extract the data part.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    // Convert the raw PCM data to a proper WAV format.
    const wavBase64 = await toWav(audioBuffer);

    // Return the result in the expected schema format.
    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);


/**
 * Exported wrapper function to be called from the frontend.
 * @param text The text to be converted to speech.
 * @returns An object containing the audio data URI.
 */
export async function textToSpeech(text: string): Promise<TextToSpeechOutput> {
    return textToSpeechFlow(text);
}
