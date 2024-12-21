import { PostHandler } from '../post_handler.js'

class KeywordFilter extends PostHandler {
  constructor () {
    super()
    this.name = 'keyword_filter'
    this.type = 'custom'
  }

  /**
   *
   * @param data
   * @param raw
   * @param {{
   *   mustContain: string,
   *   mustNotContain: string,
   * }} args
   * @return {Promise<{valid?: boolean, content?: import("rss-parser").Item}>}
   */
  async handle (data: { content: any }, raw: any, args: { mustContain: any; mustNotContain: any }) {
    const content = data.content
    if (args.mustContain && !content.includes(args.mustContain)) {
      return {
        valid: false
      }
    }
    if (args.mustNotContain && content.includes(args.mustNotContain)) {
      return {
        valid: false
      }
    }
    return {
      valid: true,
      content: data
    }
  }
}

export default new KeywordFilter()
