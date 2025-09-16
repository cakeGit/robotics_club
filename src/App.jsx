import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DocLayout from './components/docs/DocLayout'
import Editor from './components/editor/Editor'
import EmailVerification from './components/auth/EmailVerification'
import { isAuthenticated, checkAuth } from './lib/auth/authService'

function HomePage() {
  return (
    <>
      <div className="max-w-7xl mx-auto p-8 text-center text-foreground flex flex-col items-center justify-center h-screen">
        <h1 className="text-5xl font-bold leading-tight mb-4">
          <span className="text-primary">robotics</span>
          <span className="text-muted-foreground">_</span>
          <span className="text-secondary">club</span>
        </h1>
        <p className="mt-8">
          <a
            href="/docs"
            className="text-primary font-medium border border-primary rounded px-4 py-2 hover:text-secondary-foreground hover:border-secondary"
            style={{ boxShadow: '0 0 12px var(--color-primary)' }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 0 15px var(--color-secondary)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 0 12px var(--color-primary)'}
          >Open Documentation</a>
        </p>
      </div>
    </>
  )
}

// Authentication guard component
function AuthGuard({ children }) {
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const serverOk = await checkAuth();
      if (!mounted) return;
      setOk(serverOk || isAuthenticated());
      setChecked(true);
    })();

    return () => { mounted = false };
  }, []);

  if (!checked) return <div className="flex items-center justify-center h-screen text-foreground bg-background">Checking authentication...</div>;

  return ok ? children : <Navigate to="/docs" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docs" element={<Navigate to="/docs/index.md" replace />} />
        <Route path="/docs/*" element={<DocLayout />} />
        <Route path="/editor" element={<Navigate to="/editor/index.md" replace />} />
        <Route path="/editor/*" element={
          <AuthGuard>
            <Editor />
          </AuthGuard>
        } />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
