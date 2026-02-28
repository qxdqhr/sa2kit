'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* 头部 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            SA2Kit 组件示例
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            探索和测试各种工具组件
          </p>
        </div>

        {/* 组件卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 图片网格裁剪工具 */}
          <Link
            href="/image-crop"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">✂️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              图片网格裁剪工具
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              上传图片，设置网格，裁剪并导出为 ZIP 压缩包
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                图片处理
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                批量导出
              </span>
            </div>
          </Link>

          {/* Screen Receiver 测试 */}
          <Link
            href="/screen-receiver-test"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📺</div>
              <span className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                SCREEN
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              screenReceiver 测试
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              对应模块 `modules/screenReceiver`，用于验证接收端前端与信令流程。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                Hono
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                WebRTC Receiver
              </span>
            </div>
          </Link>

          {/* QQ Bot / NapCat */}
          <Link
            href="/qqbot-napcat-demo"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-cyan-200 dark:border-cyan-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🤖</div>
              <span className="px-2 py-1 text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded font-semibold">
                QQ BOT
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              NapCat 网页接口
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              基于 OneBot11 的 QQ 机器人封装，支持 action 调用、发群消息、发私聊。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm">
                OneBot11
              </span>
              <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-sm">
                NapCat
              </span>
            </div>
          </Link>

          {/* 音频检测组件 */}
          <Link
            href="/audio-detection"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              音频检测
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              实时音频检测、音符识别和和弦分析
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                音频分析
              </span>
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                实时处理
              </span>
            </div>
          </Link>

          {/* 基础使用示例 */}
          <Link
            href="/basic-usage"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              基础使用
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              探索核心功能和 React Hooks 使用示例
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                Storage
              </span>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                Hooks
              </span>
            </div>
          </Link>

          {/* React 应用示例 */}
          <Link
            href="/react-app"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">⚛️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              React 应用示例
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              完整的 React 应用，包含登录、主题切换等功能
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                完整应用
              </span>
              <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm">
                最佳实践
              </span>
            </div>
          </Link>

          {/* 测测你是什么 */}
          <div
            onClick={() => router.push('/test-yourself')}
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-blue-200 dark:border-blue-800 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🎲</div>
              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-semibold">
                NEW
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              测测你是什么
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              趣味测试组件，支持自定义配置、图片结果展示。基于设备指纹的随机算法。
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                趣味游戏
              </span>
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                设备指纹
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                数据库支持
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <Link
                href="/test-yourself-admin"
                className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="mr-1">⚙️</span>
                配置管理后台 →
              </Link>
              <br />
              <Link
                href="/test-yourself-admin-v2"
                className="inline-flex items-center text-sm text-green-600 dark:text-green-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="mr-1">🎨</span>
                简化版（批量上传）→
              </Link>
            </div>
          </div>
          
          {/* AI 功能演示 */}
          <Link
            href="/ai-demo"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🤖</div>
              <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded font-semibold">
                AI
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              AI 功能演示
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              纯浏览器实现的 AI 功能，包含 OCR 文字识别等。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                OCR 识别
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                浏览器端
              </span>
            </div>
          </Link>

          {/* AI LLM 对话框（API Key） */}
          <Link
            href="/ai-llm-dialog"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">💬</div>
              <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-semibold">
                LLM
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              AI LLM 对话框
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              测试 `sa2kit/ai/llm` 与 `sa2kit/ai/llm/ui/web`，支持 API Key 配置和弹窗对话。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 rounded-full text-sm">
                API Key
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                Dialog UI
              </span>
            </div>
          </Link>

          {/* MMD 音乐播放器 */}
          <Link
            href="/music-player"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-pink-200 dark:border-pink-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🎧</div>
              <span className="px-2 py-1 text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded font-semibold">
                NEW
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
              MMD 音乐播放器
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Study with Miku 风格的沉浸式播放器，支持多曲目切换、专注模式。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                3D 表演
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                沉浸式
              </span>
            </div>
          </Link>

          {/* 在线音乐播放器 */}
          <Link
            href="/online-music"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📻</div>
              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-semibold">
                NEW
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              在线音乐播放器
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              支持网易云、QQ音乐、酷我等多源搜索，包含歌词同步、播放列表等功能。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                多源 API
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                歌词同步
              </span>
            </div>
          </Link>

          {/* Miku 无线电 (Radio) */}
          <Link
            href="/miku-radio"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-teal-200 dark:border-teal-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📻</div>
              <span className="px-2 py-1 text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded font-semibold">
                MIKU
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Miku 无线电
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              集成 Miku 专属搜索，支持一边听歌一边看 Miku 表演，丝滑无缝切换。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm">
                Meting 集成
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                平滑切换
              </span>
            </div>
          </Link>

          {/* Miku AR 交互 */}
          <Link
            href="/mmd-ar-test"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-green-200 dark:border-green-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📸</div>
              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded font-semibold">
                AR
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              MMD AR 测试
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              用于验证 MMD AR 组件：模型放置、模式切换、摄像头切换与截图流程。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                WebRTC
              </span>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                实景融合
              </span>
            </div>
          </Link>

          {/* 日历管理系统 */}
          <Link
            href="/calendar-demo"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📅</div>
              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-semibold">
                NEW
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              日历管理系统
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              全功能的日历应用，支持拖拽、重复事件、提醒设置和多种视图切换。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                事件管理
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                可视化视图
              </span>
            </div>
          </Link>

          {/* FX 文件解析器 */}
          <Link
            href="/fx-parser-demo"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-violet-200 dark:border-violet-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🎨</div>
              <span className="px-2 py-1 text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded font-semibold">
                NEW
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              FX 文件解析器
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              解析和分析 MME 的 .fx 效果文件，支持 PAToon 等格式，可视化展示和导出。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm">
                MME 效果
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                文件解析
              </span>
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                可视化
              </span>
            </div>
          </Link>

          {/* MMD + FX 效果集成 */}
          <Link
            href="/mmd-fx-demo"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-indigo-200 dark:border-indigo-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🎭</div>
              <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded font-semibold">
                NEW
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              MMD + FX 效果
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              将MME的.fx效果文件应用到MMD播放器中，支持PAToon等渲染效果。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                MMD 渲染
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                FX 效果
              </span>
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                实时渲染
              </span>
            </div>
          </Link>

          {/* 多FX文件演示 */}
          <Link
            href="/multi-fx-demo"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🌟</div>
              <span className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                ADVANCED
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              多FX文件渲染
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              同时应用多个.fx和.x文件，分层次渲染。支持场景级(.x) + 模型级(.fx)组合。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                多层渲染
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                .x + .fx
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                优先级控制
              </span>
            </div>
          </Link>

          {/* MMD渲染效果对比 */}
          <Link
            href="/mmd-rendering-comparison"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-cyan-200 dark:border-cyan-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🎨</div>
              <span className="px-2 py-1 text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded font-semibold">
                NEW
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              MMD渲染效果对比
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              对比优化前后的渲染效果差异，了解如何获得接近MMD软件的显示质量。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm">
                渲染优化
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                光照设置
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                材质配置
              </span>
            </div>
          </Link>

          {/* PMX模型解析器 */}
          <Link
            href="/pmx-viewer-demo"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              PMX模型解析器
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              查看PMX模型文件的纹理映射关系，理解MMDLoader的工作原理。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                模型解析
              </span>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                纹理映射
              </span>
            </div>
          </Link>

          {/* MMD光照调试面板 */}
          <Link
            href="/mmd-lighting-debug-demo"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🎨</div>
              <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded font-semibold">
                NEW
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              MMD光照调试面板
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              实时调整渲染器、光源、材质参数，无需重新编译。支持快速预设和参数导出。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm">
                实时调试
              </span>
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                光照控制
              </span>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                参数导出
              </span>
            </div>
          </Link>
        </div>

        {/* 底部信息 */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-md">
            <span className="text-gray-600 dark:text-gray-400">基于</span>
            <a
              href="https://github.com/sa2kit/sa2kit"
            target="_blank"
            rel="noopener noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
              SA2Kit
          </a>
            <span className="text-gray-600 dark:text-gray-400">构建</span>
          </div>
        </div>
      </div>
    </div>
  );
}
