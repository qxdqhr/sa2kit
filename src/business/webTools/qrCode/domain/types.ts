export type QRCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QRCodeImageProps {
  /** 要编码的 URL 或字符串（必填） */
  url: string
  /** 二维码尺寸，单位 px（默认 200） */
  size?: number
  /** 前景色（默认 #000000） */
  fgColor?: string
  /** 背景色（默认 #ffffff） */
  bgColor?: string
  /** 纠错级别：L=7%, M=15%, Q=25%, H=30%（默认 'M'） */
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel
  /** 自定义样式类名 */
  className?: string
  /** 是否在二维码下方显示 URL 文字（默认 false） */
  showUrl?: boolean
  /** 二维码标题，显示在二维码上方 */
  title?: string
  /** 中心 logo 图片 URL */
  logoUrl?: string
  /** logo 尺寸，单位 px（默认 size * 0.2） */
  logoSize?: number
}

export interface QRCodeDownloadOptions {
  filename?: string
  format?: 'png' | 'svg'
}
