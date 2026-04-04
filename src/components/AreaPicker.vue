<template>
  <!-- 点击选择区域 -->
  <view class="location-selector" @click="showPicker = true">
    <view class="location-left">
      <text class="location-icon">📍</text>
      <text class="location-text">{{ displayText }}</text>
    </view>
    <text class="location-arrow">›</text>
  </view>

  <!-- 省市区三级联动弹窗 -->
  <view class="area-picker-mask" v-if="showPicker" @click="showPicker = false">
    <view class="area-picker-container" @click.stop>
      <view class="area-picker-header">
        <text class="cancel" @click="showPicker = false">取消</text>
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
</template>

<script setup>
import { ref } from 'vue'
import { provinceData } from '@/common/area.js'

const emit = defineEmits(['change'])
const props = defineProps({
  value: {
    type: Object,
    default: () => ({ province: '', city: '', area: '' }),
  },
  placeholder: {
    type: String,
    default: '点击选择地区',
  },
})

const showPicker = ref(false)
const provinceList = ref(provinceData)
const cityList = ref([])
const districtList = ref([])

const tempProvinceIndex = ref(-1)
const tempCityIndex = ref(-1)
const tempDistrictIndex = ref(-1)

const tempProvince = ref(null)
const tempCity = ref(null)
const tempDistrict = ref(null)

const provinceScrollTop = ref(0)
const cityScrollTop = ref(0)
const districtScrollTop = ref(0)

const displayText = ref(props.placeholder)

// 选择省份
const selectProvince = (index) => {
  tempProvinceIndex.value = index
  tempProvince.value = provinceList.value[index]
  tempCityIndex.value = -1
  tempDistrictIndex.value = -1
  tempCity.value = null
  tempDistrict.value = null

  const province = provinceList.value[index]
  if (province.children?.length) {
    cityList.value = province.children
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
  tempDistrictIndex.value = -1
  tempDistrict.value = null

  const city = cityList.value[index]
  if (city.children?.length) {
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
  if (!tempProvince.value) {
    uni.showToast({ title: '请选择省份', icon: 'none' })
    return
  }
  const result = {
    province: tempProvince.value?.name || '',
    city: tempCity.value?.name || '',
    area: tempDistrict.value?.name || '',
  }
  displayText.value = [result.province, result.city, result.area].filter(Boolean).join(' ')
  emit('change', result)
  showPicker.value = false
}
</script>

<style scoped>
.location-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f6f2;
  padding: 24rpx 30rpx;
  border-radius: 30rpx;
  border: 2rpx solid #f0e4d8;
  margin-top: 10rpx;
}
.location-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.location-icon {
  font-size: 36rpx;
}
.location-text {
  font-size: 30rpx;
  color: #4a3a2e;
}
.location-arrow {
  font-size: 48rpx;
  color: #b86b3f;
}

.area-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
.area-picker-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 30rpx 30rpx 0 0;
}
.area-picker-header {
  display: flex;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}
.cancel {
  font-size: 28rpx;
  color: #999;
}
.confirm {
  font-size: 28rpx;
  color: #ff5f3f;
  font-weight: bold;
}
.area-picker-content {
  display: flex;
  height: 500rpx;
}
.area-column {
  flex: 1;
}
.area-item {
  padding: 20rpx;
  text-align: center;
  font-size: 28rpx;
}
.area-item.active {
  color: #ff5f3f;
  background: #fff5f0;
  font-weight: bold;
}
</style>
