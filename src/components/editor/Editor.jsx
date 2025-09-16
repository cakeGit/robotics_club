import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import Split from 'react-split';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { isAuthenticated, getAuthCookie } from '../../lib/auth/authService';

const Editor = () => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { path } = useParams(); // Assuming we use a route parameter to determine which file to edit
  const navigate = useNavigate();
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);
  
  // Fetch document content on component mount
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        // Format the path correctly
        const pathWithExt = path.endsWith('.md') ? path : `${path}.md`;
        const filePath = pathWithExt.startsWith('data/pages/') 
          ? pathWithExt 
          : `data/pages/${pathWithExt}`;
        
        const encodedPath = encodeURIComponent(filePath);
        
        const response = await fetch(`/api/docs/get?filePath=${encodedPath}`);
        const data = await response.json();
        
        if (data.success) {
          setContent(data.content);
          setOriginalContent(data.content);
        } else {
          // If the file doesn't exist but it's a valid path, create an empty document
          if (data.code === 'NOT_FOUND') {
            setContent('# New Document\n\nStart editing here...');
            setOriginalContent('# New Document\n\nStart editing here...');
            setSuccess('Created a new document. Save to persist changes.');
          } else {
            setError('Failed to load document: ' + data.message);
          }
        }
      } catch (error) {
        setError('Error loading document: ' + error.message);
      }
    };
    
    if (path) {
      fetchDocument();
    }
  }, [path]);
  
  // Check for unsaved changes
  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);
  
  // Handle content changes
  const handleEditorChange = (value) => {
    setContent(value);
  };
  
  // Handle save button click
  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/docs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: `data/pages/${path}.md`,
          content,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Document saved successfully!');
        setOriginalContent(content);
      } else {
        setError('Failed to save document: ' + data.message);
      }
    } catch (error) {
      setError('Error saving document: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        navigate(`/${path.replace(/\\/g, '/')}`);
      }
    } else {
      navigate(`/${path.replace(/\\/g, '/')}`);
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={handleBack} 
            className="mr-4 p-2 rounded hover:bg-gray-700 flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-xl font-bold">Editing: {path}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={`p-2 rounded flex items-center ${hasChanges ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}
        >
          <FaSave className="mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </header>
      
      {/* Notification area */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {success}
        </div>
      )}
      
      {/* Editor area */}
      <div className="flex-grow overflow-hidden">
        <Split
          className="split h-full"
          direction="horizontal"
          sizes={[50, 50]}
          minSize={100}
          gutterSize={10}
          gutterAlign="center"
          snapOffset={30}
        >
          <div className="h-full overflow-auto">
            <MonacoEditor
              height="100%"
              language="markdown"
              value={content}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                wordWrap: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
              }}
            />
          </div>
          <div className="h-full overflow-auto bg-white p-4">
            <div className="prose max-w-none dark:prose-invert">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </Split>
      </div>
    </div>
  );
};

export default Editor;