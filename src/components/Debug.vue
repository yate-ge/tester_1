<script setup>
import { ref } from 'vue';

const widthIn = ref(window.innerWidth)
const heightIn = ref(window.innerHeight)

const widthOut = ref(window.outerWidth)
const heightOut = ref(window.outerHeight)
</script>

<template>
  <div class="debug wrapper">
    <div class="wrapper-inner">
      <div>Debug</div>
      <div class="info">
        <div>
          inner width: {{ widthIn }}, height: {{ heightIn }}
        </div>
        <div>
          outer width: {{ widthOut }}, height: {{ heightOut }}
        </div>
        <!-- <div id="d1"></div>
        <div id="d2"></div>
        <div id="d3"></div>
        <div id="d4"></div> -->
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  place-items: center;
  flex-direction: row;
  .wrapper-inner {
    margin: 0 auto; // 居中
  }
}
.info {
  font-size: 20px;
}
#d1 {
  width: 100px;
  height: 50px;
  background-color: #f00;
}
#d2 {
  width: 200px;
  height: 50px;
  background-color: #0f0;
}
#d3 {
  width: 400px;
  height: 50px;
  background-color: #00f;
}
#d4 {
  width: 800px;
  height: 50px;
  background-color: #ff0;
}
#d5 {
  width: 1600px;
  height: 50px;
  background-color: #0ff;
}
</style>