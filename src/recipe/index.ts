// Define the interfaces
interface Hit {
  name: string
  难度: string
  耗时: string
  工艺: string
  口味: string
  cook: string
  id: string
  main_ingredients: string[]
  supplementary_ingredients: string[]
  seasonings: string[]
  categories: string[]
  steps: Array<{
    img: string
    step: string
    description: string
  }>
}

interface SearchFilter {
  style?: string
  time?: string
  level?: string
  cook?: string
}

interface SearchResponse {
  status_code: number
  results: {
    hits: Hit[]
    query: string
    processingTimeMs: number
    limit: number
    offset: number
    estimatedTotalHits: number
  }
  message?: string
}

interface RecipeProps {
  baseUrl?: string
}

interface SummaryResponse {
  summary: string
  recipes: Hit[]
}

class Recipe {
  private baseUrl: string

  constructor (props: RecipeProps = {}) {
    this.baseUrl = props.baseUrl || 'http://recipe.yunzai.chat/'
  }

  async search (
    keyword: string,
    offset: number = 0,
    limit: number = 10,
    filter: SearchFilter = {}
  ): Promise<SearchResponse> {
    let url = `${this.baseUrl}search/${keyword}?offset=${offset}&limit=${limit}`
    Object.keys(filter).forEach(key => {
      url += `&${key}=${filter[key as keyof SearchFilter]}`
    })
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'karin-plugin-orchid/1.0.1 node-fetch'
      }
    })
    const json = await res.json()
    return json
  }

  async getById (id: string): Promise<Hit> {
    const url = `${this.baseUrl}recipe/${id}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'karin-plugin-orchid/1.0.1 node-fetch'
      }
    })
    const json = await res.json()
    return json
  }

  async summary (demand?: string): Promise<SummaryResponse> {
    const url = `${this.baseUrl}recommend?descr=${demand || ''}`
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
