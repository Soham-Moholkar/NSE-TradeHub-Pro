import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface ShortcutActions {
  onSearch?: () => void;
  onTrade?: () => void;
  onAI?: () => void;
  onProfile?: () => void;
  onDenseMode?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  // Ctrl/Cmd + K: Search
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    actions.onSearch?.();
  }, { enableOnFormTags: false });

  // Ctrl/Cmd + T: Trading Panel
  useHotkeys('ctrl+t, cmd+t', (e) => {
    e.preventDefault();
    actions.onTrade?.();
  }, { enableOnFormTags: false });

  // Ctrl/Cmd + I: AI Assistant
  useHotkeys('ctrl+i, cmd+i', (e) => {
    e.preventDefault();
    actions.onAI?.();
  }, { enableOnFormTags: false });

  // Ctrl/Cmd + P: Profile
  useHotkeys('ctrl+p, cmd+p', (e) => {
    e.preventDefault();
    actions.onProfile?.();
  }, { enableOnFormTags: false });

  // Ctrl/Cmd + D: Dense Mode Toggle
  useHotkeys('ctrl+d, cmd+d', (e) => {
    e.preventDefault();
    actions.onDenseMode?.();
  }, { enableOnFormTags: false });

  // Show shortcuts help on ?
  useHotkeys('shift+/', (e) => {
    e.preventDefault();
    // Could show a shortcuts modal here
    console.log('Keyboard Shortcuts:\nCtrl+K: Search\nCtrl+T: Trading\nCtrl+I: AI Assistant\nCtrl+P: Profile\nCtrl+D: Dense Mode');
  }, { enableOnFormTags: false });
}
