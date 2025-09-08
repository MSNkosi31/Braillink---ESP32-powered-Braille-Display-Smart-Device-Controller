import React from 'react';
import { useAuth } from '~/contexts/AuthContext';
import ProtectedRoute from '~/components/common/ProtectedRoute';

export default function AuthTest() {
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Authentication Test Page</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Authentication Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Authentication Status</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Authenticated:</span>
                    <span className={`font-medium ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                      {isAuthenticated ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admin Role:</span>
                    <span className={`font-medium ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                      {isAdmin ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">User Information</h2>
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{currentUser.displayName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{currentUser.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium capitalize">{currentUser.role || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Verified:</span>
                      <span className={`font-medium ${currentUser.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                        {currentUser.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-medium text-xs">{currentUser.uid}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No user data available</p>
                )}
              </div>
            </div>

            {/* Test Actions */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Actions</h2>
              <div className="space-x-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Test Logout
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>

            {/* Raw Data */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Raw User Data</h2>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(currentUser, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
