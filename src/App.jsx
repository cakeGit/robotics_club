import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DocLayout from './components/docs/DocLayout'
import Editor from './components/editor/Editor'
import EmailVerification from './components/auth/EmailVerification'
import { isAuthenticated } from './lib/auth/authService'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="max-w-7xl mx-auto p-8 text-center">
        <div className="flex justify-center gap-8">
          <a href="https://vite.dev" target="_blank" rel="noreferrer" className="transition-transform hover:scale-105">
            <img src={viteLogo} className="h-24 p-6 transition-all hover:drop-shadow-[0_0_2em_rgba(100,108,255,0.67)]" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer" className="transition-transform hover:scale-105">
            <img src={reactLogo} className="h-24 p-6 transition-all animate-[spin_20s_linear_infinite] hover:drop-shadow-[0_0_2em_rgba(97,218,251,0.67)]" alt="React logo" />
          </a>
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-4">Robotics Club</h1>
        <div className="py-8">
          <button onClick={() => setCount((count) => count + 1)} className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded transition-colors">
            count is {count}
          </button>
        </div>
        <p className="mt-8">
          <a href="/docs" className="text-blue-600 font-medium no-underline transition-colors border border-blue-600 rounded px-4 py-2 hover:bg-blue-600 hover:text-white">View Documentation</a>
        </p>
      </div>
    </>
  )
}

// Authentication guard component
function AuthGuard({ children }) {
  // Using the imported isAuthenticated function from authService
  return isAuthenticated() ? children : <Navigate to="/docs" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docs" element={<Navigate to="/docs/index.md" replace />} />
        <Route path="/docs/*" element={<DocLayout />} />
        <Route path="/editor" element={<Navigate to="/editor/index" replace />} />
        <Route path="/editor/:path" element={
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
