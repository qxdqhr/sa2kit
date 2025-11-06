/**
 * 简体中文翻译
 */

export default {
  // ==================== 应用信息 ====================
  app: {
    name: 'LyricNote',
    fullName: 'LyricNote - 歌词笔记',
    icon: '🎵',
    description: '一个强大的歌词和笔记管理应用',
    author: 'LyricNote Team',
    copyright: `© ${new Date().getFullYear()} LyricNote`,
    version: '1.0.0',
  },

  // ==================== 应用标题 ====================
  titles: {
    main: '🎵 LyricNote',
    admin: 'LyricNote 管理后台',
    withVersion: 'LyricNote v1.0.0',
    welcome: '欢迎使用 LyricNote',
    about: '关于 LyricNote',
  },

  // ==================== 通用文案 ====================
  common: {
    hello: '你好',
    welcome: '欢迎',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    back: '返回',
    next: '下一步',
    submit: '提交',
    finish: '完成',
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    retry: '重试',
    empty: '暂无数据',
  },

  // ==================== 导航菜单 ====================
  nav: {
    home: '首页',
    lyrics: '歌词',
    create: '创作',
    collection: '收藏',
    profile: '我的',
    settings: '设置',
    history: '历史',
    logout: '退出登录',
  },

  // ==================== 用户相关 ====================
  user: {
    login: '登录',
    register: '注册',
    username: '用户名',
    password: '密码',
    email: '邮箱',
    phone: '手机号',
    nickname: '昵称',
  },

  // ==================== 页面标题和描述 ====================
  pages: {
    home: {
      title: '首页',
      description: '一个强大的歌词和笔记管理应用',
    },
    profile: {
      title: '个人中心',
      description: '管理您的个人信息和偏好设置',
    },
    admin: {
      title: 'LyricNote 管理后台',
      description: '系统管理和数据统计',
    },
    login: {
      title: '登录',
      description: '登录到 LyricNote',
    },
  },

  // ==================== 表单验证 ====================
  validation: {
    required: '{{field}}不能为空',
    invalid_email: '邮箱格式不正确',
    password_too_short: '密码至少需要{{count}}个字符',
    password_weak: '密码强度不够',
    passwords_not_match: '两次密码不一致',
  },

  // ==================== 状态提示 ====================
  status: {
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    empty: '暂无数据',
    network_error: '网络错误，请稍后重试',
  },

  // ==================== 错误消息 ====================
  errors: {
    network: '网络错误，请稍后重试',
    server: '服务器错误',
    unauthorized: '未授权，请先登录',
    not_found: '未找到相关内容',
    unknown: '未知错误',
  },

  // ==================== 成功消息 ====================
  success: {
    saved: '保存成功',
    deleted: '删除成功',
    updated: '更新成功',
    created: '创建成功',
  },

  // ==================== 语言设置 ====================
  language: {
    label: '语言',
    zh_cn: '简体中文',
    zh_tw: '繁體中文',
    en_us: 'English',
    ja_jp: '日本語',
  },
} as const;
