import React, { useState, useEffect } from 'react';
import { useAuth } from '~/contexts/AuthContext';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaBell,
  FaPalette,
  FaAccessibleIcon,
  FaShieldAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaCheck
} from 'react-icons/fa';

interface ProfileData {
  displayName: string;
  email: string;
  role: string;
  phoneNumber: string;
  organization: string;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  deviceAlerts: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
}

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export default function ProfileSettings() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'accessibility'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    role: 'Administrator',
    phoneNumber: '',
    organization: 'Braille Display Solutions'
  });

  const [securityData, setSecurityData] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    deviceAlerts: true,
    systemUpdates: false,
    weeklyReports: true
  });

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: true
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Mock profile update
      setTimeout(() => {
        setIsEditing(false);
        showMessage('success', 'Profile updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      showMessage('error', 'Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentUser || !currentUser.email) return;

    if (securityData.newPassword !== securityData.confirmPassword) {
      showMessage('error', 'New passwords do not match.');
      return;
    }

    if (securityData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      // Mock password update
      setTimeout(() => {
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showMessage('success', 'Password updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error: any) {
      showMessage('error', 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center space-x-3 w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === id
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-500'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300'
            }`}>
            <div className="flex items-center">
              {message.type === 'success' ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
              {message.text}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <nav className="space-y-2">
                <TabButton
                  id="profile"
                  label="Profile Information"
                  icon={<FaUser className="text-lg" />}
                />
                <TabButton
                  id="security"
                  label="Security"
                  icon={<FaLock className="text-lg" />}
                />
                <TabButton
                  id="notifications"
                  label="Notifications"
                  icon={<FaBell className="text-lg" />}
                />
                <TabButton
                  id="accessibility"
                  label="Accessibility"
                  icon={<FaAccessibleIcon className="text-lg" />}
                />
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">

              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      <FaEdit />
                      <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <select
                        value={profileData.role}
                        onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Caregiver">Caregiver</option>
                        <option value="Family Member">Family Member</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={profileData.organization}
                        onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <FaSave />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={securityData.currentPassword}
                              onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={securityData.newPassword}
                              onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={securityData.confirmPassword}
                              onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={handlePasswordUpdate}
                          disabled={loading || !securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword}
                          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <FaShieldAlt />
                          <span>{loading ? 'Updating...' : 'Update Password'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {key === 'emailNotifications' && 'Receive notifications via email'}
                            {key === 'deviceAlerts' && 'Get alerts when devices status changes'}
                            {key === 'systemUpdates' && 'Notifications about system updates'}
                            {key === 'weeklyReports' && 'Weekly summary reports'}
                          </p>
                        </div>
                        <button
                          onClick={() => setNotifications({ ...notifications, [key]: !value })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accessibility Tab */}
              {activeTab === 'accessibility' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Accessibility Settings</h2>

                  <div className="space-y-6">
                    {Object.entries(accessibility).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {key === 'highContrast' && 'Enable high contrast mode for better visibility'}
                            {key === 'largeText' && 'Increase text size throughout the application'}
                            {key === 'screenReader' && 'Optimize interface for screen readers'}
                            {key === 'keyboardNavigation' && 'Enhanced keyboard navigation support'}
                          </p>
                        </div>
                        <button
                          onClick={() => setAccessibility({ ...accessibility, [key]: !value })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}