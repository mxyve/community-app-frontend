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
      <view class="title">服务评价</view>
    </view>

    <!-- 评价列表 -->
    <scroll-view
      class="comment-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refresherTriggered"
      @refresherrefresh="onRefresh"
    >
      <view class="comment-list">
        <view class="comment-item" v-for="item in commentList" :key="item.id">
          <view class="user-info">
            <image class="avatar" :src="item.avatar" mode="aspectFill"></image>
            <view class="name-box">
              <text class="nickname">{{ item.nickName }}</text>
              <view class="star-box" v-if="item.star">
                <text class="star" v-for="n of item.star" :key="n">★</text>
              </view>
            </view>
          </view>

          <view class="content">{{ item.content }}</view>
          <image v-if="item.img" :src="item.img" class="comment-image" mode="aspectFill" />
          <view class="time">{{ formatTime(item.createTime) }}</view>

          <!-- 右下角 回复按钮 -->
          <view class="reply-btn" @click="goToCommentDetail(item.id)">回复</view>
        </view>

        <view class="empty" v-if="commentList.length === 0"> 暂无评价 </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getServiceCommentPage } from '@/service/services.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

const serviceId = ref(null)
const commentList = ref([])
const refresherTriggered = ref(false)

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  serviceId.value = currentPage.options.id
  if (serviceId.value) {
    loadCommentList()
  }
})

// 加载评价列表
const loadCommentList = async () => {
  const res = await getServiceCommentPage({
    serviceId: serviceId.value,
    current: 1,
    size: 50,
  })
  commentList.value = res.data.records || []
}

// 跳转到评论详情
const goToCommentDetail = (commentId) => {
  uni.navigateTo({
    url: `/subPackages/services/comment/commentDetail?commentId=${commentId}&serviceId=${serviceId.value}`,
  })
}

const goBack = () => uni.navigateBack()

// 格式化时间 去掉 T
const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 16)
}

// 下拉刷新
const onRefresh = async () => {
  if (refresherTriggered.value) return
  refresherTriggered.value = true
  try {
    await loadCommentList()
  } catch (err) {
    uni.showToast({ title: '刷新失败', icon: 'none' })
  } finally {
    setTimeout(() => (refresherTriggered.value = false), 500)
  }
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
  padding-bottom: 120rpx;
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

/* 评价列表 */
.comment-list {
  padding: 30rpx;
}
.comment-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 16rpx;
}
.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #f5f5f5;
}
.name-box {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.nickname {
  font-size: 30rpx;
  font-weight: bold;
}
.star-box {
  display: flex;
  gap: 4rpx;
}
.star {
  color: #ff9500;
  font-size: 24rpx;
}
.content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 10rpx;
}
.time {
  font-size: 24rpx;
  color: #999;
}
.empty {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}
.reply-btn {
  text-align: right;
  font-size: 24rpx;
  color: #b86b3f;
  margin-top: 10rpx;
}

.comment-scroll {
  flex: 1;
  min-height: 0;
}

.comment-image {
  width: 320rpx;
  height: 320rpx;
  border-radius: 16rpx;
  margin: 15rpx 0;
}
</style>
