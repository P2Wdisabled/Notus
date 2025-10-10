// lib/localStorage.js

const STORAGE_KEY = 'collaborative-notepad';
const SETTINGS_KEY = 'notepad-settings';

// Default text formatting
const DEFAULT_TEXT_FORMATTING = {
  color: '#000000',
  backgroundColor: 'transparent',
  fontSize: 16,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 'normal',
  textAlign: 'left'
};

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    if (typeof window === 'undefined') return false;
    
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    // console.warn('localStorage is not available:', e);
    return false;
  }
};

// Get current data from localStorage
export const getLocalStorageData = () => {
  if (!isLocalStorageAvailable()) {
    // console.warn('localStorage unavailable, returning default data');
    return { drawings: [], text: '', textFormatting: DEFAULT_TEXT_FORMATTING, timestamp: 0 };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // console.info('No saved data found, returning default data');
      return { drawings: [], text: '', textFormatting: DEFAULT_TEXT_FORMATTING, timestamp: 0 };
    }
    
    const data = JSON.parse(saved);
    
    // Validate data structure
    if (!data.drawings) data.drawings = [];
    if (!data.text) data.text = '';
    if (!data.timestamp) data.timestamp = 0;
    if (!data.textFormatting) data.textFormatting = DEFAULT_TEXT_FORMATTING;
    
    // console.info('Loaded data from localStorage:', {
    //   drawingsCount: data.drawings.length,
    //   textLength: data.text.length,
    //   timestamp: data.timestamp
    // });
    
    return data;
  } catch (error) {
    // console.error('Error loading from localStorage:', error);
    return { drawings: [], text: '', timestamp: 0 };
  }
};

// Save drawings to localStorage while preserving text
export const saveDrawingsToLocalStorage = (drawings) => {
  if (!isLocalStorageAvailable()) {
    // console.warn('localStorage is not available');
    return false;
  }

  try {
    const currentData = getLocalStorageData();
    const data = {
      ...currentData,
      drawings,
      timestamp: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // console.info('Saved drawings to localStorage:', {
    //   drawingsCount: drawings.length,
    //   preservedText: currentData.text.length > 0 ? 'Yes' : 'No',
    //   timestamp: data.timestamp
    // });
    return true;
  } catch (error) {
    // console.error('Error saving drawings to localStorage:', error);
    return false;
  }
};

// Save text to localStorage while preserving drawings
export const saveTextToLocalStorage = (text) => {
  if (!isLocalStorageAvailable()) {
    // console.warn('localStorage is not available');
    return false;
  }

  try {
    const currentData = getLocalStorageData();
    const data = {
      ...currentData,
      text,
      timestamp: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // console.info('Saved text to localStorage:', {
    //   textLength: text.length,
    //   preservedDrawings: currentData.drawings.length > 0 ? 'Yes' : 'No',
    //   timestamp: data.timestamp
    // });
    return true;
  } catch (error) {
    // console.error('Error saving text to localStorage:', error);
    return false;
  }
};

// Clear all data
export const clearLocalStorageData = () => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    // console.info('Cleared all localStorage data');
    return true;
  } catch (error) {
    // console.error('Error clearing localStorage:', error);
    return false;
  }
};

// Settings helpers
export const getSettings = () => {
  if (!isLocalStorageAvailable()) {
    return {
      mode: 'draw',
      brushColor: '#000000',
      brushSize: 3,
      lastUpdated: 0
    };
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return null;
    
    const settings = JSON.parse(saved);
    // console.info('Loaded settings from localStorage:', settings);
    return settings;
  } catch (error) {
    // console.error('Error loading settings:', error);
    return null;
  }
};

export const saveSettings = (settings) => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // console.info('Saved settings to localStorage:', settings);
    return true;
  } catch (error) {
    // console.error('Error saving settings:', error);
    return false;
  }
};

// Save text formatting to localStorage
export const saveTextFormattingToLocalStorage = (formatting) => {
  if (!isLocalStorageAvailable()) {
    // console.warn('localStorage unavailable, cannot save text formatting');
    return false;
  }

  try {
    const currentData = getLocalStorageData();
    const data = {
      ...currentData,
      textFormatting: formatting,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // console.info('Saved text formatting to localStorage:', formatting);
    return true;
  } catch (error) {
    // console.error('Error saving text formatting:', error);
    return false;
  }
};