import lodash from 'lodash'
import moment from 'moment'

class Common {
  /**
   * 生成随机数
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number}
   */
  random (min, max) {
    return lodash.random(min, max)
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒
   */
  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 使用moment返回时间
   * @param {string} [format] - 格式
   */
  time (format = 'YYYY-MM-DD HH:mm:ss') {
    return moment().format(format)
  }
}

export default new Common()
