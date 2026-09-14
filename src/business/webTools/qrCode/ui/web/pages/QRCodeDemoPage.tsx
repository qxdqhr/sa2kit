'use client'

import React, { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { QRCodeErrorCorrectionLevel } from '../../../domain/types'
import { downloadQRCodeAsPng, downloadQRCodeAsSvg, isValidUrl } from '../../../domain/utils'
import QRCodeImage from '../components/QRCodeImage'

const ERROR_LEVEL_OPTIONS: { label: string; value: QRCodeErrorCorrectionLevel; desc: string }[] = [
  { label: 'L', value: 'L', desc: '7% 纠错' },
  { label: 'M', value: 'M', desc: '15% 纠错' },
  { label: 'Q', value: 'Q', desc: '25% 纠错' },
  { label: 'H', value: 'H', desc: '30% 纠错' },
]

export default function QRCodeDemoPage() {
  const [inputUrl, setInputUrl] = useState('https://example.com')
  const [size, setSize] = useState(200)
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [errorLevel, setErrorLevel] = useState<QRCodeErrorCorrectionLevel>('M')
  const [showUrl, setShowUrl] = useState(false)
  const [title, setTitle] = useState('')
  const qrContainerRef = useRef<HTMLDivElement>(null)

  const handleDownloadPng = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg') as SVGSVGElement | null
    if (svgEl) {
      downloadQRCodeAsPng(svgEl, 'qrcode.png')
    }
  }

  const handleDownloadSvg = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg') as SVGSVGElement | null
    if (svgEl) {
      downloadQRCodeAsSvg(svgEl, 'qrcode.svg')
    }
  }

  const isUrl = isValidUrl(inputUrl)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* 标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">二维码生成器</h1>
          <p className="mt-2 text-sm text-gray-500">输入任意 URL 或文字，实时生成二维码</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* 左侧配置面板 */}
          <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm">
            {/* 输入框 */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                内容 / URL
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none"
                rows={3}
                placeholder="请输入 URL 或任意文字..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
              />
              {inputUrl && (
                <p className={`mt-1 text-xs ${isUrl ? 'text-green-500' : 'text-orange-400'}`}>
                  {isUrl ? '✓ 有效的 URL 格式' : '○ 普通文本（非 URL）'}
                </p>
              )}
            </div>

            {/* 标题 */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                标题（可选）
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="显示在二维码上方..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* 尺寸 */}
            <div className="mb-5">
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700">
                尺寸
                <span className="font-normal text-gray-400">{size} px</span>
              </label>
              <input
                type="range"
                min={100}
                max={400}
                step={10}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>100px</span>
                <span>400px</span>
              </div>
            </div>

            {/* 颜色 */}
            <div className="mb-5 flex gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">前景色</label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-gray-600">{fgColor}</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">背景色</label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-gray-600">{bgColor}</span>
                </div>
              </div>
            </div>

            {/* 纠错级别 */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">纠错级别</label>
              <div className="grid grid-cols-4 gap-2">
                {ERROR_LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setErrorLevel(opt.value)}
                    className={`rounded-lg py-2 text-sm font-medium transition-all ${
                      errorLevel === opt.value
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-xs font-normal opacity-80">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 显示URL开关 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">显示内容文字</span>
              <button
                onClick={() => setShowUrl(!showUrl)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  showUrl ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    showUrl ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 右侧预览区 */}
          <div className="flex flex-col items-center gap-4 lg:w-64">
            <div className="w-full rounded-2xl bg-white p-6 shadow-sm flex flex-col items-center">
              <p className="mb-4 text-sm font-medium text-gray-500">预览</p>
              <div ref={qrContainerRef}>
                <QRCodeImage
                  url={inputUrl}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  errorCorrectionLevel={errorLevel}
                  showUrl={showUrl}
                  title={title || undefined}
                />
              </div>
            </div>

            {/* 下载按钮 */}
            {inputUrl && (
              <div className="flex w-full flex-col gap-2">
                <button
                  onClick={handleDownloadPng}
                  className="w-full rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 active:scale-95"
                >
                  下载 PNG
                </button>
                <button
                  onClick={handleDownloadSvg}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-95"
                >
                  下载 SVG
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-800">组件使用示例</h2>
          <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs text-green-400">
{`import { QRCodeImage } from 'sa2kit/business/webTools/qrCode'

// 基础用法
<QRCodeImage url="https://example.com" />

// 完整配置
<QRCodeImage
  url="${inputUrl || 'https://example.com'}"
  size={${size}}
  fgColor="${fgColor}"
  bgColor="${bgColor}"
  errorCorrectionLevel="${errorLevel}"
  showUrl={${showUrl}}${title ? `\n  title="${title}"` : ''}
/>`}
          </pre>
        </div>
      </div>
    </div>
  )
}
