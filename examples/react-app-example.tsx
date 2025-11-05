/**
 * React App 完整示例
 * Complete React App Example
 */

import React, { useState, useEffect } from 'react';
import {
  logger,
  createLogger,
  LogLevel,
  useLocalStorage,
  validators,
  errorUtils,
  stringUtils,
} from '@react-utils-kit/core';

// 创建模块日志
const appLogger = createLogger('App', { minLevel: LogLevel.INFO });
const authLogger = createLogger('Auth');

// 用户类型
interface User {
  id: number;
  username: string;
  email: string;
}

// 用户认证组件
function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // 验证输入
    if (!validators.isValidUsername(username)) {
      setErrors(['Invalid username format']);
      authLogger.warn('Invalid username attempt', { username });
      return;
    }

    if (!validators.isValidEmail(email)) {
      setErrors(['Invalid email format']);
      authLogger.warn('Invalid email attempt', { email });
      return;
    }

    try {
      // 模拟 API 调用（使用重试机制）
      const user = await errorUtils.retry(
        async () => {
          authLogger.info('Attempting login', { username });
          // 模拟 API 调用
          return {
            id: Math.floor(Math.random() * 1000),
            username,
            email,
          };
        },
        3,
        1000
      );

      authLogger.info('Login successful', { userId: user.id });
      onLogin(user);
    } catch (error) {
      const message = errorUtils.extractErrorMessage(error);
      setErrors([message]);
      authLogger.error('Login failed', error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (3-20 chars, alphanumeric)"
          />
        </div>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </div>
        {errors.length > 0 && (
          <div style={{ color: 'red' }}>
            {errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        )}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

// 用户资料组件
function UserProfile({ user, onLogout }: { user: User; onLogout: () => void }) {
  const displayName = stringUtils.capitalize(user.username);

  return (
    <div>
      <h2>Welcome, {displayName}!</h2>
      <p>Email: {user.email}</p>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

// 主应用组件
function App() {
  // 使用 localStorage 持久化用户状态
  const [user, setUser, removeUser, loading] = useLocalStorage<User | null>('current-user', null);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('app-theme', 'light');

  useEffect(() => {
    appLogger.info('App mounted', { theme, hasUser: !!user });
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    appLogger.info('User logged in', { userId: userData.id });
  };

  const handleLogout = () => {
    removeUser();
    appLogger.info('User logged out');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    appLogger.debug('Theme changed', { theme: newTheme });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const styles = {
    container: {
      padding: '20px',
      background: theme === 'dark' ? '#333' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
      minHeight: '100vh',
    },
  };

  return (
    <div style={styles.container}>
      <header>
        <h1>React Utils Kit Demo</h1>
        <button onClick={toggleTheme}>
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </header>

      <main>
        {user ? <UserProfile user={user} onLogout={handleLogout} /> : <LoginForm onLogin={handleLogin} />}
      </main>

      <footer>
        <p>
          Powered by <strong>@react-utils-kit/core</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;

