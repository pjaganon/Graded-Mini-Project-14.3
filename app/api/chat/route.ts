import { openai } from '@ai-sdk/openai';
import { streamText, tool, embed } from 'ai';
import { Index } from '@upstash/vector';
import { z } from 'zod';

const index = new Index();

const SYSTEM = `You are Nexus, a research analyst for the academic case study
"The Nexus of Science Fiction, Box Office Success, and Technology Representation:
A Case Study of the Marvel Cinematic Universe" by Iqra Tariq.

Use the getInformation tool to retrieve passages before answering.
Ground claims in those passages and mention page numbers when they are available.
If the case study does not contain the answer, say so clearly.
Stay on the paper's topics: MCU technology portrayal, applied science domains,
Tech Content Count, box office performance, and the "tech boost" effect.
Write clearly and concisely for a curious film/tech reader.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

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

  return result.toDataStreamResponse();
}
