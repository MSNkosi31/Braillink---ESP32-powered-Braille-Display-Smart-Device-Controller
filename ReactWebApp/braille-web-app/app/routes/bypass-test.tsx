import React, { useState } from 'react';

export default function BypassTest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<string>('');

  const testBypass = () => {
    setResult('✅ Bypass test successful! This means the website is working.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Bypass Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Without Firebase</h2>
          
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
            
            <button
              onClick={testBypass}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Test Bypass (No Firebase)
            </button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{result}</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Troubleshooting Steps:</h3>
          <ol className="text-blue-700 space-y-1 list-decimal list-inside">
            <li>First test this bypass page to ensure the website is working</li>
            <li>Check browser console (F12) for detailed error messages</li>
            <li>Verify Firebase project has Authentication enabled</li>
            <li>Check if Google OAuth is enabled in Firebase Console</li>
            <li>Ensure popups are allowed for localhost:5173</li>
            <li>Try using a different browser or incognito mode</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

