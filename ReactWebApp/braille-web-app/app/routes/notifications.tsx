import React from 'react';
import { FaBell, FaInfoCircle } from 'react-icons/fa';

export default function Notifications() {
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <FaBell className="text-2xl text-indigo-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <FaInfoCircle className="text-4xl text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
            You're all caught up!
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            You have no new notifications at the moment.
          </p>
        </div>

        {/* Example of notification items */}
        {/*
        <div className="space-y-4">
          <div className="flex items-start p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <FaBell className="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                System Update Available
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A new system update is ready to install.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                2 hours ago
              </p>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  );
}