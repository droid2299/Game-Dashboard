import React from 'react';
import './SettingsPage.scss';

const settingsItems = [
  "User's Guide, Health and Safety, and Other Information",
  "Accessibility",
  "Network",
  "Users and Accounts",
  "Family and Parental Controls",
  "System",
  "Storage",
  "Sounds",
  "Screen and Video"
];

interface SettingsPageProps {
  onBack: () => void; // callback to return to main screen
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  return (
    <div className="settings-page">
      {/* A simple "Back" button (positioned in top-left or wherever you prefer) */}
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      {/* The Settings heading in top-left */}
      <h1 className="settings-header">Settings</h1>

      {/* The list of settings items, with lines below each entry */}
      <ul className="settings-list">
        {settingsItems.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default SettingsPage;
