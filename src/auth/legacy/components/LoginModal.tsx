'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validatePhoneNumber } from '../utils/authUtils';
import type { LoginModalProps } from '../types';
import ForgotPasswordModal from './ForgotPasswordModal';

/**
 * 登录模态框组件
 * 提供用户登录界面和逻辑
 */
export default function LoginModal({ isOpen, onClose, onSuccess, onSwitchToRegister }: LoginModalProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 确保在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 开发环境快速填充
  const fillDemoAccount = (type: 'admin' | 'user') => {
    if (process.env.NODE_ENV === 'development') {
      const accounts = {
        admin: { phone: '13800138000', password: 'admin123456' },
        user: { phone: '13900139000', password: 'test123456' }
      };
      setFormData(accounts[type]);
      setError('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // 清除错误信息
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔄 [LoginModal] handleSubmit 开始');

    try {
      // 前端验证
      if (!formData.phone || !formData.password) {
        console.log('❌ [LoginModal] 前端验证失败: 信息不完整');
        setError('请填写完整信息');
        return;
      }

      if (!validatePhoneNumber(formData.phone)) {
        console.log('❌ [LoginModal] 前端验证失败: 手机号格式错误');
        setError('请输入正确的手机号');
        return;
      }

      console.log('✅ [LoginModal] 前端验证通过');
      console.log('🔑 [LoginModal] 提交登录表单:', { 
        phone: formData.phone, 
        password: '***' 
      });

      console.log('📞 [LoginModal] 准备调用 useAuth.login()...');
      
      // 使用useAuth的login方法
      const result = await login(formData);
      
      console.log('📡 [LoginModal] useAuth.login() 返回结果:', result);

      if (result.success) {
        console.log('✅ [LoginModal] 登录成功，准备调用 onSuccess()');
        console.log('👤 [LoginModal] 登录成功的用户信息:', result.user);
        
        // 短暂延迟确保状态已更新
        setTimeout(() => {
          console.log('🎯 [LoginModal] 调用 onSuccess 回调');
          onSuccess();
          console.log('🏁 [LoginModal] onSuccess 调用完成');
        }, 100);
        
      } else {
        console.log('❌ [LoginModal] 登录失败:', result.message);
        setError(result.message || '登录失败');
      }
    } catch (error) {
      console.error('💥 [LoginModal] 登录异常:', error);
      setError('登录失败，请稍后重试');
    } finally {
      console.log('🔚 [LoginModal] handleSubmit 结束，设置 loading = false');
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        style={{ margin: 0 }}
        onClick={handleOverlayClick}
      >
        {/* 模态框主体 */}
        <div 
          className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button 
            className="absolute top-5 right-5 bg-transparent border-none text-gray-500 cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-9 min-h-9 flex items-center justify-center"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          {/* 标题 */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">用户登录</h2>
            <p className="text-gray-500 text-sm">请输入您的手机号和密码</p>
          </div>

          {/* 开发环境快捷登录 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="px-6 py-4 bg-amber-50 border-b border-gray-100">
              <p className="text-xs text-amber-800 font-medium mb-2">开发环境快捷登录：</p>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => fillDemoAccount('admin')} 
                  className="px-3 py-1.5 text-xs bg-amber-400 text-amber-900 border-none rounded-md cursor-pointer transition-all font-medium hover:bg-amber-500"
                >
                  管理员账号
                </button>
                <button 
                  type="button" 
                  onClick={() => fillDemoAccount('user')} 
                  className="px-3 py-1.5 text-xs bg-amber-400 text-amber-900 border-none rounded-md cursor-pointer transition-all font-medium hover:bg-amber-500"
                >
                  用户账号
                </button>
              </div>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* 手机号输入 */}
            <div className="mb-5">
              <label htmlFor="phone" className="block mb-1.5 text-sm font-medium text-gray-700">
                手机号
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="请输入手机号"
                  className="w-full py-3 px-4 pl-12 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div className="mb-5">
              <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-4 text-gray-400 z-[1] pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码"
                  className="w-full py-3 px-4 pl-12 pr-12 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-4 bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all flex items-center justify-center min-w-6 min-h-6 hover:text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 忘记密码链接 */}
            <div className="text-right -mt-2 mb-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="bg-transparent border-none text-blue-500 cursor-pointer text-sm font-medium underline px-1 py-0.5 rounded transition-all hover:text-blue-600 hover:bg-blue-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                忘记密码？
              </button>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="text-red-500 text-sm my-4 p-3 bg-red-50 border border-red-200 rounded-lg leading-relaxed">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white border-none py-3.5 px-6 rounded-lg text-base font-medium cursor-pointer transition-all mt-2 min-h-[52px] hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>

            {/* 注册链接 */}
            {onSwitchToRegister && (
              <div className="text-center mt-5 pt-4 border-t border-gray-100">
                <span className="text-gray-500 text-sm mr-1">还没有账号？</span>
                <button 
                  type="button" 
                  onClick={onSwitchToRegister} 
                  className="bg-transparent border-none text-blue-500 cursor-pointer text-sm font-medium underline px-1 py-0.5 rounded transition-all hover:text-blue-600 hover:bg-blue-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  立即注册
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 忘记密码模态框 */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          onSuccess();
        }}
      />
    </>
  );

  // 使用 Portal 渲染到 body，避免父组件样式影响
  return createPortal(modalContent, document.body);
}
