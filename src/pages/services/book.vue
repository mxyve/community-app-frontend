<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <view class="header">
      <image class="back-icon" src="/static/icon/arrow_left.png" @click="goBack"></image>
      <view class="title">立即预约</view>
    </view>

    <!-- 服务信息 -->
    <view class="service-card">
      <text class="name">{{ serviceInfo.name }}</text>
      <text class="merchant">商家：{{ serviceInfo.merchantName }}</text>
      <text class="price">¥{{ serviceInfo.basePrice }}</text>
    </view>

    <!-- 预约时间 -->
    <view class="form-item" @click="showDateTimePicker = true">
      <text class="label">预约时间</text>
      <view class="picker">
        {{ form.serviceTime || '请选择预约时间' }}
      </view>
    </view>

    <!-- 省市区选择 -->
    <view class="form-item" @click="showAreaPicker = true">
      <text class="label">所在地区</text>
      <view class="picker">
        {{ areaText || '请选择省/市/区' }}
      </view>
    </view>

    <!-- 详细地址 -->
    <view class="form-item">
      <text class="label">详细地址</text>
      <input v-model="form.addressDetail" placeholder="门牌号、楼层等" class="input" />
    </view>

    <!-- 联系人 -->
    <view class="form-item">
      <text class="label">联系人</text>
      <input v-model="form.contactName" placeholder="请输入联系人" class="input" />
    </view>

    <!-- 联系电话 -->
    <view class="form-item">
      <text class="label">联系电话</text>
      <input v-model="form.contactPhone" placeholder="请输入联系电话" class="input" />
    </view>

    <!-- 备注 -->
    <view class="form-item">
      <text class="label">备注说明</text>
      <input v-model="form.userRemark" placeholder="选填" class="input" />
    </view>

    <!-- 提交 -->
    <view class="submit-btn" @click="submitOrder">提交预约订单</view>

    <!-- 省市区选择弹窗 -->
    <view class="area-picker-mask" v-if="showAreaPicker" @click="showAreaPicker = false">
      <view class="area-picker-container" @click.stop>
        <view class="area-picker-header">
          <text class="cancel" @click="showAreaPicker = false">取消</text>
          <text class="confirm" @click="confirmArea">确定</text>
        </view>
        <view class="area-picker-content">
          <scroll-view scroll-y class="area-column" :scroll-top="provinceScrollTop">
            <view
              v-for="(item, index) in provinceList"
              :key="item.code"
              class="area-item"
              :class="{ active: tempProvinceIndex === index }"
              @click="selectProvince(index)"
            >
              {{ item.name }}
            </view>
          </scroll-view>
          <scroll-view scroll-y class="area-column" :scroll-top="cityScrollTop">
            <view
              v-for="(item, index) in cityList"
              :key="item.code"
              class="area-item"
              :class="{ active: tempCityIndex === index }"
              @click="selectCity(index)"
            >
              {{ item.name }}
            </view>
          </scroll-view>
          <scroll-view scroll-y class="area-column" :scroll-top="districtScrollTop">
            <view
              v-for="(item, index) in districtList"
              :key="item.code"
              class="area-item"
              :class="{ active: tempDistrictIndex === index }"
              @click="selectDistrict(index)"
            >
              {{ item.name }}
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <!-- 日期时间选择弹窗 -->
    <view class="area-picker-mask" v-if="showDateTimePicker" @click="showDateTimePicker = false">
      <view class="area-picker-container" @click.stop>
        <view class="area-picker-header">
          <text class="cancel" @click="showDateTimePicker = false">取消</text>
          <text class="confirm" @click="confirmDateTime">确定</text>
        </view>
        <view class="datetime-picker-content">
          <picker-view
            class="datetime-picker-view"
            :value="datetimeValue"
            @change="onDatetimeChange"
          >
            <picker-view-column>
              <view v-for="(year, index) in years" :key="index" class="datetime-item"
                >{{ year }}年</view
              >
            </picker-view-column>
            <picker-view-column>
              <view v-for="(month, index) in months" :key="index" class="datetime-item"
                >{{ month }}月</view
              >
            </picker-view-column>
            <picker-view-column>
              <view v-for="(day, index) in days" :key="index" class="datetime-item"
                >{{ day }}日</view
              >
            </picker-view-column>
            <picker-view-column>
              <view v-for="(hour, index) in hours" :key="index" class="datetime-item"
                >{{ hour }}时</view
              >
            </picker-view-column>
            <picker-view-column>
              <view v-for="(minute, index) in minutes" :key="index" class="datetime-item"
                >{{ minute }}分</view
              >
            </picker-view-column>
          </picker-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { createOrder } from '@/service/services.js'
import { provinceData } from '@/common/area.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const serviceInfo = ref({})
const form = ref({
  serviceTime: '',
  province: '',
  city: '',
  district: '',
  addressDetail: '',
  contactName: '',
  contactPhone: '',
  userRemark: '',
})

// 日期时间选择相关
const showDateTimePicker = ref(false)
const datetimeValue = ref([0, 0, 0, 8, 0]) // [年,月,日,时,分]

// 生成年份（当前年到未来2年）
const currentYear = new Date().getFullYear()
const years = ref(Array.from({ length: 2 }, (_, i) => currentYear + i))

// 月份
const months = ref(Array.from({ length: 12 }, (_, i) => i + 1))

// 天数（动态计算）
const days = ref([])

// 小时（0-23）
const hours = ref(Array.from({ length: 24 }, (_, i) => i))

// 分钟（0-59）
const minutes = ref(Array.from({ length: 12 }, (_, i) => i * 5))

// 根据选中的年月更新天数
const updateDays = (yearIndex, monthIndex) => {
  const year = years.value[yearIndex]
  const month = months.value[monthIndex]
  const daysInMonth = new Date(year, month, 0).getDate()
  days.value = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 确保选中的天数不超过当月天数
  const currentDayIndex = datetimeValue.value[2]
  if (currentDayIndex >= daysInMonth) {
    datetimeValue.value[2] = daysInMonth - 1
  }
}

// picker-view 变化事件
const onDatetimeChange = (e) => {
  const val = e.detail.value
  datetimeValue.value = val

  // 更新天数
  updateDays(val[0], val[1])
}

// 确认时间选择
const confirmDateTime = () => {
  const val = datetimeValue.value
  const year = years.value[val[0]]
  const month = months.value[val[1]]
  const day = days.value[val[2]]
  const hour = hours.value[val[3]]
  const minute = minutes.value[val[4]]

  // 改为 ISO 格式：YYYY-MM-DDTHH:mm:00
  const dateTime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

  form.value.serviceTime = dateTime
  showDateTimePicker.value = false
}

// 省市区选择相关
const showAreaPicker = ref(false)
const provinceList = ref(provinceData)
const cityList = ref([])
const districtList = ref([])

// 临时选中的索引
const tempProvinceIndex = ref(-1)
const tempCityIndex = ref(-1)
const tempDistrictIndex = ref(-1)

// 临时选中的值
const tempProvince = ref(null)
const tempCity = ref(null)
const tempDistrict = ref(null)

// 滚动位置
const provinceScrollTop = ref(0)
const cityScrollTop = ref(0)
const districtScrollTop = ref(0)

// 显示的地区文本
const areaText = computed(() => {
  if (form.value.province && form.value.city && form.value.district) {
    return `${form.value.province} ${form.value.city} ${form.value.district}`
  }
  return ''
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  serviceInfo.value = JSON.parse(currentPage.options.service)

  // 初始化天数
  updateDays(0, 0)

  // 设置当前时间为默认值
  const now = new Date()
  const currentYearIndex = years.value.findIndex((y) => y === now.getFullYear())
  const currentMonthIndex = now.getMonth()
  const currentDay = now.getDate()
  const currentHour = now.getHours()
  const currentMinute = Math.floor(now.getMinutes() / 5) * 5

  datetimeValue.value = [
    currentYearIndex >= 0 ? currentYearIndex : 0,
    currentMonthIndex,
    currentDay - 1,
    currentHour,
    currentMinute / 5,
  ]
  updateDays(currentYearIndex >= 0 ? currentYearIndex : 0, currentMonthIndex)
})

// 选择省份
const selectProvince = (index) => {
  tempProvinceIndex.value = index
  tempProvince.value = provinceList.value[index]
  // 重置城市和区县
  tempCityIndex.value = -1
  tempDistrictIndex.value = -1
  tempCity.value = null
  tempDistrict.value = null

  // 获取城市列表
  const province = provinceList.value[index]
  if (province.children && province.children.length > 0) {
    cityList.value = province.children
    // 滚动到顶部
    cityScrollTop.value = 0
  } else {
    cityList.value = []
    districtList.value = []
  }
}

// 选择城市
const selectCity = (index) => {
  tempCityIndex.value = index
  tempCity.value = cityList.value[index]
  // 重置区县
  tempDistrictIndex.value = -1
  tempDistrict.value = null

  // 获取区县列表
  const city = cityList.value[index]
  if (city.children && city.children.length > 0) {
    districtList.value = city.children
    districtScrollTop.value = 0
  } else {
    districtList.value = []
  }
}

// 选择区县
const selectDistrict = (index) => {
  tempDistrictIndex.value = index
  tempDistrict.value = districtList.value[index]
}

// 确认选择
const confirmArea = () => {
  if (tempProvince.value) {
    form.value.province = tempProvince.value.name

    if (tempCity.value) {
      form.value.city = tempCity.value.name

      if (tempDistrict.value) {
        form.value.district = tempDistrict.value.name
      } else {
        form.value.district = ''
      }
    } else {
      form.value.city = ''
      form.value.district = ''
    }
  } else {
    uni.showToast({ title: '请选择省份', icon: 'none' })
    return
  }

  showAreaPicker.value = false
}

// 提交预约
const submitOrder = async () => {
  // 验证必填项
  if (!form.value.serviceTime) {
    uni.showToast({ title: '请选择预约时间', icon: 'none' })
    return
  }
  if (!form.value.province) {
    uni.showToast({ title: '请选择所在地区', icon: 'none' })
    return
  }
  if (!form.value.addressDetail) {
    uni.showToast({ title: '请输入详细地址', icon: 'none' })
    return
  }
  if (!form.value.contactName) {
    uni.showToast({ title: '请输入联系人', icon: 'none' })
    return
  }
  if (!form.value.contactPhone) {
    uni.showToast({ title: '请输入联系电话', icon: 'none' })
    return
  }

  const fullAddress =
    form.value.province + form.value.city + form.value.district + form.value.addressDetail

  await createOrder({
    merchantId: serviceInfo.value.merchantId,
    serviceId: serviceInfo.value.id,
    specId: 1,
    quantity: 1,
    unitPrice: serviceInfo.value.basePrice,
    totalAmount: serviceInfo.value.basePrice,
    payAmount: serviceInfo.value.basePrice,
    serviceTime: form.value.serviceTime,
    serviceAddress: fullAddress,
    contactName: form.value.contactName,
    contactPhone: form.value.contactPhone,
    userRemark: form.value.userRemark,
    status: 1,
  })

  uni.showToast({ title: '预约成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 1500)
}

const goBack = () => uni.navigateBack()
</script>

<style lang="scss" scoped>
.container {
  background: #f8f6f2;
  min-height: 100vh;
  padding-bottom: 120rpx;
}
.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  .back-icon {
    width: 36rpx;
    height: 36rpx;
  }
  .title {
    font-size: 45rpx;
    font-weight: bold;
    margin-left: 20rpx;
  }
}
.service-card {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  .name {
    font-size: 34rpx;
    font-weight: bold;
    display: block;
  }
  .merchant {
    font-size: 26rpx;
    color: #999;
    margin: 10rpx 0;
    display: block;
  }
  .price {
    font-size: 36rpx;
    color: #ff5f3f;
    font-weight: bold;
  }
}
.form-item {
  background: #fff;
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  .label {
    font-size: 28rpx;
    color: #333;
    display: block;
    margin-bottom: 10rpx;
  }
  .input {
    font-size: 28rpx;
    padding: 10rpx 0;
  }
  .picker {
    font-size: 28rpx;
    padding: 10rpx 0;
    color: #666;
  }
}
.submit-btn {
  background: #ff5f3f;
  color: #fff;
  text-align: center;
  padding: 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 50rpx;
  margin: 40rpx 20rpx;
}

// 省市区选择弹窗样式
.area-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.area-picker-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 30rpx 30rpx 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.area-picker-header {
  display: flex;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;

  .cancel {
    font-size: 28rpx;
    color: #999;
  }

  .confirm {
    font-size: 28rpx;
    color: #ff5f3f;
    font-weight: bold;
  }
}

.area-picker-content {
  display: flex;
  height: 500rpx;
}

.area-column {
  flex: 1;
  height: 500rpx;

  .area-item {
    padding: 20rpx;
    text-align: center;
    font-size: 28rpx;
    color: #333;

    &.active {
      color: #ff5f3f;
      background: #fff5f0;
      font-weight: bold;
    }
  }
}

.datetime-picker-content {
  padding: 20rpx 0;
}

.datetime-picker-view {
  height: 400rpx;
  width: 100%;

  picker-view-column {
    line-height: 60rpx;
    text-align: center;
  }
}

.datetime-item {
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  font-size: 28rpx;
  color: #333;
}
</style>
