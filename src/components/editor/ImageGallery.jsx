import React, { useState, useEffect, useRef } from 'react';
import { FaTrash, FaPen, FaUpload, FaTimes, FaCheck, FaCopy } from 'react-icons/fa';

const ImageGallery = ({ onSelectImage, onClose, isAuthenticated }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [newImageName, setNewImageName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);
  
  // Fetch all images
  const fetchImages = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/images/list');
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images);
      } else {
        setError('Failed to load images: ' + data.message);
      }
    } catch (error) {
      setError('Error loading images: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchImages();
  }, []);
  
  // Handle file upload
  const handleFileChange = async (e) => {
    if (!isAuthenticated) {
      setError('You need to be authenticated to upload images.');
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only image files are allowed (JPEG, PNG, GIF, SVG, WEBP).');
      return;
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploading(true);
      setError('');
      
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Image uploaded successfully!');
        setImages([...images, data.image]);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError('Failed to upload image: ' + data.message);
      }
    } catch (error) {
      setError('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Delete an image
  const handleDelete = async (imageName) => {
    if (!isAuthenticated) {
      setError('You need to be authenticated to delete images.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${imageName}?`)) {
      return;
    }
    
    try {
      setError('');
      
      const response = await fetch(`/api/images/delete?imageName=${encodeURIComponent(imageName)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Image deleted successfully!');
        setImages(images.filter(img => img.name !== imageName));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError('Failed to delete image: ' + data.message);
      }
    } catch (error) {
      setError('Error deleting image: ' + error.message);
    }
  };
  
  // Start editing image name
  const startEditing = (image) => {
    setEditingImage(image);
    setNewImageName(image.name);
    setError('');
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingImage(null);
    setNewImageName('');
  };
  
  // Save new image name
  const saveNewName = async () => {
    if (!editingImage || !newImageName) {
      return;
    }
    
    if (newImageName === editingImage.name) {
      cancelEditing();
      return;
    }
    
    try {
      setError('');
      
      const response = await fetch('/api/images/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldName: editingImage.name,
          newName: newImageName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Image renamed successfully!');
        
        // Update the images list
        setImages(images.map(img => {
          if (img.name === editingImage.name) {
            return { 
              ...img, 
              name: newImageName,
              path: data.newPath
            };
          }
          return img;
        }));
        
        // Clear editing state
        setEditingImage(null);
        setNewImageName('');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError('Failed to rename image: ' + data.message);
      }
    } catch (error) {
      setError('Error renaming image: ' + error.message);
    }
  };
  
  // Copy markdown image code to clipboard
  const copyImageMarkdown = (image) => {
    const markdownText = `![${image.name}](${image.path})`;
    if (onSelectImage) {
      onSelectImage(markdownText);
    } else {
      navigator.clipboard.writeText(markdownText);
      setSuccessMessage('Markdown code copied to clipboard!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };
  
  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className="bg-card rounded w-full max-w-3xl mx-auto p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">Image Gallery</h2>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-accent text-foreground"
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>
      
      {/* Notification area */}
      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-900/20 border-l-4 border-primary text-foreground p-4 mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Upload area - always visible regardless of authentication */}
      <div className="mb-4 p-4 border-2 border-dashed border-primary rounded text-center">
        <input 
          type="file" 
          id="image-upload" 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
          disabled={uploading}
          ref={fileInputRef}
        />
        <label 
          htmlFor="image-upload"
          className="cursor-pointer bg-primary hover:bg-primary/80 text-primary-foreground py-2 px-4 rounded flex items-center justify-center max-w-xs mx-auto"
        >
          <FaUpload className="mr-2" /> 
          {uploading ? 'Uploading...' : 'Upload New Image'}
        </label>
        <p className="text-sm text-muted-foreground mt-2">
          Supported formats: JPEG, PNG, GIF, SVG, WEBP
          {!isAuthenticated && <span className="block mt-1 text-primary">(Sign in to enable uploads)</span>}
        </p>
      </div>
      
      {/* Images grid */}
      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="text-center p-4 text-foreground">Loading images...</div>
        ) : images.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No images found. Upload some images to get started.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div 
                key={image.path} 
                className="relative border border-border rounded overflow-hidden group"
              >
                {/* Image preview */}
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  <img 
                    src={image.path} 
                    alt={image.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
                
                {/* Image info */}
                <div className="p-2 bg-card">
                  {editingImage && editingImage.name === image.name ? (
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newImageName}
                        onChange={(e) => setNewImageName(e.target.value)}
                        className="flex-grow p-1 border rounded mr-1 text-sm"
                        autoFocus
                      />
                      <button 
                        onClick={saveNewName}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <FaCheck />
                      </button>
                      <button 
                        onClick={cancelEditing}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Cancel"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium mb-1 truncate text-foreground" title={image.name}>
                        {image.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatSize(image.size)}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex justify-between mt-2">
                        <button 
                          onClick={() => copyImageMarkdown(image)} 
                          className="p-1 text-chart-2 hover:text-chart-2/80"
                          title="Copy Markdown or Insert"
                        >
                          <FaCopy />
                        </button>
                        
                        {isAuthenticated && (
                          <>
                            <button 
                              onClick={() => startEditing(image)} 
                              className="p-1 text-primary hover:text-primary/80"
                              title="Rename"
                            >
                              <FaPen />
                            </button>
                            <button 
                              onClick={() => handleDelete(image.name)} 
                              className="p-1 text-destructive hover:text-destructive/80"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;