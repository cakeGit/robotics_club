export function tokenize(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const tokens = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line === "---") {
      let hidden = false
      i += 1;
      while (i < lines.length && lines[i] !== "---") {
        if (/hidden:( )*true/.test(lines[i].trim())) {
          hidden = true;
        }
        i += 1;
      }
      if (i < lines.length && lines[i] === "---") i += 1; // skip closing ---
      if (hidden) {
        tokens.push({ type: "meta-page-hidden-note" });
      }
      continue;
    }

    const headingMatch = line.match(/^(#{1,5})\s+(.*)$/);
    if (headingMatch) {
      tokens.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i += 1;
      continue;
    }

    const ulMatch = line.match(/^\s*([-*])\s+(.*)$/);
    if (ulMatch) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([-*])\s+(.*)$/);
        if (!m) break;
        items.push(m[2]);
        i += 1;
      }
      tokens.push({ type: 'ul', items });
      continue;
    }

    const fenceMatch = line.match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || null;
      i += 1;
      const codeLines = [];
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        codeLines.push(lines[i]);
        i += 1;
      }
      // skip closing fence
      if (i < lines.length && lines[i].match(/^```\s*$/)) i += 1;
      tokens.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    const imageMatch = line.match(/^!\[(.*)\]\((.*)\)$/);
    if (imageMatch) {
      tokens.push({ type: 'image', src: imageMatch[2], alt: imageMatch[1] });
      i += 1;
      continue;
    }

    // callout: {info|warning|extension}(Callout inline text)
    const calloutMatch = line.match(/^\{(info|warning|extension)\}\((.*)\)$/);
    if (calloutMatch) {
      tokens.push({ type: 'callout', kind: calloutMatch[1], text: calloutMatch[2] });
      i += 1;
      continue;
    }

    // paragraph
    const paraLines = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^(#{1,5})\s+/) && !lines[i].match(/^\s*([-*])\s+/) && !lines[i].match(/^```/)) {
      paraLines.push(lines[i].trim());
      i += 1;
    }
    tokens.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return tokens;
}

/**
 * Tokenize inline markdown (plain text, bold, italic, code, link)
 * @param {string} text 
 */
export function tokenizeInline(text) {
    const tokens = [];
    let i = 0;
    const len = text.length;

    function flush(buf) {
        if (buf.length) {
            tokens.push({ type: 'text', text: buf.join('') });
            buf.length = 0;
        }
    }

    while (i < len) {
        const ch = text[i];

        // inline code `code`
        if (ch === '`') {
            const end = text.indexOf('`', i + 1);
            if (end === -1) {
                // no closing backtick, treat remainder as text
                tokens.push({ type: 'text', text: text.slice(i) });
                break;
            }
            tokens.push({ type: 'code', text: text.slice(i + 1, end) });
            i = end + 1;
            continue;
        }

        // link [label](href)
        if (ch === '[') {
            const closeLabel = text.indexOf(']', i + 1);
            const openParen = closeLabel !== -1 ? closeLabel + 1 : -1;
            if (closeLabel !== -1 && text[openParen] === '(') {
                const closeParen = text.indexOf(')', openParen + 1);
                if (closeParen !== -1) {
                    const label = text.slice(i + 1, closeLabel);
                    const href = text.slice(openParen + 1, closeParen);
                    // recursively tokenize label for nested formatting
                    tokens.push({ type: 'link', href, children: tokenizeInline(label) });
                    i = closeParen + 1;
                    continue;
                }
            }
            // not a valid link, fall through to treat as text
        }

        // strong **text** or __text__
        const two = text.substr(i, 2);
        if (two === '**' || two === '__') {
            const marker = two;
            const end = text.indexOf(marker, i + 2);
            if (end !== -1) {
                const inner = text.slice(i + 2, end);
                tokens.push({ type: 'strong', children: tokenizeInline(inner) });
                i = end + 2;
                continue;
            }
        }

        // emphasis *text* or _text_
        if ((ch === '*' || ch === '_') && text.substr(i, 2) !== ch + ch) {
            const end = text.indexOf(ch, i + 1);
            if (end !== -1) {
                const inner = text.slice(i + 1, end);
                tokens.push({ type: 'em', children: tokenizeInline(inner) });
                i = end + 1;
                continue;
            }
        }

        // accumulate plain text
        let buf = [];
        let first = true;
        while (i < len) {
            const nc = text[i];
            // break on any special char to re-evaluate
            if (!first && (nc === '`' || nc === '[' || nc === '*' || nc === '_' )) break;
            buf.push(nc);
            i += 1;
            first = false; //Ensure at least one char is consumed to prevent infinite loop
        }
        flush(buf);
    }

    // Return tokens; merge adjacent text tokens if any
    const merged = [];
    for (const t of tokens) {
        const last = merged[merged.length - 1];
        if (t.type === 'text' && last && last.type === 'text') {
            last.text += t.text;
        } else {
            merged.push(t);
        }
    }

    return merged;
}
