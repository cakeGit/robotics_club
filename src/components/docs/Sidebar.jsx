import React from 'react';

const SidebarItem = ({ item, currentPath, depth = 0, onNavigate }) => {
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
          className={`flex items-center py-2 px-4 text-gray-600 dark:text-gray-400 cursor-pointer transition-colors text-sm
                    hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100
                    ${isActive ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-medium' : ''}`}
          onClick={handleClick}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <span className="mr-2 text-sm">📄</span>
          {item.name.replace('.md', '')}
        </div>
      ) : (
        <>
          <div 
            className="flex items-center py-2 px-4 text-gray-600 dark:text-gray-400 cursor-pointer transition-colors text-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            <span className="mr-2 text-sm">📁</span>
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
                />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
};

const Sidebar = ({ items, currentPath, onNavigate }) => {
  return (
    <div className="docs-sidebar w-[300px] bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="sidebar-header p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="m-0 text-xl font-semibold text-gray-900 dark:text-gray-100">
          <span className="text-primary">robotics</span>
          <span className="text-gray-500">_</span>
          <span className="text-sky-500">club</span>
        </h2>
      </div>
      <nav className="sidebar-nav py-4 flex-1 overflow-y-auto">
        <ul className="list-none p-0 m-0">
          {items.map((item, index) => (
            <SidebarItem 
              key={index}
              item={item}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;