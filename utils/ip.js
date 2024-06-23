import Cfg from '../lib/config/config.js'
import axios from 'axios'

/**
 * @typedef {{
 *   status: string,
 *   country: string,
 *   countryCode: string,
 *   region: string,
 *   regionName: string,
 *   city: string,
 *   zip: string,
 *   lat: number,
 *   lon: number,
 *   timezone: string,
 *   isp: string,
 *   org: string,
 *   as: string,
 *   query: string,
 *   source: 'ip-api.com'|'ipinfo.io'|'ip.sb'
 * }} IPGeoInfo
 */

/**
 *
 * @param ipOrDomain
 * @param {Array<'ip-api.com'|'ipinfo.io'|'ip.sb'>} source
 * @param {boolean} forceIpv6
 * @return {Promise<Array<IPGeoInfo>>}
 */
export async function getIpGeoInfo (ipOrDomain, source, forceIpv6 = false) {
  if (ipOrDomain.startsWith('http')) {
    const url = new URL(ipOrDomain)
    ipOrDomain = url.hostname
  }
  let proxy = Cfg.Default.proxy
  // get protocol host port from proxy
  if (proxy) {
    const proxyUrl = new URL(proxy)
    proxy = {
      protocol: proxyUrl.protocol,
      host: proxyUrl.hostname,
      port: proxyUrl.port,
    }
  }
  const results = []
  for (const s of source) {
    try {
      switch (s) {
        case 'ip-api.com':
          results.push(await getIpInfoIpAPI(ipOrDomain, proxy))
          break
        case 'ipinfo.io':
          results.push(await getIpInfoIpInfo(ipOrDomain, proxy, forceIpv6 ? 'AAAA' : 'A'))
          break
        case 'ip.sb':
          results.push(await getIpInfoIpSb(ipOrDomain, proxy, forceIpv6 ? 'AAAA' : 'A'))
          break
      }
    } catch (e) {
      console.error(e)
    }
  }
  return results
}

/**
 * IpAPI
 * @param ipOrDomain
 * @param proxy
 * @return {Promise<IPGeoInfo>}
 */
async function getIpInfoIpAPI (ipOrDomain, proxy) {
  const result = await axios.get('http://ip-api.com/json/' + ipOrDomain, {
    proxy,
  })
  const data = result.data
  data.source = 'ip-api.com'
  return data
}

/**
 * dns query
 * @param domain
 * @param {1|6} type 1: A, 6: AAAA
 * @return {Promise<string[]>}
 */
async function resolveByAliDNSHttp (domain, type) {
  const result = await axios.get(`https://dns.alidns.com/resolve?name=${domain}&type=${type}`)
  return result.data.Answer.map(answer => answer?.data).filter(i => i)
}

const typeMap = {
  A: 1,
  AAAA: 6,
}

/**
 * ipinfo.io
 * @param ipOrDomain
 * @param proxy
 * @param {'A'|'AAAA'} type
 * @return {Promise<IPGeoInfo>}
 */
async function getIpInfoIpInfo (ipOrDomain, proxy, type = 'A') {
  // resolve domain first, if ip is not ipv4 or ipv6
  if (!ipOrDomain.match(/\d+\.\d+\.\d+\.\d+/) && !ipOrDomain.match('(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))')) {
    const ips = await resolveByAliDNSHttp(ipOrDomain, typeMap[type])
    if (ips.length) {
      ipOrDomain = ips[0]
    }
  }
  const result = await axios.get('https://ipinfo.io/' + ipOrDomain + '/json', {
    proxy,
  })
  const data = result.data
  return {
    status: 'success',
    country: data.country,
    countryCode: data.country,
    region: data.region,
    regionName: data.region,
    city: data.city,
    zip: data.postal,
    lat: parseFloat(data.loc.split(',')[0]),
    lon: parseFloat(data.loc.split(',')[1]),
    timezone: data.timezone,
    isp: data.org,
    org: data.org,
    as: data.org.split(' ')[0],
    query: ipOrDomain,
    source: 'ipinfo.io'
  }
}

/**
 * ip.sb
 * @param ipOrDomain
 * @param proxy
 * @param {'A'|'AAAA'} type
 * @return {Promise<IPGeoInfo>}
 */
async function getIpInfoIpSb (ipOrDomain, proxy, type = 'A') {
  if (!ipOrDomain.match(/\d+\.\d+\.\d+\.\d+/) && !ipOrDomain.match('(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))')) {
    const ips = await resolveByAliDNSHttp(ipOrDomain, typeMap[type])
    if (ips.length) {
      ipOrDomain = ips[0]
    }
  }
  const result = await axios.get('https://api.ip.sb/geoip/' + ipOrDomain, {
    proxy,
  })
  return {
    status: 'success',
    country: result.data.country,
    countryCode: result.data.country_code,
    region: 'unknown',
    regionName: 'unknown',
    city: 'unknown',
    zip: undefined,
    lat: result.data.latitude,
    lon: result.data.longitude,
    timezone: result.data.timezone,
    isp: result.data.isp,
    org: result.data.organization,
    as: 'AS ' + result.data.asn + ' ' + result.data.asn_organization,
    query: ipOrDomain,
    source: 'ip.sb',
  }
}
