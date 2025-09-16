import React, { useState, useEffect, useCallback } from 'react';
import { renderMarkdown } from '../../lib/simpleMarkdown.jsx';

const MarkdownContent = ({ path }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // No local fallback data available; proceed to fetch from server
      
      // Ensure path is properly formatted for API request
      const formattedPath = path.startsWith('/') ? path.substring(1) : path;
      console.log(`Fetching page content for: ${formattedPath} (attempt ${retryCount + 1})`);
      
      const response = await fetch(`/api/page/${formattedPath}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Page not found');
        } else {
          throw new Error(`Failed to fetch page: ${response.status}`);
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Unexpected content type:', contentType);
        
        if (retryCount < 2) {
          console.log(`Retrying content fetch... (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
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
      } catch (jsonError) {
        console.error('Invalid JSON response:', text.substring(0, 100) + '...', jsonError);
        
        if (retryCount < 2) {
          console.log(`Retrying after JSON parse error... (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
          return;
        }
        
        throw new Error('Invalid JSON in server response');
      }
    } catch (err) {
      console.error('Error fetching content:', err);

      // After a couple retries show a not-found message
      if (retryCount >= 2) {
        console.log('Giving up after retries; showing not-found message');
        setContent('# Not Found\n\nThe requested documentation page could not be loaded from the server.');
        setLoading(false);
        setError(null);
      } else {
        setError(`Failed to load page content. Retrying...`);
        console.log(`Will retry content fetch in ${retryCount + 1} seconds... (${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
      }
    }
  }, [path, retryCount]);

  useEffect(() => {
    // Reset retry count when path changes
    setRetryCount(0);
    fetchContent();
  }, [path, fetchContent]);

  useEffect(() => {
    if (retryCount > 0) {
      const timer = setTimeout(() => {
        fetchContent();
      }, retryCount * 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCount, fetchContent]);



  if (loading) {
    return <div className="flex justify-center items-center p-8 text-lg bg-white dark:bg-gray-900">Loading content...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center p-8 text-lg text-red-600 bg-white dark:bg-gray-900">{error}</div>;
  }

  const jsxContent = renderMarkdown(content);

  return (
    <div className="md-root prose prose-slate dark:prose-invert max-w-3xl mx-auto">
      {jsxContent}
    </div>
  );
};

export default MarkdownContent;