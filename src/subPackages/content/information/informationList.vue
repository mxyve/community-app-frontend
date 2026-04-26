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
      <view class="title">资讯列表</view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-box">
        <image class="search-icon" src="/static/icon/search.png" mode="aspectFit"></image>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索资讯"
          placeholder-class="search-placeholder"
          confirm-type="search"
          @confirm="handleSearch"
        />
      </view>
    </view>

    <!-- 资讯列表 -->
    <scroll-view
      class="list-scroll"
      scroll-y
      @scrolltolower="loadMore"
      @refresherrefresh="onRefresh"
      :refresher-enabled="true"
      :refresher-triggered="refresherTriggered"
      :style="{ height: scrollHeight + 'px' }"
    >
      <view class="information-list" v-if="informationList.length > 0">
        <view
          class="information-card"
          v-for="item in informationList"
          :key="item.id"
          @click="goToDetail(item.id)"
        >
          <image
            class="card-cover"
            :src="item.coverImg"
            mode="aspectFill"
            v-if="item.coverImg"
          ></image>
          <view class="card-cover placeholder" v-else>
            <text class="placeholder-text">暂无封面</text>
          </view>
          <view class="card-info">
            <view class="card-title">{{ item.title }}</view>
            <view class="card-desc">{{ truncateContent(item.content) }}</view>
            <view class="card-footer">
              <text class="view-count">👁️ {{ item.viewCount || 0 }}次阅读</text>
              <text class="create-time">{{ formatDate(item.createTime) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else-if="!loading">
        <image class="empty-icon" src="/static/images/noData.png" mode="aspectFit"></image>
        <text class="empty-text">暂无资讯</text>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore && informationList.length > 0">
        <text>{{ loadingMore ? '加载中...' : '上拉加载更多' }}</text>
      </view>
      <view class="no-more" v-else-if="informationList.length > 0 && !hasMore">
        <text>没有更多了</text>
      </view>

      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading && informationList.length === 0">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getInformationPage } from '@/service/information'
import { getUserLocation } from '@/service/location'

const { safeAreaInsets, windowHeight } = uni.getSystemInfoSync()

// 计算滚动区域高度
const scrollHeight = ref(windowHeight - 200)

// 数据
const informationList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const pageNum = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')

// 用户位置
const userLocation = ref({
  province: '',
  city: '',
  district: '',
})

const refresherTriggered = ref(false)

// 下拉刷新方法
async function onRefresh() {
  if (refresherTriggered.value) return

  refresherTriggered.value = true

  try {
    // 重置分页参数
    pageNum.value = 1
    hasMore.value = true

    // 重新获取数据
    await fetchInformationList(false)
  } catch (error) {
    console.error('刷新失败', error)
    uni.showToast({
      title: '刷新失败',
      icon: 'none',
    })
  } finally {
    // 关闭刷新动画
    setTimeout(() => {
      refresherTriggered.value = false
    }, 500)
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

// 截取内容（去除HTML标签，显示前50字）
function truncateContent(content) {
  if (!content) return ''
  // 去除HTML标签
  const text = content.replace(/<[^>]+>/g, '')
  if (text.length <= 50) return text
  return text.substring(0, 50) + '...'
}

// 获取用户位置
async function fetchUserLocation() {
  try {
    const res = await getUserLocation()
    if (res.code === 200 && res.data) {
      userLocation.value = {
        province: res.data.province || '',
        city: res.data.city || '',
        district: res.data.district || '',
      }
    }
  } catch (e) {
    console.error('获取位置失败', e)
  }
}

// 获取资讯列表
async function fetchInformationList(isLoadMore = false) {
  if (loading.value || loadingMore.value) return

  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    pageNum.value = 1
    hasMore.value = true
  }

  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      title: searchKeyword.value,
      province: userLocation.value.province,
      city: userLocation.value.city,
      district: userLocation.value.district,
    }

    const res = await getInformationPage(params)

    if (res.code === 200 && res.data) {
      const records = res.data.records || []

      if (isLoadMore) {
        informationList.value = [...informationList.value, ...records]
      } else {
        informationList.value = records
      }

      // 判断是否还有更多
      const total = res.data.total || 0
      hasMore.value = informationList.value.length < total
    }
  } catch (error) {
    console.error('获取资讯列表失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 搜索
function handleSearch() {
  pageNum.value = 1
  fetchInformationList(false)
}

// 加载更多（滚动到底部触发）
function loadMore() {
  if (hasMore.value && !loadingMore.value && !loading.value) {
    pageNum.value++
    fetchInformationList(true)
  }
}

// 跳转详情
function goToDetail(id) {
  uni.navigateTo({
    url: `/subPackages/content/information/informationDetail?id=${id}`,
  })
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 生命周期
onMounted(async () => {
  await fetchUserLocation()
  await fetchInformationList()
})
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

.search-bar {
  padding: 20rpx 30rpx;

  .search-box {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 50rpx;
    padding: 16rpx 24rpx;
    box-shadow: 0 2rpx 10rpx rgba(196, 139, 102, 0.1);

    .search-icon {
      width: 32rpx;
      height: 32rpx;
      margin-right: 16rpx;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .search-placeholder {
      color: #999;
      font-size: 28rpx;
    }
  }
}

.list-scroll {
  flex: 1;
}

.information-list {
  padding: 0 30rpx;
}

.information-card {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

  .card-cover {
    width: 200rpx;
    height: 160rpx;
    flex-shrink: 0;
    display: block; /* 添加这一行 */
    vertical-align: middle; /* 添加这一行 */

    /* 如果有 image 标签需要单独处理 */
    image {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* placeholder 样式保持不变 */
    &.placeholder {
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;

      .placeholder-text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .card-info {
    flex: 1;
    padding: 16rpx 20rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .card-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #332b22;
      margin-bottom: 12rpx;
      line-height: 1.3;

      /* 两行自动省略 */
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2; /* 最多2行 */
      -webkit-box-orient: vertical;
    }

    .card-desc {
      font-size: 24rpx;
      color: #999;
      margin-bottom: 12rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.4;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .view-count {
        font-size: 22rpx;
        color: #c48b66;
      }

      .create-time {
        font-size: 22rpx;
        color: #bbb;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-icon {
    width: 200rpx;
    height: 200rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
    margin-top: 20rpx;
  }
}

.load-more,
.no-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: #999;
}

.loading-state {
  text-align: center;
  padding: 60rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>
