'use client'

import React, { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { QRCodeImageProps } from '../../../domain/types'
import { downloadQRCodeAsPng } from '../../../domain/utils'

/**
 * QRCodeImage 组件
 * 传入 url 字符串，渲染对应的二维码图片（SVG）
 */
export default function QRCodeImage({
  url,
  size = 200,
  fgColor = '#000000',
  bgColor = '#ffffff',
  errorCorrectionLevel = 'M',
  className = '',
  showUrl = false,
  title,
  logoUrl,
  logoSize,
}: QRCodeImageProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const computedLogoSize = logoSize ?? Math.round(size * 0.2)

  if (!url) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 text-sm ${className}`}
        style={{ width: size, height: size }}
      >
        请输入内容
      </div>
    )
  }

  const imageSettings = logoUrl
    ? {
        src: logoUrl,
        x: undefined,
        y: undefined,
        height: computedLogoSize,
        width: computedLogoSize,
        excavate: true,
      }
    : undefined

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      {title && (
        <p className="text-sm font-medium text-gray-700">{title}</p>
      )}
      <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
        <QRCodeSVG
          ref={svgRef}
          value={url}
          size={size}
          fgColor={fgColor}
          bgColor={bgColor}
          level={errorCorrectionLevel}
          imageSettings={imageSettings}
        />
      </div>
      {showUrl && (
        <p
          className="max-w-full truncate text-xs text-gray-500 px-2"
          style={{ maxWidth: size }}
          title={url}
        >
          {url}
        </p>
      )}
    </div>
  )
}

/**
 * 带下载功能的 QRCodeImage 封装
 */
export function QRCodeImageWithDownload(props: QRCodeImageProps & { downloadFilename?: string }) {
  const { downloadFilename = 'qrcode.png', ...qrProps } = props
  const svgRef = useRef<SVGSVGElement>(null)

  const handleDownload = () => {
    const svgEl = document.querySelector('.qrcode-download-target svg') as SVGSVGElement | null
    if (svgEl) {
      downloadQRCodeAsPng(svgEl, downloadFilename)
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="qrcode-download-target">
        <QRCodeImage {...qrProps} />
      </div>
      {props.url && (
        <button
          onClick={handleDownload}
          className="px-4 py-1.5 rounded-lg bg-gray-800 text-white text-xs hover:bg-gray-700 active:scale-95 transition-all"
        >
          下载二维码
        </button>
      )}
    </div>
  )
}
