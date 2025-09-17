import React from 'react';
import ScratchBlock from '../components/ScratchBlock.jsx';
import { tokenize } from './markdownHandler/MarkdownTokenize.jsx';
import { renderTokens } from './markdownHandler/MarkdownRenderer.jsx';

// Token types: heading, paragraph, ul, code
// heading: { type: 'heading', level: 1..5, text }
// paragraph: { type: 'paragraph', text }
// ul: { type: 'ul', items: [string] }
// code: { type: 'code', lang: string|null, code: string }

export function renderMarkdown(md) {
  const tokens = tokenize(md || '');
  return renderTokens(tokens);
}

export default { renderMarkdown };