<script setup>
import { ref } from 'vue';

let fs = []
for (let i=5; i<=50; i++) {
  fs.push(i)
}
const fonts = ref(fs)
</script>

<template>
  <div class="debug wrapper">
    <div class="wrapper-inner">
      <div class="info">
        <div v-for="f in fonts" :key="f" :style="`font-size: ${f}px;`">字号: {{ f }}px. 些又人回与理她前正已于动它有面两去来它有过它有感如事道它有想会给进动着它有中被种得正会无那人它有长行</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  // display: flex;
  // place-items: center;
  // flex-direction: row;
  overflow-y: auto;
  overflow-x: hidden;
}
.info {
  font-size: 20px;
  width: 10000px;
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