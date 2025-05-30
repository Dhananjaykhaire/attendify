import React from 'react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Profile Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Profile</h2>
        <div className="bg-white shadow-md rounded p-4">
          {/* Inputs to update name, email, password */}
          <p>Edit your profile info here...</p>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Notifications</h2>
        <div className="bg-white shadow-md rounded p-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="form-checkbox" />
            <span>Email notifications</span>
          </label>
        </div>
      </section>

      {/* Appearance */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Appearance</h2>
        <div className="bg-white shadow-md rounded p-4">
          <label className="flex items-center space-x-2">
            <input type="radio" name="theme" value="light" />
            <span>Light Mode</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" name="theme" value="dark" />
            <span>Dark Mode</span>
          </label>
        </div>
      </section>

      {/* Security */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Security</h2>
        <div className="bg-white shadow-md rounded p-4">
          <p>Change password, enable 2FA, etc.</p>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-red-600">Danger Zone</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Delete Account</button>
        </div>
      </section>
    </div>
  );
};

export default Settings; 