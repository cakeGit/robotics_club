import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { validateEmailFormat } from '../../lib/auth/authService';

const EmailModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Client-side validation
    if (!validateEmailFormat(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Verification email sent successfully!');
        setEmail('');
        setTimeout(() => {
          onClose();
        }, 3000); // Close after 3 seconds
      } else {
        setError(data.message || 'Failed to send verification email');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sign In to Edit</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {success ? (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Enter your email address:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-email@example.com"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Please enter your authorized email address to receive a sign-in link.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md mr-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Verification Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailModal;