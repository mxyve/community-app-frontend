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
      <view class="title">我的评论</view>
    </view>

    <!-- 评论列表 -->
    <scroll-view
      scroll-y
      class="list-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view
        class="comment-item"
        v-for="item in commentList"
        :key="item.commentId"
        @click="goToArticle(item.articleId)"
      >
        <view class="article-title">《{{ item.articleTitle }}》</view>
        <view class="my-content">{{ item.content }}</view>
        <view class="create-time">{{ formatTime(item.createTime) }}</view>
      </view>

      <view class="empty" v-if="commentList.length === 0"> 还没有发布过评论～ </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { myCommentPage } from '@/service/community.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const commentList = ref([])

const refreshing = ref(false) // 下拉刷新状态

// 获取我的评论
const fetchMyComments = async () => {
  const res = await myCommentPage({
    current: 1,
    size: 20,
  })
  commentList.value = res.data.records || []
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await fetchMyComments()
  refreshing.value = false
}

// 跳转到文章详情
const goToArticle = (articleId) => {
  uni.navigateTo({
    url: `/subPackages/community/detail?articleId=${articleId}`,
  })
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchMyComments()
})

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  background: #f8f6f2;
  min-height: 100vh;
  padding-bottom: 20rpx;
  overflow-x: hidden;
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

.list-scroll {
  padding: 8rpx 30rpx 20rpx;
  height: calc(100vh - 100rpx);
  width: 100%;
  box-sizing: border-box;
}

.comment-item {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 24rpx;
  border: 2rpx solid #f0e4d8;
  margin-bottom: 18rpx;
  width: 100%;
  box-sizing: border-box;
}

.article-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #b86b3f;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  box-sizing: border-box;
}

.my-content {
  font-size: 30rpx;
  color: #4a3a2e;
  line-height: 1.5;
  margin-bottom: 16rpx;
  word-break: break-all;
  overflow-wrap: break-word;
}

.create-time {
  font-size: 24rpx;
  color: #c0a994;
  text-align: right;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #8f7a68;
  font-weight: 500;
  font-size: 28rpx;
}
</style>
