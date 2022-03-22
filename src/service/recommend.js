import { get } from './base'

export function getRecommend () {
  console.log('getRecommend')
  return get('/api/getRecommend')
}
