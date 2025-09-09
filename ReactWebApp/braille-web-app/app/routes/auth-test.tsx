import React, { useState } from 'react';
import { useAuth } from '~/contexts/AuthContext';

export default function AuthTest() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [displayName, setDisplayName] = useState('Test User');
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testEmailLogin = async () => {
    try {
      addResult('Testing email login...');
      const user = await login(email, password);
      addResult(`✅ Email login successful: ${user.email}`);
    } catch (error: any) {
      addResult(`❌ Email login failed: ${error.message}`);
    }
  };

  const testEmailSignup = async () => {
    try {
      addResult('Testing email signup...');
      const user = await signup(email, password, displayName, 'caregiver');
      addResult(`✅ Email signup successful: ${user.email}`);
    } catch (error: any) {
      addResult(`❌ Email signup failed: ${error.message}`);
    }
  };

  const testGoogleLogin = async () => {
    try {
      addResult('Testing Google login...');
      const user = await loginWithGoogle();
      addResult(`✅ Google login successful: ${user.email}`);
    } catch (error: any) {
      addResult(`❌ Google login failed: ${error.message}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={testEmailLogin}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Test Email Login
              </button>
              
              <button
                onClick={testEmailSignup}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Test Email Signup
              </button>
              
              <button
                onClick={testGoogleLogin}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Test Google Login
              </button>
              
              <button
                onClick={clearResults}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Results
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 rounded-md p-4 h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500">No tests run yet. Click a test button to start.</p>
              ) : (
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting Tips:</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• Make sure Firebase project has Authentication enabled</li>
            <li>• Check if Google OAuth is enabled in Firebase Console</li>
            <li>• Verify Firebase configuration is correct</li>
            <li>• Check browser console for detailed error messages</li>
            <li>• Ensure internet connection is working</li>
          </ul>
        </div>
      </div>
    </div>
  );
}