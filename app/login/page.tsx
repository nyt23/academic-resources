'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (error) {
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-white flex items-center justify-center p-4 sm:p-6 md:p-8 transition-all duration-300 ease-in-out">
      <div className="w-full max-w-md relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <div className="bg-gray-50 dark:bg-[#1E1E1E] p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-800/30">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Admin Login</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">Enter your password to access admin features</p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <Lock className="w-4 h-4" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800/50 rounded-lg focus:outline-none focus:border-icon-blue text-gray-900 dark:text-white placeholder-gray-500"
                placeholder="Enter admin password"
                required
                autoFocus
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 sm:py-2 bg-blue-200 dark:bg-blue-600/30 hover:bg-blue-300 dark:hover:bg-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 text-blue-800 dark:text-blue-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
