import React from "react";
import { tokenizeInline } from "./MarkdownTokenize";
import ScratchBlock from "../../components/ScratchBlock";
import { FaRegEyeSlash } from 'react-icons/fa';

function renderInlineTextTokens(tokens) {
    const element = <>
        {tokens.map((token, index) => {
            if (token.type === 'text') {
                return token.text;
            } else if (token.type === 'bold') {
                return <strong key={index}>{renderInlineTextTokens(token.children)}</strong>;
            } else if (token.type === 'italic') {
                return <em key={index}>{renderInlineTextTokens(token.children)}</em>;
            } else if (token.type === 'code') {
                return <code key={index} style={{ background: '#f3f3f3', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{renderInlineTextTokens(token.children)}</code>;
            } else if (token.type === 'link') {
                return <a key={index} href={token.href} style={{ color: '#007bff', textDecoration: 'none' }}>{renderInlineTextTokens(token.children)}</a>;
            }
            return null;
        })}
    </>;
    return element;
}

function renderInlineText(text) {
    let inlineTokens = tokenizeInline(text);
    return renderInlineTextTokens(inlineTokens);
}

export function renderTokens(tokens) {
    const elements = <>
        {
            tokens.map((t, idx) => {
                if (t.type === 'heading') {
                    const Tag = `h${Math.min(Math.max(t.level, 1), 5)}`;
                    return (React.createElement(Tag, { key: `h-${idx}` }, renderInlineText(t.text)));
                } else if (t.type === 'paragraph') {
                    return <p>{renderInlineText(t.text)}</p>;
                } else if (t.type === 'ul') {
                    const items = t.items.map((it, i) => <li key={`li-${idx}-${i}`}>{renderInlineText(it)}</li>);
                    return <ul>{items}</ul>;
                } else if (t.type === 'code') {
                    if (t.lang === 'scratch') {
                        return <ScratchBlock code={t.code} />;
                    } else {
                        return <pre style={{ background: '#f3f3f3', padding: '0.5rem' }}>{t.code}</pre>;
                    }
                } else if (t.type === "meta-page-hidden-note") {
                    return <div key={`meta-${idx}`} className="bg-accent mb-5 rounded-lg block max-w-max border-accent-foreground p-3">Hidden Page <FaRegEyeSlash className="inline" /></div>;
                } else if (t.type === 'image') {
                    return (
                        <div
                            key={`img-${idx}`}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                position: 'relative',
                            }}
                        >
                            <img
                                src={t.src}
                                alt={t.alt}
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    margin: '0 auto',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    color: '#fff',
                                    padding: '0.5rem',
                                    textAlign: 'center',
                                    transition: 'opacity 0.3s',
                                    pointerEvents: 'none',
                                }}
                                className='image-caption'
                            >
                                {t.alt}
                            </div>
                        </div>
                    );
                }
                return null;
            })
        }
    </>;
    return elements;
}