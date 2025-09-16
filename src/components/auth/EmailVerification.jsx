import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// This component handles the email verification process
const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Call the API to verify the token
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Ensure cookies set by the server are accepted by the browser
          credentials: 'include',
        });

        const data = await response.json();
        
        // If successful, the server will set the auth cookie
        if (response.ok && data.success) {
          // Show success message
          console.log(`Successfully verified email: ${data.email}`);
          // Redirect to the editor
          navigate('/editor');
        } else {
          console.error('Token verification failed:', data.message);
          alert(`Authentication failed: ${data.message}`);
          navigate('/docs');
        }
      } catch (error) {
        console.error('Error during token verification:', error);
        alert('An error occurred during authentication. Please try again.');
        navigate('/docs');
      }
    };

    // If there's a token in the URL, verify it
    if (token) {
      verifyToken();
    } else {
      // If there's no token, redirect to docs
      navigate('/docs');
    }
  }, [token, navigate]);

  // Show a loading message while verifying
  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <div className="text-center text-foreground">
        <h2 className="text-xl font-bold mb-4">Verifying your email...</h2>
        <p className="text-muted-foreground">Please wait, you'll be redirected shortly.</p>
      </div>
    </div>
  );
};

export default EmailVerification;