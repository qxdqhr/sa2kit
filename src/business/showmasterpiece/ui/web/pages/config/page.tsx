'use client';

import dynamic from 'next/dynamic';

const ConfigPageClient = dynamic(() => import('./ConfigPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] items-center justify-center text-prussian-blue-600">
      加载配置页…
    </div>
  ),
});

export default function ConfigPage() {
  return <ConfigPageClient />;
}
