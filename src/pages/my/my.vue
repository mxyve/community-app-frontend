<template>
  <view class="my">
    <view>用户信息：</view>
    <button size="mini" plain type="warn">清理用户信息</button>
    <uni-section title="设置" type="line">
      <uni-list>
        <uni-list-item showArrow title="去登录" />
      </uni-list>
    </uni-section>
  </view>

  <view class="father">
    father
    <view class="son">son</view>
  </view>
</template>

<script setup></script>

<style lang="scss" scoped>
.father {
  height: 200rpx;
  padding: 10rpx;
  background-color: #3fbbe5;
  .son {
    height: 100rpx;
    background-color: #8dc9dc;
  }
}
</style>
