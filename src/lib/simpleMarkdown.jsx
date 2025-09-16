import React from 'react';
import ScratchBlock from '../components/ScratchBlock.jsx';

// Token types: heading, paragraph, ul, code
// heading: { type: 'heading', level: 1..5, text }
// paragraph: { type: 'paragraph', text }
// ul: { type: 'ul', items: [string] }
// code: { type: 'code', lang: string|null, code: string }

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


export function renderTokens(tokens) {
  const elements = [];
  tokens.forEach((t, idx) => {
    if (t.type === 'heading') {
      const Tag = `h${Math.min(Math.max(t.level, 1), 5)}`;
      elements.push(React.createElement(Tag, { key: `h-${idx}` }, t.text));
    } else if (t.type === 'paragraph') {
      elements.push(React.createElement('p', { key: `p-${idx}` }, t.text));
    } else if (t.type === 'ul') {
      const items = t.items.map((it, i) => React.createElement('li', { key: `li-${idx}-${i}` }, it));
      elements.push(React.createElement('ul', { key: `ul-${idx}` }, items));
    } else if (t.type === 'code') {
      if (t.lang === 'scratch') {
        elements.push(React.createElement(ScratchBlock, { key: `code-${idx}`, code: t.code }));
      } else {
        elements.push(React.createElement('pre', { key: `code-${idx}`, style: { background: '#f3f3f3', padding: '0.5rem' } }, t.code));
      }
    }
  });
  return elements;
}

export function renderMarkdown(md) {
  const tokens = tokenize(md || '');
  return renderTokens(tokens);
}

export default { tokenize, renderTokens, renderMarkdown };
