import { config } from './config'
import fs from 'fs'
import path from 'path'

export function mkdirs (dirname: string) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirs(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

/**
 * 如果有任意一个文件大于 maxSize，则返回true
 * @param files
 */
export function checkFileSize (files: (File | FormDataEntryValue)[]): boolean {
  const maxFileSize = config().maxFileSize
  const maxFileSizeByte = maxFileSize * 1024 * 1024
  let fileList = Array.isArray(files) ? files : [files]
  fileList = fileList.filter(file => file instanceof File && !!file.size)
  if (fileList.length === 0) {
    return false
  }
  return fileList.some(file => file instanceof File && file.size >= maxFileSizeByte)
}

/**
 * 格式化时间
 * @param pubDate
 * @returns
 */
export function formatRssPubDate (pubDate: string | number | Date) {
  const dateObj = new Date(pubDate)
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24小时制
  })
}
