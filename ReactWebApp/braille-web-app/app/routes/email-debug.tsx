import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '~/config/firebase';

export default function EmailDebug() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setResults(prev => [...prev, `${timestamp} ${prefix} ${message}`]);
  };

  const testDirectFirebaseLogin = async () => {
    setIsLoading(true);
    addResult('Testing direct Firebase email login...');
    
    try {
      console.log('Attempting direct Firebase login with:', email);
      addResult(`Attempting login with email: ${email}`);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Direct Firebase login successful:', userCredential.user);
      addResult(`Direct Firebase login successful! User: ${userCredential.user.email}`, 'success');
      addResult(`User UID: ${userCredential.user.uid}`, 'success');
      addResult(`Email verified: ${userCredential.user.emailVerified}`, 'success');
      
    } catch (error: any) {
      console.error('Direct Firebase login error:', error);
      addResult(`Direct Firebase login failed: ${error.code}`, 'error');
      addResult(`Error message: ${error.message}`, 'error');
      
      // Provide specific solutions based on error code
      if (error.code === 'auth/user-not-found') {
        addResult('Solution: User does not exist. Try creating an account first.', 'error');
      } else if (error.code === 'auth/wrong-password') {
        addResult('Solution: Incorrect password. Check your password.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        addResult('Solution: Invalid email format. Check your email address.', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        addResult('Solution: Too many failed attempts. Wait a few minutes.', 'error');
      } else if (error.code === 'auth/network-request-failed') {
        addResult('Solution: Network error. Check your internet connection.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectFirebaseSignup = async () => {
    setIsLoading(true);
    addResult('Testing direct Firebase email signup...');
    
    try {
      console.log('Attempting direct Firebase signup with:', email);
      addResult(`Attempting signup with email: ${email}`);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Direct Firebase signup successful:', userCredential.user);
      addResult(`Direct Firebase signup successful! User: ${userCredential.user.email}`, 'success');
      addResult(`User UID: ${userCredential.user.uid}`, 'success');
      
    } catch (error: any) {
      console.error('Direct Firebase signup error:', error);
      addResult(`Direct Firebase signup failed: ${error.code}`, 'error');
      addResult(`Error message: ${error.message}`, 'error');
      
      // Provide specific solutions based on error code
      if (error.code === 'auth/email-already-in-use') {
        addResult('Solution: Email already exists. Try logging in instead.', 'error');
      } else if (error.code === 'auth/weak-password') {
        addResult('Solution: Password too weak. Use at least 6 characters.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        addResult('Solution: Invalid email format. Check your email address.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthServiceLogin = async () => {
    setIsLoading(true);
    addResult('Testing AuthService login...');
    
    try {
      // Import AuthService dynamically to avoid circular imports
      const { AuthService } = await import('~/services/authService');
      addResult(`Attempting AuthService login with: ${email}`);
      
      const user = await AuthService.signIn(email, password);
      console.log('AuthService login successful:', user);
      addResult(`AuthService login successful! User: ${user.email}`, 'success');
      addResult(`User role: ${user.role}`, 'success');
      
    } catch (error: any) {
      console.error('AuthService login error:', error);
      addResult(`AuthService login failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const checkFirebaseConfig = () => {
    addResult('Checking Firebase configuration...');
    addResult(`Auth object: ${auth ? 'Available' : 'Not Available'}`);
    addResult(`Current user: ${auth?.currentUser ? auth.currentUser.email : 'None'}`);
    addResult(`Auth domain: ${auth?.config?.authDomain || 'Not set'}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Email Authentication Debug</h1>
        
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
                  placeholder="test@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="password123"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={checkFirebaseConfig}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Check Firebase Config
              </button>
              
              <button
                onClick={testDirectFirebaseLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Test Direct Firebase Login
              </button>
              
              <button
                onClick={testDirectFirebaseSignup}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Test Direct Firebase Signup
              </button>
              
              <button
                onClick={testAuthServiceLogin}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Test AuthService Login
              </button>
              
              <button
                onClick={clearResults}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
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
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Debugging Steps:</h3>
          <ol className="text-blue-700 space-y-1 list-decimal list-inside">
            <li>First check Firebase configuration</li>
            <li>Try direct Firebase login to isolate the issue</li>
            <li>Try direct Firebase signup if login fails</li>
            <li>Test AuthService login to see if the issue is in our wrapper</li>
            <li>Check browser console (F12) for detailed error messages</li>
            <li>Use one of the emails from your Firebase console that you know exists</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
