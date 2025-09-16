import React, { useEffect, useRef, useState } from 'react';

export default function ScratchBlock({ code }) {
  const [open, setOpen] = useState(false);

  const svgRef = useRef(null);
  const stylesAppendedRef = useRef(false);

  useEffect(() => {
    if (!svgRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const mod = await import('scratchblocks');
        const scratchblocks = mod.default || mod;

        // append CSS once
        if (!stylesAppendedRef.current && typeof scratchblocks.appendStyles === 'function') {
          try { scratchblocks.appendStyles(); } catch { /* ignore */ }
          stylesAppendedRef.current = true;
        }

        // The library expects a parsed document; use parse() then render()
        const doc = scratchblocks.parse(code, { style: 'scratch3' });
        const svgNode = scratchblocks.render(doc, { style: 'scratch3' });

        if (cancelled) return;

        // replace the svgRef content with the actual node
        svgRef.current.innerHTML = '';
        if (svgNode && svgNode.nodeType === 1) {
          svgRef.current.appendChild(svgNode);
        } else if (typeof svgNode === 'string') {
          svgRef.current.innerHTML = svgNode;
        } else {
          svgRef.current.innerText = 'Error rendering scratchblocks (unexpected render result)';
          // eslint-disable-next-line no-console
          console.error('Unexpected scratchblocks.render result for code:', code, svgNode);
        }
      } catch (err) {
        if (svgRef.current) svgRef.current.innerText = 'Error rendering scratchblocks';
        // add more context to the console for debugging
        // eslint-disable-next-line no-console
        console.error('Error rendering scratchblocks for code:', code, err);
      }
    })();

    return () => { cancelled = true; };
  }, [code]);

  const openSourceInNewTab = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="scratch-block-wrapper bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg p-2 bg-gray-800 m-4">
      <div className="px-4">
        <div className="header flex justify-between items-center">
            <span className="text-xs font-medium text-gray-300">Scratch code</span>
            <button onClick={() => setOpen(!open)} title="Toggle source view" aria-expanded={open} className="text-gray-400 hover:text-white text-xs">&lt;/&gt;</button>
        </div>
      </div>
      <div className="content relative overflow-hidden rounded">
        <div className="svg-container px-4 pb-4 min-h-32">
          <div ref={svgRef} className="scratch-svg border border-gray-600 rounded block p-4 flex justify-center items-center bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.1)_1px,transparent_0)] bg-[length:20px_20px]" aria-hidden={!open} />
        </div>
        <div className={`source-overlay absolute top-0 left-0 w-full h-full bg-gray-800 p-4 transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-100 h-full overflow-auto">{code}</pre>
        </div>
      </div>
    </div>
  );
}
