import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { validateEmailFormat } from '../../lib/auth/authService';
import PopupWrapper from '../common/PopupWrapper';

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
    <PopupWrapper isOpen={isOpen} onClose={onClose} title="Sign In to Edit">
      {success ? (
        <div className="bg-primary/10 border-l-4 border-primary text-foreground p-4 mb-4">
          {success}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-foreground mb-2">
              Enter your email address:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="your-email@example.com"
              required
            />
            <p className="text-sm text-muted-foreground mt-2">
              Please enter your authorized email address to receive a sign-in link.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground border border-border rounded-md mr-2 hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Verification Email'}
            </button>
          </div>
        </form>
      )}
    </PopupWrapper>
  );
};

export default EmailModal;