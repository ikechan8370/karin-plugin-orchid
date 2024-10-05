class Recipe {
  constructor(props = {}) {
    this.baseUrl = props.baseUrl || 'http://recipe.yunzai.chat/search/'
  }

  /**
   *
   * @param {string} keyword
   * @param {number} offset
   * @param {number} limit
   * @param {{
   *   style: string,
   *   time: string,
   *   level: string,
   *   cook: string
   * }} filter
   * @return {Promise<{
   *   status_code: number,
   *   results: {
   *     hits: Array<{
   *       name: string,
   *       难度: string,
   *       耗时: string,
   *       工艺: string,
   *       口味: string,
   *       cook: string,
   *       main_ingredients: string[],
   *       supplementary_ingredients: string[],
   *       seasonings: string[],
   *       categories: string[],
   *       steps: Array<{
   *         img: string,
   *         step: string,
   *         description: string
   *       }>,
   *     }>,
   *     query: string,
   *     processingTimeMs: number,
   *     limit: number,
   *     offset: number,
   *     estimatedTotalHits: number
   *   }
   *   message: string?
   * }>}
   */
  async search(keyword, offset = 0, limit = 10, filter = {}) {
    let url = `${this.baseUrl}${keyword}?offset=${offset}&limit=${limit}`
    Object.keys(filter).forEach(key => {
      url += `&${key}=${filter[key]}`
    })
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'karin-plugin-orchid/1.0.1 node-fetch'
      }
    })
    const json = await res.json()
    return json
  }

}

export default new Recipe()