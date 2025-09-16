import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DocLayout from './components/docs/DocLayout'
import Editor from './components/editor/Editor'
import EmailVerification from './components/auth/EmailVerification'
import { isAuthenticated, checkAuth } from './lib/auth/authService'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="max-w-7xl mx-auto p-8 text-center text-foreground">
        <div className="flex justify-center gap-8">
          <a href="https://vite.dev" target="_blank" rel="noreferrer" className="transition-transform hover:scale-105">
            <img src={viteLogo} className="h-24 p-6 transition-all" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer" className="transition-transform hover:scale-105">
            <img src={reactLogo} className="h-24 p-6 transition-all animate-[spin_20s_linear_infinite]" alt="React logo" />
          </a>
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-4">Robotics Club</h1>
        <div className="py-8">
          <button onClick={() => setCount((count) => count + 1)} className="bg-primary hover:bg-primary/80 text-primary-foreground py-2 px-4 rounded transition-colors">
            count is {count}
          </button>
        </div>
        <p className="mt-8">
          <a href="/docs" className="text-primary font-medium no-underline transition-colors border border-primary rounded px-4 py-2 hover:bg-primary hover:text-primary-foreground">View Documentation</a>
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
        <Route path="/editor" element={<Navigate to="/editor/index" replace />} />
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
