import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationPreferences, NotificationType } from '@/types/notification';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  task_assigned: true,
  task_due_soon: true,
  comment_added: true,
  status_changed: true,
  project_invitation: true,
};

interface NotificationSettingsState extends NotificationPreferences {
  toggle: (key: keyof NotificationPreferences) => void;
  reset: () => void;
  isEnabled: (type: NotificationType) => boolean;
}

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,

      toggle: (key: keyof NotificationPreferences) => {
        set((state) => ({ [key]: !state[key] }));
      },

      reset: () => {
        set(DEFAULT_PREFERENCES);
      },

      isEnabled: (type: NotificationType) => {
        const state = get();
        return state.enabled && state[type];
      },
    }),
    {
      name: 'notification-settings-storage',
    }
  )
);
