import { http } from '@/utils/http'

/**
 * 发送短信验证码
 * @param phone 手机号
 * @returns
 */
export const sendCode = (phone) => {
  return http({
    method: 'POST',
    url: '/common/sendSms?phone=' + phone,
  })
}

/**
 * 手机号登录
 * @param phone ⼿机号
 * @param code 验证码
 * @returns
 */
export const phoneLogin = (phone, code) => {
  return http({
    method: 'POST',
    url: `/auth/login?phone=${phone}&code=${code}`,
  })
}

/**
 * 微信登录
 * @param code 微信登录code
 * @param encryptedData 加密数据
 * @param iv 加密算法的初始向量
 */
export const myWxLogin = (code, encryptedData, iv) => {
  return http({
    method: 'POST',
    url: `/auth/weChatLogin`,
    data: {
      code,
      encryptedData,
      iv,
    },
  })
}

/**
 * 退出登录
 * @return
 */
export const logout = () => {
  return http({
    method: 'POST',
    url: '/auth/logout',
  })
}

/**
 * 获取用户信息
 * @returns
 */
export const getUserInfo = () => {
  return http({
    method: 'GET',
    url: '/user/info',
  })
}
