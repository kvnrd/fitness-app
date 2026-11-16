/**
 * Tiny markdown parser for the bundled policies (pure, no react-native). Supports: headings, paragraphs,
 * **bold**, *italic*, `code`, [links](url) and bare https URLs, bullet / numbered lists (one nesting level
 * by indent), tables, horizontal rules, blockquotes. Anything else is plain text.
 */
export type Inline =
  | { t: 'text'; s: string }
  | { t: 'bold'; c: Inline[] }
  | { t: 'italic'; c: Inline[] }
  | { t: 'code'; s: string }
  | { t: 'link'; href: string; c: Inline[] };

export type Block =
  | { t: 'heading'; level: number; c: Inline[] }
  | { t: 'p'; c: Inline[] }
  | { t: 'hr' }
  | { t: 'quote'; c: Block[] }
  | { t: 'list'; ordered: boolean; items: { c: Inline[]; depth: number; n: number }[] }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] };

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  let buf = '';
  const flush = () => {
    if (buf) out.push({ t: 'text', s: buf });
    buf = '';
  };
  while (i < src.length) {
    const rest = src.slice(i);
    let m: RegExpExecArray | null;
    if ((m = /^\*\*(.+?)\*\*/.exec(rest))) {
      flush();
      out.push({ t: 'bold', c: parseInline(m[1]) });
      i += m[0].length;
    } else if ((m = /^`([^`]+)`/.exec(rest))) {
      flush();
      out.push({ t: 'code', s: m[1] });
      i += m[0].length;
    } else if ((m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest))) {
      flush();
      out.push({ t: 'link', href: m[2], c: parseInline(m[1]) });
      i += m[0].length;
    } else if ((m = /^https?:\/\/[^\s)<>]+/.exec(rest))) {
      flush();
      const url = m[0].replace(/[.,;:]+$/, '');
      out.push({ t: 'link', href: url, c: [{ t: 'text', s: url }] });
      i += url.length;
    } else if ((m = /^(\*|_)(?=\S)(.+?)(?<=\S)\1(?!\w)/.exec(rest)) && (i === 0 || !/\w/.test(src[i - 1]))) {
      flush();
      out.push({ t: 'italic', c: parseInline(m[2]) });
      i += m[0].length;
    } else {
      buf += src[i];
      i += 1;
    }
  }
  flush();
  return out;
}

const splitRow = (l: string): string[] => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);

export function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }

    let m: RegExpExecArray | null;
    if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
      blocks.push({ t: 'heading', level: m[1].length, c: parseInline(m[2].trim()) });
      i++;
    } else if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ t: 'hr' });
      i++;
    } else if (line.startsWith('>')) {
      const inner: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) inner.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push({ t: 'quote', c: parseBlocks(inner.join('\n')) });
    } else if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(line).map(parseInline);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]).map(parseInline));
      blocks.push({ t: 'table', head, rows });
    } else if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: { c: Inline[]; depth: number; n: number }[] = [];
      let n = 0;
      while (i < lines.length) {
        const lm = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (lm) {
          const depth = Math.min(2, Math.floor(lm[1].length / 2));
          n = depth === 0 ? n + 1 : n;
          items.push({ c: parseInline(lm[3]), depth, n });
          i++;
        } else if (lines[i].trim() !== '' && /^\s{2,}\S/.test(lines[i]) && items.length) {
          // lazy continuation line of the previous item
          items[items.length - 1].c.push({ t: 'text', s: ' ' + lines[i].trim() });
          i++;
        } else break;
      }
      blocks.push({ t: 'list', ordered, items });
    } else {
      const para: string[] = [];
      while (
        i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|>|\s*([-*+]|\d+\.)\s)/.test(lines[i]) &&
        !/^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i]) && !lines[i].trim().startsWith('|')
      ) para.push(lines[i++].trim());
      if (!para.length) { para.push(lines[i++]); }
      blocks.push({ t: 'p', c: parseInline(para.join(' ')) });
    }
  }
  return blocks;
}
