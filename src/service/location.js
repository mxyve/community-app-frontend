import { http } from '@/utils/http'

/**
 * 更新用户省市区位置
 */
export function updateLocation(data) {
  return http({
    method: 'POST',
    url: '/api/v1/location/updateLocation',
    data,
  })
}

// 获取最新位置
export function getUserLocation() {
  return http({
    method: 'GET',
    url: '/api/v1/location/getLocation',
  })
}
