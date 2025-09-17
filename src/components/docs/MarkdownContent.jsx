import React, { useState, useEffect, useCallback, useRef } from 'react';
import { renderMarkdown } from '../../lib/MarkdownBuilder';

const MarkdownContent = ({ path }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guard against concurrent fetches and keep a single retry timer
  const inFlightRef = useRef(false);
  const retryTimerRef = useRef(null);

  const fetchContent = useCallback(async (attempt = 1, isRetry = false) => {
    if (inFlightRef.current) {
      console.log('Fetch already in progress; skipping duplicate call');
      return;
    }

    inFlightRef.current = true;
    try {
      if (!isRetry) setLoading(true);
      setError(null);

      const formattedPath = path.startsWith('/') ? path.substring(1) : path;
      console.log(`Fetching page content for: ${formattedPath} (attempt ${attempt})`);

      const response = await fetch(`/api/page/${formattedPath}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setContent('# Not Found\n\nThe requested documentation page could not be found.');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Unexpected content type:', contentType);
        if (attempt < 3) {
          console.log(`Retrying content fetch... (${attempt}/3)`);
          setLoading(false);
          setError('Failed to load page content. Retrying...');
          retryTimerRef.current = setTimeout(() => {
            fetchContent(attempt + 1, true);
          }, attempt * 1000);
          return;
        }
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        console.log('Received page content with length:', data.content?.length || 0);
        setContent(data.content || '');
        setLoading(false);
        setError(null);
      } catch (jsonError) {
        console.error('Invalid JSON response:', text.substring(0, 100) + '...', jsonError);
        if (attempt < 3) {
          console.log(`Retrying after JSON parse error... (${attempt}/3)`);
          setLoading(false);
          setError('Failed to load page content. Retrying...');
          retryTimerRef.current = setTimeout(() => {
            fetchContent(attempt + 1, true);
          }, attempt * 1000);
          return;
        }
        throw new Error('Invalid JSON in server response');
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      if (attempt >= 3) {
        console.log('Giving up after retries; showing not-found message');
        setContent('# Not Found\n\nThe requested documentation page could not be loaded from the server.');
        setLoading(false);
        setError(null);
      } else {
        setLoading(false);
        setError('Failed to load page content. Retrying...');
        retryTimerRef.current = setTimeout(() => {
          fetchContent(attempt + 1, true);
        }, attempt * 1000);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [path]);

  useEffect(() => {
    // Clear any pending retry timers when path changes and start a fresh fetch
    clearTimeout(retryTimerRef.current);
    fetchContent(1, false);

    return () => {
      // Cleanup on unmount or path change
      clearTimeout(retryTimerRef.current);
      inFlightRef.current = false;
    };
  }, [path, fetchContent]);

  if (loading) {
    return <div className="flex justify-center items-center p-8 text-lg bg-background text-foreground">Loading content...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center p-8 text-lg text-destructive bg-background">{error}</div>;
  }

  const jsxContent = renderMarkdown(content);

  return (
    <div className="md-root prose prose-invert max-w-3xl mx-auto">
      {jsxContent}
    </div>
  );
};

export default MarkdownContent;