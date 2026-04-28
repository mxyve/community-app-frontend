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
      <view class="title">评价详情</view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 评论列表（树形结构） -->
      <view class="comment-section">
        <view class="comment-list">
          <view class="comment-item" v-for="item in commentList" :key="item.id">
            <!-- 父评论（服务评价） -->
            <view class="comment-main">
              <image class="comment-avatar" :src="item.avatar" mode="aspectFill"></image>
              <view class="comment-content">
                <view class="comment-user">{{ item.nickName }}</view>

                <!-- 星级 -->
                <view class="star-box" v-if="item.star">
                  <text class="star" v-for="n of item.star" :key="n">★</text>
                </view>

                <view class="comment-text">{{ item.content }}</view>
                <image v-if="item.img" :src="item.img" class="comment-image" mode="aspectFill" />
                <view class="comment-time">{{ formatTime(item.createTime) }}</view>

                <view class="comment-meta">
                  <text class="meta-reply" @click="handleReplyComment(item)">回复</text>
                  <text
                    class="meta-delete"
                    v-if="item.userId === userInfo?.userId"
                    @click="handleDeleteComment(item.id)"
                    >删除</text
                  >
                </view>
              </view>
            </view>

            <!-- 子评论（回复） -->
            <view class="child-comment-list" v-if="item.childList && item.childList.length">
              <view class="child-comment-item" v-for="child in item.childList" :key="child.id">
                <image class="child-avatar" :src="child.avatar" mode="aspectFill"></image>
                <view class="child-content">
                  <view class="child-user">
                    {{ child.nickName }}
                    <text v-if="child.toUserId && child.toUserId > 0" class="reply-at">
                      @ {{ child.toUserName || '用户' }}
                    </text>
                  </view>
                  <view class="child-text">{{ child.content }}</view>
                  <view class="comment-time">{{ formatTime(child.createTime) }}</view>
                  <view class="child-meta">
                    <text class="meta-reply" @click="handleReplyComment(child)">回复</text>
                    <text
                      class="meta-delete"
                      v-if="child.userId === userInfo?.userId"
                      @click="handleDeleteComment(child.id)"
                      >删除</text
                    >
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 回复弹窗 -->
    <view class="reply-mask" v-if="showReplyPopup" @click="closeReplyPopup">
      <view class="reply-popup-container" @click.stop>
        <view class="reply-popup-header">
          <text class="reply-popup-title">回复：{{ replyToComment?.nickName || '' }}</text>
          <text class="reply-popup-close" @click="closeReplyPopup">取消</text>
        </view>
        <view class="reply-popup-content">
          <textarea
            class="reply-popup-textarea"
            v-model="replyContent"
            :placeholder="`回复 @${replyToComment?.nickName || '对方'}`"
            auto-height
            focus
          />
        </view>
        <view class="reply-popup-footer">
          <view class="reply-popup-btn" @click="handlePublishReply">发送</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  getServiceCommentPage,
  createServiceReview,
  deleteServiceComment,
} from '@/service/services.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

const commentId = ref(null)
const serviceId = ref(null)
const commentList = ref([])
const userInfo = ref(uni.getStorageSync('userInfo') || {})

// 回复弹窗
const showReplyPopup = ref(false)
const replyToComment = ref(null)
const replyContent = ref('')

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  commentId.value = currentPage.options.commentId
  serviceId.value = currentPage.options.serviceId

  if (serviceId.value) {
    loadCommentTree()
  }
})

// 加载树形评价列表
const loadCommentTree = async () => {
  const res = await getServiceCommentPage({
    serviceId: serviceId.value,
    current: 1,
    size: 100,
  })
  const allList = res.data.records || []

  // 只显示当前点开的评论（后端已经自动过滤 deleted=0 的子评论）
  commentList.value = allList.filter((item) => item.id == commentId.value)

  // 强制刷新视图
  commentList.value = [...commentList.value]
}

// 回复评论
const handleReplyComment = (item) => {
  replyToComment.value = item
  replyContent.value = ''
  showReplyPopup.value = true
}

// 发布回复
const handlePublishReply = async () => {
  if (!replyContent.value.trim()) {
    return uni.showToast({ title: '请输入内容', icon: 'none' })
  }
  if (!replyToComment.value) return
  console.log('replyToComment.value.merchantId', replyToComment.value.merchantId)

  try {
    await createServiceReview({
      serviceId: serviceId.value,
      merchantId: replyToComment.value.merchantId,
      content: replyContent.value,
      parentCommentId: replyToComment.value.id,
      toUserId: replyToComment.value.userId,
      star: null,
      orderId: null,
    })
    uni.showToast({ title: '回复成功', icon: 'success' })
    closeReplyPopup()
    loadCommentTree()
  } catch (err) {
    uni.showToast({ title: '回复失败', icon: 'none' })
  }
}

// 删除评论
const handleDeleteComment = async (id) => {
  // 必须加判断，防止 id 不存在
  if (!id) {
    uni.showToast({ title: '评论ID不存在', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 调用你已有的删除接口
          await deleteServiceComment(id)
          uni.showToast({ title: '删除成功', icon: 'success' })

          // 重新加载列表（必须加，页面才会刷新）
          loadCommentTree()
        } catch (err) {
          console.error('删除失败：', err)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}

// 关闭弹窗
const closeReplyPopup = () => {
  showReplyPopup.value = false
  replyToComment.value = null
  replyContent.value = ''
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 16)
}

const goBack = () => uni.navigateBack()
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

/* 评论结构 */
.comment-section {
  padding: 30rpx;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}
.comment-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  border: 2rpx solid #f0e4d8;
}
.comment-main {
  display: flex;
  gap: 20rpx;
}
.comment-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fde6d2;
}
.comment-content {
  flex: 1;
}
.comment-user {
  font-size: 30rpx;
  font-weight: 600;
  color: #4a3a2e;
  margin-bottom: 10rpx;
}

/* 星级 */
.star-box {
  display: flex;
  gap: 4rpx;
  margin-bottom: 10rpx;
}
.star {
  color: #ff9500;
  font-size: 24rpx;
}

.comment-text {
  font-size: 30rpx;
  color: #5f4e40;
  line-height: 1.6;
  margin-bottom: 10rpx;
}
.comment-time {
  font-size: 24rpx;
  color: #c0a994;
  margin-bottom: 10rpx;
}
.comment-meta {
  display: flex;
  gap: 30rpx;
  font-size: 26rpx;
  color: #8f7a68;
}
.meta-reply {
  color: #b86b3f;
}
.meta-delete {
  color: #d65757;
}

/* 子评论 */
.child-comment-list {
  margin-top: 20rpx;
  padding-left: 92rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.child-comment-item {
  display: flex;
  gap: 16rpx;
}
.child-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #fde6d2;
}
.child-content {
  flex: 1;
  background: #f8f6f2;
  padding: 20rpx;
  border-radius: 20rpx;
}
.child-user {
  font-size: 28rpx;
  font-weight: 600;
  color: #4a3a2e;
  margin-bottom: 8rpx;
}
.child-text {
  font-size: 28rpx;
  color: #5f4e40;
  line-height: 1.6;
  margin-bottom: 8rpx;
}
.child-meta {
  display: flex;
  gap: 24rpx;
  font-size: 24rpx;
  color: #8f7a68;
}
.reply-at {
  color: #b86b3f;
  margin-left: 8rpx;
  font-size: 26rpx;
}

/* 回复弹窗 */
.reply-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}
.reply-popup-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 30rpx 30rpx 0 0;
  padding: 30rpx;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
.reply-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0e4d8;
}
.reply-popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #4a3a2e;
}
.reply-popup-close {
  font-size: 28rpx;
  color: #999;
}
.reply-popup-content {
  padding: 30rpx 0;
}
.reply-popup-textarea {
  width: 100%;
  min-height: 150rpx;
  font-size: 30rpx;
  padding: 20rpx;
  background: #f8f6f2;
  border-radius: 20rpx;
  box-sizing: border-box;
}
.reply-popup-footer {
  padding-top: 20rpx;
}
.reply-popup-btn {
  background: #b86b3f;
  color: #fff;
  text-align: center;
  padding: 24rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}
.comment-image {
  width: 320rpx;
  height: 320rpx;
  border-radius: 20rpx;
  margin: 15rpx 0;
}
</style>
