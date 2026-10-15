const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

/** Platform-aware shortcut label for the command palette trigger. */
export const kbdLabel = isMac ? '⌘K' : 'Ctrl K';
