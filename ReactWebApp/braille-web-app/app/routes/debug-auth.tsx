import React, { useState, useEffect } from 'react';
import { auth, db } from '~/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DebugAuth() {
  const [authState, setAuthState] = useState<any>(null);
  const [firestoreData, setFirestoreData] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      setAuthState(user);
      
      if (user) {
        try {
          // Test Firestore access
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          console.log('Firestore user doc:', userDoc.exists() ? userDoc.data() : 'No document found');
          setFirestoreData(userDoc.exists() ? userDoc.data() : null);
        } catch (error) {
          console.error('Firestore error:', error);
          setErrors(prev => [...prev, `Firestore error: ${error}`]);
        }
      } else {
        setFirestoreData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      console.log('Auth object:', auth);
      console.log('DB object:', db);
      console.log('Current user:', auth.currentUser);
      setErrors([]);
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      setErrors(prev => [...prev, `Connection test failed: ${error}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Firebase Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Firebase Connection Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Firebase Connection</h2>
            <button
              onClick={testFirebaseConnection}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mb-4"
            >
              Test Firebase Connection
            </button>
            
            <div className="space-y-2">
              <p><strong>Auth Object:</strong> {auth ? '✅ Available' : '❌ Not Available'}</p>
              <p><strong>DB Object:</strong> {db ? '✅ Available' : '❌ Not Available'}</p>
              <p><strong>Current User:</strong> {auth?.currentUser ? auth.currentUser.email : 'Not logged in'}</p>
            </div>
          </div>

          {/* Auth State */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
            {authState ? (
              <div className="space-y-2">
                <p><strong>UID:</strong> {authState.uid}</p>
                <p><strong>Email:</strong> {authState.email}</p>
                <p><strong>Display Name:</strong> {authState.displayName || 'Not set'}</p>
                <p><strong>Email Verified:</strong> {authState.emailVerified ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Provider:</strong> {authState.providerData?.[0]?.providerId || 'Unknown'}</p>
              </div>
            ) : (
              <p className="text-gray-500">No user logged in</p>
            )}
          </div>

          {/* Firestore Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Firestore User Data</h2>
            {firestoreData ? (
              <div className="space-y-2">
                <p><strong>Role:</strong> {firestoreData.role || 'Not set'}</p>
                <p><strong>Phone:</strong> {firestoreData.phoneNumber || 'Not set'}</p>
                <p><strong>Organization:</strong> {firestoreData.organization || 'Not set'}</p>
                <p><strong>Created:</strong> {firestoreData.createdAt || 'Not set'}</p>
                <p><strong>Last Login:</strong> {firestoreData.lastLoginAt || 'Not set'}</p>
              </div>
            ) : (
              <p className="text-gray-500">No Firestore data found</p>
            )}
          </div>

          {/* Errors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Errors</h2>
            {errors.length > 0 ? (
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <p key={index} className="text-red-600 text-sm">{error}</p>
                ))}
              </div>
            ) : (
              <p className="text-green-600">No errors detected</p>
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Instructions:</h3>
          <ol className="text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Open browser console (F12) to see detailed logs</li>
            <li>Try logging in with email/password</li>
            <li>Try Google authentication</li>
            <li>Check if Firestore data is being created/read properly</li>
            <li>Look for any error messages in the console</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

