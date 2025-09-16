import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MarkdownContent from './MarkdownContent';
import { isAuthenticated } from '../../lib/auth/authService';
import { FaPencilAlt } from 'react-icons/fa';
import EmailModal from '../auth/EmailModal';
// Removed bundled fallback data. If the API is unavailable we'll show an empty sidebar.

const DocLayout = () => {
  const [sidebarItems, setSidebarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useServerData, setUseServerData] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const { '*': pathParam } = useParams();
  const navigate = useNavigate();

  // Fetch sidebar items from API
  useEffect(() => {
    // Add a small delay before fetching to ensure server middleware is ready
    const timer = setTimeout(() => {
      fetchSidebarItems();
    }, retryCount * 1000); // Increase delay with each retry
    
    return () => clearTimeout(timer);
  }, [retryCount]);
  
  // Check authentication status on component mount
  useEffect(() => {
    setUserAuthenticated(isAuthenticated());
  }, []);

  const fetchSidebarItems = async () => {
    try {
      if (!useServerData) {
        // Use an empty sidebar when server data is disabled
        console.log('Using empty sidebar (server data disabled)');
        setSidebarItems([]);
        setLoading(false);
        setError("Failed to fetch documentation structure from server! Refresh the page to retry.");
        return;
      }
      
      setLoading(true);
      console.log(`Fetching page index... (attempt ${retryCount + 1})`);
      
      const response = await fetch('/api/page_index', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page index: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Unexpected content type:', contentType);
        
        // If we haven't retried too many times, try again
        if (retryCount < 3) {
          console.log(`Retrying fetch... (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
          return;
        }
        
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      // Read response as text first for better error handling
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        console.log('Received sidebar items:', data);
        setSidebarItems(data);
        setLoading(false);
        setError(null);
      } catch (jsonError) {
        console.error('Invalid JSON response:', text.substring(0, 100) + '...');
        
        // If we haven't retried too many times, try again
        if (retryCount < 3) {
          console.log(`Retrying after JSON parse error... (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
          return;
        }
        
        throw new Error('Invalid JSON in server response');
      }
    } catch (err) {
      console.error('Error fetching sidebar items:', err);
      
      // If we've tried 3 times, stop retrying and show empty sidebar
      if (retryCount >= 3) {
        console.log('Disabling server data after failed retries');
        setUseServerData(false);
        setSidebarItems([]);
        setLoading(false);
        setError(null);
      } else {
        setError('Failed to load documentation structure. Retrying...');
        console.log(`Will retry in ${retryCount + 1} seconds... (${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen w-full text-lg bg-white dark:bg-gray-900">Loading documentation...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen w-full text-lg text-red-600 bg-white dark:bg-gray-900">{error}</div>;
  }

  // If no path is specified, default to index
  const currentPath = pathParam || 'index.md';

  // Handle edit button click
  const handleEditClick = () => {
    if (userAuthenticated) {
      // Navigate to editor page with the current path
      navigate(`/editor/${currentPath.replace('.md', '')}`);
    } else {
      // Show email modal
      setIsEmailModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        items={sidebarItems} 
        currentPath={currentPath}
        onNavigate={(path) => navigate(`/docs/${path}`)}
      />
      <main className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-900 relative">
        <MarkdownContent path={currentPath} />
        
        {/* Edit button */}
        <div className="absolute bottom-8 right-8">
          <button
            onClick={handleEditClick}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-3 flex items-center justify-center fill-gray-700 dark:bg-gray-800 dark:hover:bg-white-200"
            aria-label="Edit page"
            title="Edit page"
          >
            <FaPencilAlt className="fill-gray-700 dark:fill-gray-200" />
          </button>
        </div>
        
        {/* Email modal */}
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          onSubmit={() => {
            setIsEmailModalOpen(false);
            // We don't need to do anything here as the EmailModal handles the API call
          }}
        />
      </main>
    </div>
  );
};

export default DocLayout;