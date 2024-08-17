import fs from 'fs'
import path from 'path'
import Cfg from '../lib/config/config.js'

export const DATA_DIR = 'data/karin-plugin-orchid'
export function mkdirs (dirname) {
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
 * @return {boolean}
 */
export function checkFileSize (files) {
  const maxFileSize = Cfg.Default.maxFileSize
  const maxFileSizeByte = maxFileSize * 1024 * 1024
  let fileList = Array.isArray(files) ? files : [files]
  fileList = fileList.filter(file => !!(file?.size))
  if (fileList.length === 0) {
    return false
  }
  return fileList.some(file => file.size >= maxFileSizeByte)
}


export function formatRssPubDate (pubDate) {
  const dateObj = new Date(pubDate);
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24小时制
  });
}