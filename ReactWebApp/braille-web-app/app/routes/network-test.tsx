import React, { useState } from 'react';
import { auth, db } from '~/config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function NetworkTest() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setResults(prev => [...prev, `${timestamp} ${prefix} ${message}`]);
  };

  const testNetworkConnectivity = async () => {
    setIsLoading(true);
    addResult('Testing network connectivity...');
    
    try {
      // Test basic network connectivity
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      addResult('Basic network connectivity: OK', 'success');
    } catch (error) {
      addResult('Basic network connectivity: FAILED', 'error');
    }

    try {
      // Test Firebase connectivity
      addResult('Testing Firebase connectivity...');
      const testDoc = await getDoc(doc(db, 'test', 'connectivity'));
      addResult('Firebase Firestore connectivity: OK', 'success');
    } catch (error: any) {
      addResult(`Firebase Firestore connectivity: ${error.code || error.message}`, 'error');
    }

    try {
      // Test Firebase Auth connectivity
      addResult('Testing Firebase Auth connectivity...');
      const currentUser = auth.currentUser;
      addResult(`Firebase Auth connectivity: OK (Current user: ${currentUser ? currentUser.email : 'None'})`, 'success');
    } catch (error: any) {
      addResult(`Firebase Auth connectivity: ${error.code || error.message}`, 'error');
    }

    setIsLoading(false);
  };

  const testSimpleLogin = async () => {
    setIsLoading(true);
    addResult('Testing simple Firebase login...');
    
    try {
      const startTime = Date.now();
      addResult('Calling signInWithEmailAndPassword...');
      
      // Use a test email that we know exists
      const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'wrongpassword');
      
      const endTime = Date.now();
      addResult(`Login successful in ${endTime - startTime}ms`, 'success');
    } catch (error: any) {
      const endTime = Date.now();
      addResult(`Login failed in ${endTime - Date.now()}ms: ${error.code}`, 'error');
      addResult(`Error message: ${error.message}`, 'error');
      
      if (error.code === 'auth/user-not-found') {
        addResult('This is expected - user does not exist', 'info');
      } else if (error.code === 'auth/wrong-password') {
        addResult('This is expected - wrong password', 'info');
      } else if (error.code === 'auth/network-request-failed') {
        addResult('Network issue detected!', 'error');
      }
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Network Connectivity Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Network Tests</h2>
            
            <div className="space-y-3">
              <button
                onClick={testNetworkConnectivity}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Test Network Connectivity
              </button>
              
              <button
                onClick={testSimpleLogin}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Test Simple Firebase Login
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
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">What This Tests:</h3>
          <ul className="text-yellow-700 space-y-1 list-disc list-inside">
            <li>Basic internet connectivity</li>
            <li>Firebase Firestore connection</li>
            <li>Firebase Auth connection</li>
            <li>Simple login attempt timing</li>
            <li>Network error detection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

