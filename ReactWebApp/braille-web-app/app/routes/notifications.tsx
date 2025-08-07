import React from 'react';

export default function Notifications() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Notifications</h1>
      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-gray-600">
          You have no new notifications at the moment.
        </p>
      </div>
    </div>
  );
}

