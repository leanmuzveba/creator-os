/**
 * Profile Settings page: avatar, display name, aggregate stats, and a grouped
 * settings list (Edit Profile, Notifications, Privacy & Security, Creator
 * Analytics, App Theme). Opened as a full-screen overlay from the Header
 * avatar button, mirroring the mobile app's pushed ProfileScreen.
 */
import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  Settings,
  User,
  Bell,
  Lock,
  BarChart3,
  Palette,
  ChevronRight,
  Users,
  Zap,
  Pencil,
  Moon,
  Sun,
  Contrast,
  Heart,
  Check,
} from 'lucide-react';
import { useApp, AppTheme } from '../context/AppContext';
import { calculateTotalFollowers, formatMetric } from '../utils/metricUtils';
import { compressAvatarToDataUrl } from '../utils/videoUtils';
import { EditProfileView } from './EditProfileView';

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

export const ProfileView: React.FC = () => {
  const {
    isProfileOpen,
    setIsProfileOpen,
    socialAccounts,
    setIsAccountsModalOpen,
    setActiveTab,
    showToast,
    displayName,
    avatarUrl,
    setAvatar,
    notificationsEnabled,
    setNotificationsEnabled,
    theme,
    setTheme,
  } = useApp();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressAvatarToDataUrl(file);
      setAvatar(dataUrl);
    } catch {
      showToast('Could not process that image', 'error');
    }
  };

  if (!isProfileOpen) return null;

  const connectedCount = socialAccounts.filter((a) => a.connected).length;
  const totalFollowers = calculateTotalFollowers(socialAccounts);

  const close = () => setIsProfileOpen(false);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-page)] overflow-y-auto">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center px-4 py-3">
          <button
            onClick={close}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-[17px] font-bold text-[var(--text-primary)]">Profile Settings</h1>
          <button
            onClick={() => showToast('More settings are coming soon', 'info')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="More settings"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Profile header */}
        <div className="flex flex-col items-center pt-2 pb-4 px-6">
          <div className="relative">
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="w-[88px] h-[88px] rounded-full p-0.5 border-2 border-[var(--accent)] block"
              aria-label="Change avatar"
            >
              <img
                src={avatarUrl || DEFAULT_AVATAR_URL}
                alt="Profile avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </button>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute right-0 bottom-0 w-7 h-7 rounded-full bg-[var(--accent)] border-[3px] border-[var(--bg-page)] flex items-center justify-center"
              aria-label="Change avatar"
            >
              <Pencil className="w-[13px] h-[13px] text-white" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <h2 className="mt-3 text-lg font-bold text-[var(--text-primary)]">{displayName}</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-secondary)] text-center">
            Content Creator · Microsoft Student Ambassador
          </p>

          {/* Stats pills */}
          <div className="mt-4 flex items-center justify-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold">
              <Users className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              {formatMetric(totalFollowers)} Followers
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--bg-surface)] text-[var(--accent)] text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              {connectedCount} Platform{connectedCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Settings list */}
        <div className="flex-1 px-4 pb-8">
          <SectionLabel text="ACCOUNT" />
          <SettingsTile
            icon={<User className="w-[18px] h-[18px]" />}
            label="Edit Profile"
            onClick={() => setIsEditProfileOpen(true)}
          />
          <ToggleTile
            icon={<Bell className="w-[18px] h-[18px]" />}
            label="Notifications"
            value={notificationsEnabled}
            onChange={(value) => setNotificationsEnabled(value)}
          />
          <SettingsTile
            icon={<Lock className="w-[18px] h-[18px]" />}
            label="Privacy & Security"
            onClick={() => {
              close();
              setIsAccountsModalOpen(true);
            }}
          />

          <SectionLabel text="PREFERENCES" className="mt-5" />
          <SettingsTile
            icon={<BarChart3 className="w-[18px] h-[18px]" />}
            label="Creator Analytics"
            onClick={() => {
              setActiveTab('analytics');
              close();
            }}
          />
          <SettingsTile
            icon={<Palette className="w-[18px] h-[18px]" />}
            label="App Theme"
            onClick={() => setIsThemePickerOpen(true)}
          />
        </div>
      </div>

      {isEditProfileOpen && <EditProfileView onClose={() => setIsEditProfileOpen(false)} />}

      {isThemePickerOpen && (
        <ThemePicker
          theme={theme}
          onSelect={(next) => {
            setTheme(next);
            setIsThemePickerOpen(false);
          }}
          onClose={() => setIsThemePickerOpen(false)}
        />
      )}
    </div>
  );
};

/** Bottom-sheet App Theme picker, mirroring the mobile ProfileScreen's theme sheet. */
const ThemePicker: React.FC<{
  theme: AppTheme;
  onSelect: (theme: AppTheme) => void;
  onClose: () => void;
}> = ({ theme, onSelect, onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60" onClick={onClose}>
    <div
      className="w-full max-w-lg bg-[var(--bg-surface)] rounded-t-[20px] pb-6 pt-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-9 h-1 rounded-full bg-[var(--border-color-strong)] mx-auto mb-3" />
      <p className="px-6 pb-1 text-[11px] font-bold tracking-wider text-[var(--text-secondary)]">APP THEME</p>
      <ThemeOption
        label="Default"
        icon={<Contrast className="w-[18px] h-[18px]" />}
        selected={theme === 'default'}
        onClick={() => onSelect('default')}
      />
      <ThemeOption
        label="Pink"
        icon={<Heart className="w-[18px] h-[18px]" />}
        selected={theme === 'pink'}
        onClick={() => onSelect('pink')}
      />
      <ThemeOption
        label="Light Blue"
        icon={<Sun className="w-[18px] h-[18px]" />}
        selected={theme === 'light-blue'}
        onClick={() => onSelect('light-blue')}
      />
      <ThemeOption
        label="Moon"
        icon={<Moon className="w-[18px] h-[18px]" />}
        selected={theme === 'moon'}
        onClick={() => onSelect('moon')}
      />
    </div>
  </div>
);

const ThemeOption: React.FC<{ label: string; icon: React.ReactNode; selected: boolean; onClick: () => void }> = ({
  label,
  icon,
  selected,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3.5 px-6 py-3.5 hover:bg-[var(--overlay-hover)] transition-colors text-left"
  >
    <span className="text-[var(--accent)]">{icon}</span>
    <span className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)]">{label}</span>
    {selected && <Check className="w-5 h-5 text-[var(--accent)]" />}
  </button>
);

const SectionLabel: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => (
  <p className={`px-2 pb-2 text-[11px] font-bold tracking-wider text-[var(--text-secondary)] ${className}`}>
    {text}
  </p>
);

const SettingsTile: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3.5 px-3.5 py-3.5 mb-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
  >
    <span className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-15)] text-[var(--accent)]">
      {icon}
    </span>
    <span className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)]">{label}</span>
    <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
  </button>
);

const ToggleTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ icon, label, value, onChange }) => (
  <div className="w-full flex items-center gap-3.5 px-3.5 py-3 mb-2.5 rounded-2xl bg-[var(--bg-surface)]">
    <span className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-15)] text-[var(--accent)]">
      {icon}
    </span>
    <span className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)]">{label}</span>
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[var(--accent)]' : 'bg-[var(--track-off)]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : ''
        }`}
      />
    </button>
  </div>
);
