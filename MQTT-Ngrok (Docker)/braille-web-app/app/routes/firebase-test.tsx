import { useState, useEffect } from 'react';
import { auth, db } from '~/config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function FirebaseTest() {
  const [status, setStatus] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpass123');
  const [isLoading, setIsLoading] = useState(false);

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addStatus('Firebase Test Page Loaded');
    
    // Test Firebase Auth connection
    if (auth) {
      addStatus('✅ Firebase Auth initialized');
    } else {
      addStatus('❌ Firebase Auth failed to initialize');
    }

    // Test Firestore connection
    if (db) {
      addStatus('✅ Firestore initialized');
    } else {
      addStatus('❌ Firestore failed to initialize');
    }
  }, []);

  const testFirestore = async () => {
    setIsLoading(true);
    try {
      const testDoc = doc(db, 'test', 'connection');
      await setDoc(testDoc, { 
        message: 'Firebase connection test',
        timestamp: new Date().toISOString()
      });
      addStatus('✅ Firestore write test successful');
      
      const docSnap = await getDoc(testDoc);
      if (docSnap.exists()) {
        addStatus('✅ Firestore read test successful');
      } else {
        addStatus('❌ Firestore read test failed');
      }
    } catch (error) {
      addStatus(`❌ Firestore test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuth = async () => {
    setIsLoading(true);
    try {
      // Try to create a test user
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      addStatus('✅ User creation test successful');
      
      // Try to sign in
      await signInWithEmailAndPassword(auth, testEmail, testPassword);
      addStatus('✅ User sign-in test successful');
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // Try to sign in instead
        try {
          await signInWithEmailAndPassword(auth, testEmail, testPassword);
          addStatus('✅ User sign-in test successful (user already exists)');
        } catch (signInError) {
          addStatus(`❌ User sign-in test failed: ${signInError}`);
        }
      } else {
        addStatus(`❌ Auth test failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearStatus = () => {
    setStatus([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Firebase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Password</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testFirestore}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Test Firestore
            </button>
            <button
              onClick={testAuth}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Test Authentication
            </button>
            <button
              onClick={clearStatus}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Log
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
            {status.length === 0 ? (
              <div className="text-gray-500">No tests run yet...</div>
            ) : (
              status.map((line, index) => (
                <div key={index} className="mb-1">{line}</div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-indigo-600 hover:text-indigo-500">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

