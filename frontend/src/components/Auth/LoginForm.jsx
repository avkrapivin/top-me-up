import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const { signIn, signInWithGoogle, signInWithFacebook, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  }
  
  const handleSocialSignIn = async (providerFn) => {
    if (isSubmitting || isSocialSubmitting) return;
    if (error) clearError();

    try {
      setIsSocialSubmitting(true);
      await providerFn();
      navigate('/dashboard');
    } catch (err) {
      console.error('Social login error:', err);
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (error) clearError();

    try {
      setIsSubmitting(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md relative">
       <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Login to system
      </h2>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-3 rounded-md mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading || isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading || isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:cursor-not-allowed"
        >
          {loading || isSubmitting ? 'Login...' : 'Login'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative mb-4">
          <span className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
          </span>
          <span className="relative flex justify-center text-sm text-gray-500 dark:text-gray-400">
            <span className="bg-white dark:bg-gray-800 px-2">or</span>
          </span>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocialSignIn(signInWithGoogle)}
            disabled={loading || isSubmitting || isSocialSubmitting}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-label="google">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

        </div>
      </div>
    </div>
  );
}

export default LoginForm;