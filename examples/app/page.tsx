import Link from "next/link";

export default function Home() {
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
          <Link
            href="/test-yourself"
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🎲</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              测测你是什么
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              基于设备指纹的趣味测试小游戏
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                趣味游戏
              </span>
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                设备指纹
              </span>
            </div>
          </Link>

          {/* MMD播放器 - 占位 */}
          <div className="p-6 bg-gray-100 dark:bg-gray-900/50 rounded-xl shadow-lg opacity-50 cursor-not-allowed">
            <div className="text-4xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-500 mb-2">
              MMD 播放器
            </h2>
            <p className="text-gray-500 dark:text-gray-600 mb-4">
              即将推出...
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-500 rounded-full text-sm">
                3D 渲染
              </span>
            </div>
          </div>
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
