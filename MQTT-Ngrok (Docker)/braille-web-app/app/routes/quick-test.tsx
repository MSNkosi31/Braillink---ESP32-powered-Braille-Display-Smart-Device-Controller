import React, { useState } from 'react';
import { useAuth } from '~/contexts/AuthContext';

export default function QuickTest() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<string>('');

  const testLogin = async () => {
    try {
      setResult('Testing login...');
      const user = await login(email, password);
      setResult(`✅ Login successful: ${user.email}`);
    } catch (error: any) {
      setResult(`❌ Login failed: ${error.message}`);
    }
  };

  const testSignup = async () => {
    try {
      setResult('Testing signup...');
      const user = await signup(email, password, 'Test User', 'caregiver');
      setResult(`✅ Signup successful: ${user.email}`);
    } catch (error: any) {
      setResult(`❌ Signup failed: ${error.message}`);
    }
  };

  const testGoogle = async () => {
    try {
      setResult('Testing Google login...');
      const user = await loginWithGoogle();
      setResult(`✅ Google login successful: ${user.email}`);
    } catch (error: any) {
      setResult(`❌ Google login failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quick Authentication Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
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
            
            <div className="space-y-2">
              <button
                onClick={testLogin}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Test Login
              </button>
              
              <button
                onClick={testSignup}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Test Signup
              </button>
              
              <button
                onClick={testGoogle}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Test Google Login
              </button>
            </div>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <p className="font-mono text-sm">{result}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Use an email from your Firebase console (like test@example.com)</li>
            <li>Try login first - you should see specific error codes now</li>
            <li>Check browser console (F12) for detailed logs</li>
            <li>Report the exact error message you see</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

