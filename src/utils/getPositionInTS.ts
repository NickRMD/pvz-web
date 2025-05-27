import { SourceMapConsumer } from "source-map-js";

export default async function get_position_in_ts(line: number, column: number, sourceMapUrl: string) {
  const response = await fetch(sourceMapUrl);
  const js_text = await response.text();
  const rawSourceMap = extract_inline_source_map(js_text);

  const consumer = new SourceMapConsumer(rawSourceMap);

  const original_position = consumer.originalPositionFor({
    line,
    column
  });

  original_position.source = clean_source_path(original_position.source);

  return original_position; // { source, line, column, name }
}

function clean_source_path(source: string) {

  try {
    // Normalize path separators to '/'
    const normalized = source.replace(/\\/g, '/');
   
    // Split path into parts
    const parts = normalized.split('/');
    
    // Find 'src' folder index
    const srcIndex = parts.indexOf('src');
    
    if (srcIndex !== -1) {
      // Join and return from 'src' folder onwards
      return parts.slice(srcIndex).join('/');
    }
    
    // fallback: return original normalized path
    return normalized;
  } catch(_) {
    return source;
  }
}

function extract_inline_source_map(js_text: string) {
  const regex = /\/\/# sourceMappingURL=data:application\/json;base64,(.*)/;
  const match = js_text.match(regex);
  if (!match) throw new Error("No inlined source map found.");
  const base64 = match[1];
  const json = atob(base64);
  return JSON.parse(json);
}

export async function map_stack_trace(error: Error, sourceMapUrl: string) {
  if (!error.stack) return [];

  // Example Chrome/Firefox stack line format:
  // "    at functionName (fileURL:line:column)"
  const stackLines = error.stack.split('\n').slice(1); // skip first error message line

  const mappedFrames = [];

  for (const line of stackLines) {
    const regex = /\(?(.+):(\d+):(\d+)\)?$/;  // extract file, line, column from end
    const match = line.match(regex);
    if (!match) {
      // Could not parse line, just keep original text
      mappedFrames.push({ originalFrame: line });
      continue;
    }

    const [_, _file, lineStr, colStr] = match;
    const lineNum = Number.parseInt(lineStr, 10);
    const colNum = Number.parseInt(colStr, 10);

    try {
      const originalPos = await get_position_in_ts(lineNum, colNum, sourceMapUrl);
      mappedFrames.push({
        originalFrame: line.trim(),
        source: originalPos.source,
        line: originalPos.line,
        column: originalPos.column,
        name: originalPos.name,
      });
      // biome-ignore lint/suspicious/noExplicitAny:
    } catch (e: any) {
      // In case source map fetch or parsing fails, fallback to original frame

      mappedFrames.push({ originalFrame: line.trim(), error: e.message || e?.toString() });
    }
  }

  return mappedFrames;
}
