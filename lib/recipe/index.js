// create a type defination of hit
/**
 * @typedef {{
 *  name: string,
 *  难度: string,
 *  耗时: string,
 *  工艺: string,
 *  口味: string,
 *  cook: string,
 *  id: string,
 *  main_ingredients: string[],
 *  supplementary_ingredients: string[],
 *  seasonings: string[],
 *  categories: string[],
 *  steps: Array<{
 *  img: string,
 *  step: string,
 *  description: string
 *  }>,
 *  }} hit
 */

class Recipe {
  constructor(props = {}) {
    this.baseUrl = props.baseUrl || 'http://recipe.yunzai.chat/'
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
   *     hits: Array<hit>,
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
    let url = `${this.baseUrl}search/${keyword}?offset=${offset}&limit=${limit}`
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

  /**
   *
   * @param {string} id
   * @return {Promise<hit>}
   */

  async getById(id) {
    let url = `${this.baseUrl}recipe/${id}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'karin-plugin-orchid/1.0.1 node-fetch'
      }
    })
    const json = await res.json()
    return json
  }

  /**
   *
   * @param {string?} demand
   * @return {Promise<{
   *   summary: string,
   *   recipes: Array<hit>
   * }>}
   */
  async summary(demand) {
    let url = `${this.baseUrl}recommend?descr=${demand || ''}`
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