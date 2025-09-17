import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor as MonacoEditor } from '@monaco-editor/react';
// Using CSS grid instead of Split for stable layout
import { FaSave, FaArrowLeft, FaImages } from 'react-icons/fa';
import { isAuthenticated, getAuthCookie } from '../../lib/auth/authService';
import { checkAuth } from '../../lib/auth/authService';
import Sidebar from '../docs/Sidebar';
import ImageGallery from './ImageGallery';
import { renderMarkdown } from '../../lib/MarkdownBuilder';

const Editor = () => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { '*': path } = useParams(); // use splat param to support nested paths like resources/mindstorms_brick
  const navigate = useNavigate();
  const [sidebarItems, setSidebarItems] = useState([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const editorRef = useRef(null);
  
  // Fetch document content on component mount
  useEffect(() => {
    // Fetch sidebar items for the editor view
    const fetchSidebar = async () => {
      try {
        setLoadingSidebar(true);
        const resp = await fetch('/api/page_index', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Failed to fetch sidebar');
        const data = await resp.json();
        setSidebarItems(data);
      } catch (e) {
        console.error('Error fetching sidebar for editor:', e);
        setSidebarItems([]);
      } finally {
        setLoadingSidebar(false);
      }
    };
    fetchSidebar();

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
        console.log('Editor fetched document:', { filePath, success: data?.success, length: data?.content?.length });
        
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
  
  // Validate authentication status
  useEffect(() => {
    const validateAuth = async () => {
      const authenticated = await checkAuth();
      setIsUserAuthenticated(authenticated);
    };

    validateAuth();
  }, []);
  
  // Handle content changes
  const handleEditorChange = (value) => {
    setContent(value);
  };
  
  // Handle editor mounting
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };
  
  // Handle image selection from gallery
  const handleImageSelection = (markdownText) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const id = { major: 1, minor: 1 };
      const op = {
        range: selection,
        text: markdownText,
        forceMoveMarkers: true
      };
      editorRef.current.executeEdits("image-insertion", [op]);
      editorRef.current.focus();
    }
    setShowImageGallery(false);
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
        credentials: 'include',
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
        navigate(`/docs/${path.replace(/\\/g, '/')}.md`);
      }
    } else {
      navigate(`/docs/${path.replace(/\\/g, '/')}.md`);
    }
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar items={sidebarItems} currentPath={`${path || 'index'}.md`} onNavigate={(p) => navigate(`/editor/${p.replace('.md','')}`)} />
      <div className="flex-1 flex flex-col lg:ml-0">
      {/* Header */}
      <header className="bg-card text-foreground p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={handleBack} 
            className="mr-4 p-2 rounded hover:bg-muted flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <h4 className="text-lg font-semibold">Editing: {path}</h4>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImageGallery(true)}
            className="p-2 rounded bg-accent hover:bg-accent/80 text-accent-foreground flex items-center"
            title="Image Gallery"
          >
            <FaImages className="mr-2" /> Images
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`p-2 rounded flex items-center ${hasChanges ? 'bg-primary hover:bg-primary/80 text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            <FaSave className="mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>
      
      {/* Notification area */}
      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-primary/10 border-l-4 border-primary text-primary-foreground p-4">
          {success}
        </div>
      )}
      
      {/* Image Gallery Modal with translucency */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-card/90 rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden border border-border">
            <ImageGallery 
              onSelectImage={handleImageSelection} 
              onClose={() => setShowImageGallery(false)}
              isAuthenticated={isUserAuthenticated} 
            />
          </div>
        </div>
      )}
      
      {/* Editor & Preview area (grid) */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          <div className="h-full overflow-auto border-r border-border">
            <MonacoEditor
              height="100%"
              language="markdown"
              value={content}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                wordWrap: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
              }}
            />
          </div>
          <div className="h-full overflow-auto bg-background p-4">
            <div className="prose max-w-none dark:prose-invert text-foreground h-full">
              <div className="h-full overflow-auto md-root">
                {renderMarkdown(content)}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Editor;