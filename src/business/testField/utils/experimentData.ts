/**
 * 实验项目数据配置
 */

import type { ExperimentItem } from '../types';

export const experiments: ExperimentItem[] = [
  // 实用工具类
  {
    id: '1',
    title: '实验考试系统',
    description: '一个用于创建和管理在线考试的实验性系统',
    path: '/testField/experiment',
    tags: ['考试', '教育', '实验'],
    category: 'utility',
    isCompleted: false,
    createdAt: '2023-01-15',
    updatedAt: '2023-06-20'
  },
  // 新增悬浮菜单演示
  {
    id: 'floating-menu',
    title: '可拖动悬浮菜单',
    description: '一个可在页面任意位置拖动的悬浮菜单，根据位置自动调整弹出方向',
    path: '/testField/FloatingMenuDemo',
    tags: ['UI组件', '交互', '菜单'],
    category: 'utility',
    isCompleted: true,
    createdAt: '2023-08-15',
    updatedAt: '2023-08-15'
  },
  {
    id: '2',
    title: '实时活动',
    description: '用于展示实时活动状态的实验性功能',
    path: '/testField/LiveActivity',
    tags: ['实时', '活动', '实验'],
    category: 'utility',
    isCompleted: false,
    createdAt: '2023-02-10',
    updatedAt: '2023-07-05'
  },
  {
    id: "config-default",
    title: "通用考试配置",
    description: "配置通用考试系统的题目和设置",
    path: "/testField/experiment/config",
    tags: ["配置", "考试"],
    category: "utility",
    isCompleted: false,
    createdAt: '2023-01-20',
    updatedAt: '2023-05-15'
  },
  {
    id: "config-arknights",
    title: "明日方舟配置",
    description: "配置明日方舟知识测试的题目和设置",
    path: "/testField/experiment/config?type=arknights",
    tags: ["配置", "游戏"],
    category: "utility",
    isCompleted: false,
    createdAt: '2023-02-05',
    updatedAt: '2023-04-10'
  },

  {
    id: "sync-text",
    title: "多端文本同步",
    description: "在多个设备间同步和共享文本内容",
    path: "/testField/SyncText",
    tags: ["同步", "剪贴板"],
    category: "utility",
    isCompleted: false,
    createdAt: '2023-03-12',
    updatedAt: '2023-08-01'
  },
  {
    id: "home-page-config",
    title: "首页配置",
    description: "首页配置",
    path: "/testField/HomePageConfig",
    tags: ["配置页面", "首页"],
    category: "utility",
    isCompleted: false,
    createdAt: '2023-01-05',
    updatedAt: '2023-07-28'
  },
  {
    id: "show-master-pieces",
    title: "艺术画集展览",
    description: "浏览各种艺术画集，支持逐页查看和画集管理",
    path: "/testField/ShowMasterPieces",
    tags: ["艺术", "画集", "展览"],
    category: "leisure",
    isCompleted: false,
    createdAt: '2023-04-18',
    updatedAt: '2023-08-10'
  },
  {
    id: "show-master-pieces-config",
    title: "艺术画集管理后台",
    description: "艺术画集展览的管理后台，包括画集管理、作品管理、预订管理等功能，需要管理员权限",
    path: "/testField/ShowMasterPieces/config",
    tags: ["艺术", "画集", "管理", "后台", "预订"],
    category: "utility",
    isCompleted: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: "image-downloader",
    title: "图片下载器",
    description: "通过图片URL快速下载图片到本地，支持预览和自定义文件名",
    path: "/testField/ImageDownloader",
    tags: ["下载", "图片", "工具"],
    category: "utility",
    isCompleted: false
  },
  {
    id: "work-calculate",
    title: "工作计算器",
    description: "工作计算器",
    path: "/testField/WorkCalculate",
    tags: ["计算器", "工具"],
    category: "utility",
    isCompleted: false
  },
  {
    id: "idea-list",
    title: "想法清单",
    description: "管理和组织各种想法的清单工具，支持多个清单、优先级设置、标签分类和完成状态跟踪",
    path: "/testField/ideaList",
    tags: ["想法", "清单", "待办事项", "管理"],
    category: "utility",
    isCompleted: false
  },
  {
    id: "mmd-viewer",
    title: "MMD模型查看器",
    description: "基于Three.js的MMD(MikuMikuDance)模型查看器，支持PMD/PMX模型格式和VMD动画播放",
    path: "/testField/mmdViewer",
    tags: ["3D", "MMD", "Three.js", "模型", "动画"],
    category: "leisure",
    isCompleted: false
  },
  {
    id: "mmd-test",
    title: "MMD 功能测试场",
    description: "基于 @sa2kit/mmd 的MMD播放器测试页面，封装所有逻辑，仅需传入配置即可使用",
    path: "/testField/mmdTest",
    tags: ["3D", "MMD", "测试", "SA2Kit"],
    category: "utility",
    isCompleted: true,
    createdAt: '2025-11-21',
    updatedAt: '2025-11-21'
  },
  {
    id: "card-maker",
    title: "名片制作器",
    description: "移动端名片制作工具，支持角色头像、背景图片、文字编辑等功能，可创建个性化名片",
    path: "/testField/cardMaker",
    tags: ["名片", "设计", "移动端", "编辑器", "个性化"],
    category: "utility",
    isCompleted: false
  },
  {
    id: "tailwind-test",
    title: "TailwindCSS 测试场",
    description: "专门用于测试和学习TailwindCSS的实验模块，包含各种样式特性的示例和测试用例",
    path: "/testField/tailwindTest",
    tags: ["TailwindCSS", "样式", "测试", "学习", "CSS"],
    category: "utility",
    isCompleted: false
  },

  // 休闲娱乐类
  {
    id: "vocaloider",
    title: "术力口音乐播放器",
    description: "术力口音乐播放器",
    path: "/testField/Vocaloider",
    tags: ["小游戏", "赛博无料"],
    category: "leisure"
  },
  {
    id: "share-monitor",
    title: "手机投屏",
    description: "手机投屏",
    path: "/testField/ShareMonitor",
    tags: ["投屏", "工具"],
    category: "leisure"
  },
  {
    id: "miku-click",
    title: "米库点击",
    description: "测试 点击奏鸣初音未来功能 功能",
    path: "/testField/MikuClick",
    tags: ["小游戏", "赛博无料","新建文件夹"],
    category: "leisure"
  },
  {
    id: "mikutap-game",
    title: "MikutapGame 音乐游戏",
    description: "基于Mikutap的音乐学习游戏，包含旋律模仿、节奏挑战等功能",
    path: "/mikutapGame",
    tags: ["音乐游戏", "学习", "Mikutap", "旋律"],
    category: "leisure",
    isCompleted: false,
    createdAt: '2023-12-15',
    updatedAt: '2023-12-15'
  },
  {
    id: "kannot",
    title: " 坎诺特",
    description: "已有坎诺特功能",
    path: "/testField/Kannot",
    tags: ["小游戏", "赛博无料","初版完成","待迁移"],
    category: "leisure",
    isCompleted: false
  },
  {
    id: "VocaloidtoGO",
    title: " 博立格来冲",
    description: "博立格来冲",
    path: "/testField/VocaloidtoGO",
    tags: ["小游戏", "赛博无料","新建文件夹"],
    category: "leisure"
  },
  {
    id: "linkGame",
    title: "葱韵环京连连看",
    description: "葱韵环京连连看",
    path: "/testField/linkGame",
    tags: ["小游戏", "葱韵环京","初版完成"],
    category: "leisure",
    isCompleted: false
  },
  {
    id: "linkGame_v1",
    title: "葱韵环京连连看_v1",
    description: "葱韵环京连连看_v1",
    path: "/testField/linkGame_v1",
    tags: ["小游戏", "葱韵环京","改进代码"],
    category: "leisure",
    isCompleted: false
  },
  {
    id: "pushBox",
    title: "推箱子",
    description: "推箱子",
    path: "/testField/pushBox",
    tags: ["小游戏", "赛博无料","初版完成"],
    category: "leisure",
    isCompleted: false
  },
  {
    id: "raceGame",
    title: " 赛车游戏",
    description: "赛车游戏",
    path: "/testField/raceGame",
    tags: ["小游戏", "赛博无料","初版完成"],
    category: "leisure",
    isCompleted: false
  },
  {
    id: "tribleGame",
    title: " 三消游戏",
    description: "三消游戏",
    path: "/testField/tribleGame",
    tags: ["小游戏", "赛博无料","初版完成"],
    category: "leisure",
    isCompleted: false
  },
  {
    id: "goldMiner",
    title: "黄金矿工",
    description: "金矿工",
    path: "/testField/goldMiner",
    tags: ["小游戏", "赛博无料","新建文件夹"],
    category: "leisure"
  },
  {
    id: "playMusic",
    title: "音乐无料",
    description: "音乐无料",
    path: "/testField/playMusic",
    tags: ["小游戏", "赛博无料","新建文件夹"],
    category: "leisure"
  },
  {
    id: "mikuPlanting",
    title: "米库种植",
    description: "米库种植",
    path: "/testField/mikuPlanting",
    tags: ["小游戏", "赛博无料","新建文件夹"],
    category: "leisure"
  },

  // 新增模块
  {
    id: "notification",
    title: "通知中心",
    description: "查看和管理系统通知，支持筛选和操作",
    path: "/testField/notification",
    tags: ["通知", "管理", "系统"],
    category: "utility",
    isCompleted: true
  },
  {
    id: "filetransfer", 
    title: "文件中转站",
    description: "安全、快速的文件传输服务，支持文件上传和下载",
    path: "/testField/filetransfer",
    tags: ["文件", "传输", "上传", "下载"],
    category: "utility", 
    isCompleted: true
  },
  {
    id: "calendar",
    title: "日历管理",
    description: "企业级日历应用，具备完整的事件管理、智能提醒、重复事件、事件搜索等高级功能。支持月/周/日视图切换，具备导入导出、时区支持、响应式设计等现代化特性。现已集成用户认证系统，支持登录/登出、用户菜单、认证守卫等功能",
    path: "/testField/calendar",
    tags: ["日历", "事件管理", "智能提醒", "重复事件", "搜索过滤", "企业级", "用户认证", "登录系统"],
    category: "utility",
    isCompleted: true
  },
  {
    id: "solar-system",
    title: "实时太阳系",
    description: "基于真实天文数据的太阳系3D可视化，使用Three.js展示太阳和八大行星的实时位置与轨道运动。支持时间控制、行星信息查看、轨道可视化等功能",
    path: "/testField/solarSystem",
    tags: ["太阳系", "3D", "Three.js", "天文", "可视化", "实时"],
    category: "leisure",
    isCompleted: true
  },
  {
    id: "mikutap",
    title: "Mikutap 音乐互动",
    description: "复刻经典音乐互动游戏Mikutap，支持点击、拖拽和按键触发音效，具备多种音色包、丰富的动画效果、可配置化视觉效果、响应式设计，完美支持桌面和移动端",
    path: "/testField/mikutap",
    tags: ["音乐", "互动", "游戏", "初音未来", "音效", "动画", "可配置", "响应式"],
    category: "leisure",
    isCompleted: true
  },
  {
    id: "mikutap-config",
    title: "Mikutap 配置管理",
    description: "Mikutap音乐互动游戏的配置管理界面，支持网格布局自定义、音效设置、动画效果配置（脉冲、滑动、弹跳、闪烁、旋转、缩放、涟漪、自定义Lottie）、数据库持久化存储，可创建和管理多种配置预设",
    path: "/testField/mikutap/config",
    tags: ["配置", "管理", "音效", "动画", "Lottie", "数据库", "持久化", "预设"],
    category: "utility",
    isCompleted: true
  },
  {
    id: "purchase-game",
    title: "购买挑战游戏",
    description: "一个倒计时购买商品的小游戏，玩家需要在30秒内做出购买决策。每次购买都会影响生命值或源石锭，生命值为0时游戏结束并显示总积分。包含谋财/害命两种商品类型，支持响应式设计和动画效果",
    path: "/purchaseGame",
    tags: ["小游戏", "购买", "倒计时", "策略", "响应式", "动画"],
    category: "leisure",
    isCompleted: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: "miku-talking",
    title: "米库说话",
    description: "类似会说话的汤姆猫的MMD互动游戏，支持点击互动、语音录制变声、拖拽手势、喂食道具等功能。与米库互动，提升亲密度，解锁更多动画和表情！",
    path: "/gameField/mikutalking",
    tags: ["小游戏", "MMD", "互动", "语音", "Three.js", "3D", "变声"],
    category: "leisure",
    isCompleted: false,
    createdAt: '2025-11-03',
    updatedAt: '2025-11-03'
  },
  {
    id: "mmd-test",
    title: "MMD 功能测试",
    description: "测试和验证 SA2Kit MMD 库的各项功能，包括模型加载、动画播放、相机控制、React Hooks 等。支持多种测试模式，提供详细的状态信息和调试工具",
    path: "/testField/mmdTest",
    tags: ["MMD", "3D", "测试", "SA2Kit", "Three.js", "开发工具"],
    category: "utility",
    isCompleted: false,
    createdAt: '2025-11-15',
    updatedAt: '2025-11-15'
  },
  {
    id: "mmd-upload",
    title: "MMD 资源上传",
    description: "上传 MMD 模型、动作、音频等资源到阿里云 OSS，获取 CDN 加速链接。支持拖拽上传、批量上传、进度显示，提供原始 URL 和 CDN URL，用于测试和优化 MMD 资源加载速度",
    path: "/testField/mmdUpload",
    tags: ["MMD", "上传", "OSS", "CDN", "文件管理", "开发工具"],
    category: "utility",
    isCompleted: true,
    createdAt: '2025-11-23',
    updatedAt: '2025-11-23'
  },
  {
    id: "mmd-playlist",
    title: "MMD 播放列表",
    description: "测试 MMD 播放列表功能，支持多个 MMD 场景的连续播放、节点管理、预加载优化等。可以配置播放列表、添加/删除节点、调整播放顺序",
    path: "/testField/mmdPlaylist",
    tags: ["MMD", "播放列表", "3D", "测试", "SA2Kit"],
    category: "utility",
    isCompleted: true,
    createdAt: '2025-11-23',
    updatedAt: '2025-11-23'
  },
  {
    id: "audio-detection-test",
    title: "SA2Kit 音频检测器",
    description: "调试 sa2kit 新增的音频检测模块，涵盖预设 UI、Hook 沙盒和参数调节器，便于验证音符与和弦识别表现",
    path: "/testField/audio-detection-test",
    tags: ["音频", "检测", "SA2Kit", "实验"],
    category: "utility",
    isCompleted: false,
    createdAt: '2025-12-06',
    updatedAt: '2025-12-06'
  }
];