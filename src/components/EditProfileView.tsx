/**
 * Edit Profile screen: set display name, age, and birthday. Persisted via
 * `AppContext.updateProfile` (backed by localStorage). Opened from the
 * Profile Settings "Edit Profile" tile.
 */
import React, { useState } from 'react';
import { ChevronLeft, Cake } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface EditProfileViewProps {
  onClose: () => void;
}

export const EditProfileView: React.FC<EditProfileViewProps> = ({ onClose }) => {
  const { displayName, age, birthday, updateProfile, showToast, theme } = useApp();
  const [name, setName] = useState(displayName);
  const [ageInput, setAgeInput] = useState(age !== null ? String(age) : '');
  const [birthdayInput, setBirthdayInput] = useState(birthday || '');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    const parsedAge = ageInput.trim() ? parseInt(ageInput, 10) : NaN;
    updateProfile(trimmed, Number.isFinite(parsedAge) ? parsedAge : null, birthdayInput || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg-page)] overflow-y-auto">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">
        <div className="flex items-center px-2 py-2">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-[17px] font-bold text-[var(--text-primary)]">Edit Profile</h1>
          <button
            onClick={handleSave}
            className="px-3 py-2 text-sm font-bold text-[var(--accent)] hover:opacity-80 transition-colors"
          >
            Save
          </button>
        </div>

        <div className="flex-1 px-5 py-3 space-y-5">
          <div>
            <label className="block mb-2 text-xs font-bold tracking-wide text-[var(--text-secondary)]">NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold tracking-wide text-[var(--text-secondary)]">AGE</label>
            <input
              type="number"
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              placeholder="Your age"
              className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold tracking-wide text-[var(--text-secondary)]">
              BIRTHDAY
            </label>
            <div className="relative">
              <Cake className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
              <input
                type="date"
                value={birthdayInput}
                onChange={(e) => setBirthdayInput(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{ colorScheme: theme === 'pink' ? 'dark' : 'light' }}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
