'use client';

import Link from 'next/link';

export default function ScreenReceiverTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">screenReceiver 测试路由</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              对应组件路径：`modules/screenReceiver/src/App.tsx`，服务入口：`modules/screenReceiver/server.ts`
            </p>
          </div>
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
            返回首页
          </Link>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <p className="font-semibold">启动方式</p>
          <pre className="mt-2 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
{`cd /Users/qihongrui/Desktop/project/sa2kit/modules/screenReceiver
npm install
npm run dev`}
          </pre>
          <p className="mt-2">启动后默认地址：`http://127.0.0.1:8787/receiver`</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <iframe
            title="screenReceiver"
            src="http://127.0.0.1:8787/receiver"
            className="h-[760px] w-full rounded-xl border border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>
    </div>
  );
}
