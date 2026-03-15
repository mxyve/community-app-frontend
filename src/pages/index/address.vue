<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 -->
    <view class="header">
      <image
        class="back-icon"
        src="/static/icon/arrow_left.png"
        mode="aspectFit"
        @click="goBack"
      ></image>
      <view class="title">选择位置</view>
    </view>

    <!-- 搜索框 -->
    <view class="search-box">
      <image class="search-icon" src="/static/icon/search.png" mode="aspectFit"></image>
      <input class="search-input" placeholder="搜索城市/区/街道..." />
    </view>

    <!-- 快速定位 -->
    <view class="quick-locate" @click="quickLocate">
      <image class="locate-icon" src="/static/icon/location.png" mode="aspectFit"></image>
      <text>快速定位</text>
    </view>

    <!-- 最近使用 -->
    <view class="recent-section">
      <view class="section-title">最近使用</view>
      <view class="recent-item" v-for="item in recentList" :key="item.id">
        <image class="item-icon" :src="item.icon" mode="aspectFit"></image>
        <text class="item-name">{{ item.name }}</text>
        <text class="item-tag">{{ item.tag }}</text>
        <text class="select-btn" @click="selectRecent(item)">选择</text>
      </view>
    </view>

    <!-- 省市区列表 -->
    <view class="area-list">
      <view
        class="province-item"
        v-for="province in provinceList"
        :key="province.code"
        :id="`letter-${province.firstLetter}`"
      >
        <view class="province-row" @click="toggleProvince(province)">
          <text class="province-name">{{ province.name }}</text>
          <text class="pinyin">{{ province.pinyin }}</text>
          <text class="province-tag" v-if="province.isMunicipality">(直辖市)</text>
          <text class="select-all" @click.stop="selectProvince(province)">全省</text>
        </view>
        <!-- 城市列表 -->
        <view class="city-list" v-if="province.expanded">
          <view class="city-item" v-for="city in province.children" :key="city.code">
            <view class="city-row" @click="toggleCity(city)">
              <text class="city-name">{{ city.name }}</text>
              <text class="select-all" @click.stop="selectCity(province, city)">全市</text>
            </view>
            <!-- 区域列表（横排） -->
            <view class="district-list" v-if="city.expanded">
              <view
                class="district-item"
                :class="{ active: selectedDistrict === district }"
                v-for="district in city.children"
                :key="district.code"
                @click="selectDistrict(province, city, district)"
              >
                {{ district.name }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 右侧字母索引 -->
    <view class="index-bar">
      <text
        class="index-item"
        :class="{ active: currentIndex === letter }"
        v-for="letter in indexLetters"
        :key="letter"
        @click="scrollToLetter(letter)"
      >
        {{ letter }}
      </text>
    </view>

    <!-- 底部悬浮按钮 -->
    <view class="fixed-bottom">
      <view class="selected-info" v-if="selectedFullText">
        {{ selectedFullText }}
      </view>
      <view class="btn-group">
        <view class="clear-btn" @click="clearSelection">清空</view>
        <view class="confirm-btn" @click="confirmSelection">确认选择</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { provinceData } from '@/common/area.js' // 你的全国省市区数据

const { safeAreaInsets } = uni.getSystemInfoSync()

// 状态管理
const provinceList = ref([])
const recentList = ref([
  { id: 1, name: '浙江省', tag: '省', icon: '/static/images/diqiu.png' },
  { id: 2, name: '杭州市', tag: '市', icon: '/static/icon/city.png' },
  { id: 3, name: '滨江区', tag: '区', icon: '/static/icon/pin.png' },
])
const selectedProvince = ref(null)
const selectedCity = ref(null)
const selectedDistrict = ref(null)
const indexLetters = ref('ABCDEFGHJKLMNPQRSTWXYZ'.split(''))
const currentIndex = ref('A')

// 底部新增
const selectedFullText = computed(() => {
  let text = ''
  if (selectedProvince.value) text += selectedProvince.value.name
  if (selectedCity.value) text += ' · ' + selectedCity.value.name
  if (selectedDistrict.value) text += ' · ' + selectedDistrict.value.name
  return text
})

// 初始化数据
onMounted(() => {
  provinceList.value = provinceData
    .map((p) => ({ ...p, expanded: false }))
    // 按首字母 A-Z 排序
    .sort((a, b) => a.firstLetter.localeCompare(b.firstLetter))
})

function goBack() {
  uni.navigateBack()
}

// 展开/收起省份
function toggleProvince(province) {
  province.expanded = !province.expanded
}

// 展开/收起城市
function toggleCity(city) {
  city.expanded = !city.expanded
}

// 选择省份
function selectProvince(province) {
  selectedProvince.value = province
  selectedCity.value = null
  selectedDistrict.value = null
}

// 选择城市
function selectCity(province, city) {
  selectedProvince.value = province
  selectedCity.value = city
  selectedDistrict.value = null
}

// 选择区域
function selectDistrict(province, city, district) {
  selectedProvince.value = province
  selectedCity.value = city
  selectedDistrict.value = district
}

// 快速定位
function quickLocate() {
  uni.getLocation({
    success: (res) => {
      uni.showToast({ title: '定位成功', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '定位失败', icon: 'none' })
    },
  })
}

// 选择最近记录
function selectRecent(item) {
  if (item.tag === '省') {
    selectedProvince.value = provinceList.value.find((p) => p.name === item.name)
    selectedCity.value = null
    selectedDistrict.value = null
  } else if (item.tag === '市') {
    const province = provinceList.value.find((p) => p.children?.some((c) => c.name === item.name))
    selectedProvince.value = province
    selectedCity.value = { name: item.name }
    selectedDistrict.value = null
  } else {
    const city = provinceList.value
      .flatMap((p) => p.children || [])
      .find((c) => c.children?.some((d) => d.name === item.name))
    const province = provinceList.value.find((p) => p.children?.includes(city))
    selectedProvince.value = province
    selectedCity.value = city
    selectedDistrict.value = { name: item.name }
  }
}

// 实现字母跳转
function scrollToLetter(letter) {
  currentIndex.value = letter
  uni
    .createSelectorQuery()
    .select(`#letter-${letter}`)
    .boundingClientRect((rect) => {
      if (!rect) return
      uni.pageScrollTo({
        scrollTop: rect.top - 120,
        duration: 200,
      })
    })
    .exec()
}

// 确认选择
function confirmSelection() {
  let addressText = ''
  if (selectedProvince.value) addressText += selectedProvince.value.name
  if (selectedCity.value) addressText += ' · ' + selectedCity.value.name
  if (selectedDistrict.value) addressText += ' · ' + selectedDistrict.value.name

  uni.$emit('addressSelected', {
    province: selectedProvince.value?.name || '',
    city: selectedCity.value?.name || '',
    district: selectedDistrict.value?.name || '',
    fullText: addressText || '请选择地区',
  })
  uni.navigateBack()
}

// 清空选择
function clearSelection() {
  selectedProvince.value = null
  selectedCity.value = null
  selectedDistrict.value = null
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  gap: 20rpx;
  border-bottom: 2rpx solid #f0d4b8;

  .back-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .title {
    font-size: 45rpx;
    color: #332b22;
    font-weight: bold;
  }
}

.search-box {
  display: flex;
  align-items: center;
  margin: 20rpx 30rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 40rpx;
  .search-icon {
    width: 32rpx;
    height: 32rpx;
    margin-right: 20rpx;
  }
  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: #665c52;
  }
}

.quick-locate {
  display: flex;
  align-items: center;
  margin: 0 30rpx 20rpx;
  padding: 20rpx 30rpx;
  background: #fff;
  border-radius: 40rpx;
  width: fit-content;
  .locate-icon {
    width: 32rpx;
    height: 32rpx;
    margin-right: 20rpx;
  }
  text {
    font-size: 28rpx;
    color: #332b22;
  }
}

.recent-section {
  margin: 0 30rpx 30rpx;
  .section-title {
    font-size: 32rpx;
    color: #332b22;
    margin-bottom: 20rpx;
  }
  .recent-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx dashed #f0d4b8;
    .item-icon {
      width: 40rpx;
      height: 40rpx;
      margin-right: 20rpx;
    }
    .item-name {
      flex: 1;
      font-size: 30rpx;
      color: #332b22;
    }
    .item-tag {
      font-size: 24rpx;
      color: #998b7d;
      margin-right: 30rpx;
    }
    .select-btn {
      font-size: 28rpx;
      color: #f0a070;
    }
  }
}

.area-list {
  margin: 0 30rpx;
  .province-item {
    margin-bottom: 30rpx;
    .province-row {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      .province-name {
        font-size: 36rpx;
        color: #332b22;
        font-weight: bold;
        margin-right: 20rpx;
      }
      .pinyin {
        font-size: 24rpx;
        color: #998b7d;
        margin-right: 20rpx;
      }
      .province-tag {
        font-size: 24rpx;
        color: #998b7d;
      }
      .select-all {
        margin-left: auto;
        font-size: 28rpx;
        color: #f0a070;
        padding: 8rpx 20rpx;
        background: #f2e8db;
        border-radius: 20rpx;
      }
    }
    .city-list {
      margin-left: 40rpx;
      .city-item {
        .city-row {
          display: flex;
          align-items: center;
          padding: 15rpx 0;
          .city-name {
            font-size: 32rpx;
            color: #332b22;
          }
          .select-all {
            margin-left: auto;
            font-size: 26rpx;
            color: #f0a070;
            padding: 6rpx 16rpx;
            background: #f2e8db;
            border-radius: 16rpx;
          }
        }
        .district-list {
          display: flex;
          flex-wrap: wrap;
          gap: 20rpx;
          margin: 15rpx 0 20rpx 40rpx;
          .district-item {
            padding: 12rpx 24rpx;
            background: #fff;
            border-radius: 24rpx;
            font-size: 26rpx;
            color: #665c52;
            &.active {
              background: #f0a070;
              color: #fff;
            }
          }
        }
      }
    }
  }
}

.index-bar {
  position: fixed;
  right: 10rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  .index-item {
    font-size: 24rpx;
    color: #998b7d;
    text-align: center;
    &.active {
      color: #f0a070;
      font-weight: bold;
    }
  }
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  padding: 30rpx 30rpx 40rpx;
}
.selected-info {
  text-align: center;
  font-size: 28rpx;
  color: #f0a070;
  font-weight: bold;
  margin-bottom: 20rpx;
}
.btn-group {
  display: flex;
  gap: 20rpx;
}
.clear-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  border: 2rpx solid #f0a070;
  color: #f0a070;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}
.confirm-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  background: #f0a070;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}
</style>
