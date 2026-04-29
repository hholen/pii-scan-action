import { pipeline, type TokenClassificationPipeline } from "@huggingface/transformers";

export interface PiiFinding {
  entityGroup: string;
  score: number;
  word: string;
  line: number;
  column: number;
}

let classifier: TokenClassificationPipeline | null = null;

async function getClassifier(): Promise<TokenClassificationPipeline> {
  if (!classifier) {
    classifier = (await pipeline(
      "token-classification",
      "openai/privacy-filter",
      { dtype: "q4" as never },
    )) as TokenClassificationPipeline;
  }
  return classifier;
}

export async function scanText(text: string): Promise<PiiFinding[]> {
  const model = await getClassifier();
  const raw = await model(text, { aggregation_strategy: "simple" });

  const results = Array.isArray(raw) ? raw : [raw];

  const findings: PiiFinding[] = [];
  let searchFrom = 0;
  for (const item of results.flat()) {
    const entity = item as { entity_group: string; score: number; word: string; start?: number; end?: number };
    const word = entity.word.trim();
    const offset = entity.start ?? text.indexOf(word, searchFrom);
    if (offset >= 0) searchFrom = offset + word.length;
    const { line, column } = offsetToLineCol(text, Math.max(0, offset));
    findings.push({
      entityGroup: entity.entity_group,
      score: entity.score,
      word,
      line,
      column,
    });
  }

  return findings;
}

function offsetToLineCol(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      lastNewline = i;
    }
  }
  return { line, column: offset - lastNewline };
}
