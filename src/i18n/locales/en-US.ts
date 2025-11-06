/**
 * English translations
 */

export default {
  // ==================== App Information ====================
  app: {
    name: 'LyricNote',
    fullName: 'LyricNote - Lyrics & Notes',
    icon: '🎵',
    description: 'A powerful lyrics and notes management app',
    author: 'LyricNote Team',
    copyright: `© ${new Date().getFullYear()} LyricNote`,
    version: '1.0.0',
  },

  // ==================== App Titles ====================
  titles: {
    main: '🎵 LyricNote',
    admin: 'LyricNote Admin',
    withVersion: 'LyricNote v1.0.0',
    welcome: 'Welcome to LyricNote',
    about: 'About LyricNote',
  },

  // ==================== Common ====================
  common: {
    hello: 'Hello',
    welcome: 'Welcome',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    finish: 'Finish',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    retry: 'Retry',
    empty: 'No data',
  },

  // ==================== Navigation ====================
  nav: {
    home: 'Home',
    lyrics: 'Lyrics',
    create: 'Create',
    collection: 'Collection',
    profile: 'Profile',
    settings: 'Settings',
    history: 'History',
    logout: 'Logout',
  },

  // ==================== User ====================
  user: {
    login: 'Login',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    phone: 'Phone',
    nickname: 'Nickname',
  },

  // ==================== Pages ====================
  pages: {
    home: {
      title: 'Home',
      description: 'A powerful lyrics and notes management app',
    },
    profile: {
      title: 'Profile',
      description: 'Manage your personal information and preferences',
    },
    admin: {
      title: 'LyricNote Admin',
      description: 'System management and data statistics',
    },
    login: {
      title: 'Login',
      description: 'Login to LyricNote',
    },
  },

  // ==================== Form Validation ====================
  validation: {
    required: '{{field}} is required',
    invalid_email: 'Invalid email format',
    password_too_short: 'Password must be at least {{count}} characters',
    password_weak: 'Password is too weak',
    passwords_not_match: 'Passwords do not match',
  },

  // ==================== Status Messages ====================
  status: {
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    empty: 'No data',
    network_error: 'Network error, please try again later',
  },

  // ==================== Error Messages ====================
  errors: {
    network: 'Network error, please try again later',
    server: 'Server error',
    unauthorized: 'Unauthorized, please login first',
    not_found: 'Not found',
    unknown: 'Unknown error',
  },

  // ==================== Success Messages ====================
  success: {
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    updated: 'Updated successfully',
    created: 'Created successfully',
  },

  // ==================== Language Settings ====================
  language: {
    label: 'Language',
    zh_cn: '简体中文',
    zh_tw: '繁體中文',
    en_us: 'English',
    ja_jp: '日本語',
  },
} as const;
