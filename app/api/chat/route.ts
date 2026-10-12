import { openai } from '@ai-sdk/openai';
import { streamText, tool, embed } from 'ai';
import { Index } from '@upstash/vector';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const REQUIRED_ENV = [
  'OPENAI_API_KEY',
  'UPSTASH_VECTOR_REST_URL',
  'UPSTASH_VECTOR_REST_TOKEN',
] as const;

const SYSTEM = `You are Nexus, a research analyst for the academic case study
"The Nexus of Science Fiction, Box Office Success, and Technology Representation:
A Case Study of the Marvel Cinematic Universe" by Iqra Tariq.

Use the getInformation tool to retrieve passages before answering.
Ground claims in those passages and mention page numbers when they are available.
If the case study does not contain the answer, say so clearly.
Stay on the paper's topics: MCU technology portrayal, applied science domains,
Tech Content Count, box office performance, and the "tech boost" effect.
Write clearly and concisely for a curious film/tech reader.`;

function missingEnv() {
  return REQUIRED_ENV.filter((key) => !process.env[key]);
}

export async function POST(req: Request) {
  const missing = missingEnv();
  if (missing.length > 0) {
    return Response.json(
      {
        error: `Missing ${missing.join(', ')} on the server. In Vercel, open Settings → Environment Variables, add them for Production and Preview, then Redeploy.`,
      },
      { status: 500 },
    );
  }

  try {
    const { messages } = await req.json();
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM,
      messages,
      tools: {
        getInformation: tool({
          description:
            'Retrieve passages from the MCU technology and box office case study.',
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            const { embedding } = await embed({
              model: openai.embedding('text-embedding-3-small'),
              value: query,
            });
            const hits = await index.query({
              vector: embedding,
              topK: 4,
              includeMetadata: true,
            });
            return hits.map((h) => ({
              text: (h.metadata?.text as string) ?? '',
              page: (h.metadata?.page as number) ?? null,
              score: h.score,
            }));
          },
        }),
      },
      maxSteps: 3,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) =>
        error instanceof Error ? error.message : 'Unknown error while answering.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
