/**
 * 将 SVG 元素下载为 PNG 图片
 */
export function downloadQRCodeAsPng(svgElement: SVGSVGElement, filename = 'qrcode.png'): void {
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = svgElement.width.baseVal.value
    canvas.height = svgElement.height.baseVal.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)

    const pngUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = pngUrl
    a.download = filename
    a.click()
  }
  img.src = url
}

/**
 * 将 SVG 元素下载为 SVG 文件
 */
export function downloadQRCodeAsSvg(svgElement: SVGSVGElement, filename = 'qrcode.svg'): void {
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 判断字符串是否是合法 URL
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}
