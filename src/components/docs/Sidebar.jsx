import React, { useState } from 'react';
import { RiAddLine, RiBookFill, RiBookLine, RiDeleteBinLine, RiFilePaperLine, RiFolderDownloadLine, RiFolderLine, RiMenuLine, RiCloseLine } from 'react-icons/ri';
import PopupWrapper from '../common/PopupWrapper';

const SidebarItem = ({ item, currentPath, depth = 0, onNavigate, userAuthenticated, onSignOut }) => {
  const isActive = item.type === 'file' && 
    (currentPath === item.path.substring(1) || // Remove leading slash
     currentPath === item.name);
  
  const handleClick = () => {
    if (item.type === 'file') {
      // Remove leading slash if present
      const path = item.path.startsWith('/') ? item.path.substring(1) : item.path;
      onNavigate(path);
    }
  };

  return (
    <li className="m-0 p-0">
      {item.type === 'file' ? (
        <div 
          className={`flex items-center justify-between py-2 px-4 text-sidebar-foreground cursor-pointer transition-colors text-sm
                    hover:bg-primary hover:text-sidebar-accent-foreground
                    ${isActive ? 'bg-secondary font-medium' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <div className="flex items-center w-full" onClick={handleClick}>
            <span className="mr-2 text-sm">
              {isActive ? <RiBookFill /> : <RiBookLine />}
            </span>
            <span>{item.name.replace('.md', '')}</span>
          </div>
          {userAuthenticated && (
            <div className="flex-shrink-0 ml-2">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm('Delete this page?')) return;
                  const filePath = item.path.startsWith('/') ? item.path.substring(1) : item.path;
                  await fetch('/api/docs/delete', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath }) });
                  window.location.reload();
                }}
                className="text-xs text-destructive hover:underline text-red-500 cursor-pointer"
              >
                <RiDeleteBinLine />
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div 
            className="flex items-center py-2 px-4 text-sidebar-foreground cursor-pointer transition-colors text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            <span className="mr-2 text-sm">
              <RiFolderLine />
              </span>
            {item.name}
          </div>
          {item.children && item.children.length > 0 && (
            <ul className="list-none p-0 m-0">
              {item.children.map((child, index) => (
                <SidebarItem 
                  key={index}
                  item={child}
                  currentPath={currentPath}
                  depth={depth + 1}
                  onNavigate={onNavigate}
                  userAuthenticated={userAuthenticated}
                  onSignOut={onSignOut}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
};

const Sidebar = ({ items, currentPath, onNavigate, userAuthenticated, onSignOut }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAddPage = async () => {
    if (!newPageName) return;
    const filePath = `data/pages/${newPageName}.md`;
    await fetch('/api/docs/save', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, content: '# New Page\n\nStart here' }),
    });
    setIsPopupOpen(false);
    setNewPageName('');
    window.location.reload();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (path) => {
    onNavigate(path);
    closeMobileMenu(); // Close mobile menu when navigating
  };

  return (
    <>
      {/* Mobile Menu Button - Only show when menu is closed */}
      {!isMobileMenuOpen && (
        <button
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar text-sidebar-foreground rounded-md border border-sidebar-border hover:bg-sidebar-accent"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <RiMenuLine size={20} />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        docs-sidebar bg-sidebar border-r border-sidebar-border h-full flex flex-col
        fixed lg:static top-0 left-0 z-40 transition-transform duration-300 ease-in-out
        w-[280px] lg:w-[300px]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="sidebar-header p-4 border-b border-sidebar-border flex flex-col items-start">
          {/* Mobile Close Button - Inside sidebar header */}
          <div className="lg:hidden w-full flex justify-between items-center mb-3">
            <h2 className="m-0 text-xl font-semibold text-sidebar-foreground">
              <span className="text-primary">robotics</span>
              <span className="text-muted-foreground">_</span>
              <span className="text-secondary">club</span>
            </h2>
            <button
              onClick={closeMobileMenu}
              className="p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md"
              aria-label="Close navigation menu"
            >
              <RiCloseLine size={20} />
            </button>
          </div>
          
          {/* Desktop Title */}
          <h2 className="hidden lg:block m-0 text-xl font-semibold text-sidebar-foreground">
            <span className="text-primary">robotics</span>
            <span className="text-muted-foreground">_</span>
            <span className="text-secondary">club</span>
          </h2>
          {userAuthenticated && (
            <div className="mt-2 text-sm text-sidebar-foreground leading-tight flex items-center gap-2">
              <span>You are authorized to edit documents.</span>
              <button
                onClick={onSignOut}
                className="ml-2 underline text-sm text-muted-foreground hover:text-sidebar-foreground"
              >
                Sign out
              </button>
            </div>
          )}
          {userAuthenticated && (
            <div className="mt-3 flex gap-2">
              <button
                className="text-sm px-2 py-1 bg-primary text-primary-foreground rounded cursor-pointer hover:bg-secondary text-white flex items-center gap-1"
                onClick={() => setIsPopupOpen(true)}
              >
                <RiFilePaperLine className='inline-block' /> <RiAddLine className='inline-block' />
              </button>
            </div>
          )}
        </div>
        <nav className="sidebar-nav py-4 flex-1 overflow-y-auto">
          <ul className="list-none p-0 m-0">
            {items.map((item, index) => (
              <SidebarItem 
                key={index}
                item={item}
                currentPath={currentPath}
                onNavigate={handleNavigate}
                userAuthenticated={userAuthenticated}
                onSignOut={onSignOut}
              />
            ))}
          </ul>
        </nav>
        {/* Floating download button at bottom */}
        <div>
          <button
            onClick={async () => {
              try {
                const resp = await fetch('/api/docs/download');
                if (!resp.ok) throw new Error('Failed to download');
                const blob = await resp.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'robotics_club_content.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (e) {
                alert('Failed to download content: ' + e.message);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 cursor-pointer bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent text-sm"
          >
            <RiFolderDownloadLine />
          </button>
        </div>
        <PopupWrapper
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          title="Add New Page"
        >
          <div className="mb-4">
            <label htmlFor="newPageName" className="block text-foreground mb-2">
              Enter new page name:
            </label>
            <input
              type="text"
              id="newPageName"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="new-page"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsPopupOpen(false)}
              className="px-4 py-2 text-foreground border border-border rounded-md mr-2 hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddPage}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Add Page
            </button>
          </div>
        </PopupWrapper>
      </div>
    </>
  );
};

export default Sidebar;