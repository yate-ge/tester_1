<script setup>
import { ref, defineEmits} from 'vue'
import { Button, Input, InputNumber, Select, SelectOption } from 'ant-design-vue'

const emit = defineEmits(['start-test'])

// const versions = ref(['1', '2', '3'])
const sexs = ref(['男', '女'])
const sex = ref('男')
const id = ref('')
const age = ref(20)
const requiredIdClass = ref('')

function startTest() {
  if (!id.value) {
    requiredIdClass.value = 'required'
    return
  }
  emit('start-test', '1', id.value, age.value, sex.value)
  setTimeout(() => {
    id.value = ''
  }, 5e3)
}
  
</script>

<template>
  <div class="login wrapper">
    <div class="content">
      <div class="line">
        <span class="left">被试编号:</span>
        <Input :class="'right ' + requiredIdClass " size="small" v-model:value="id" />
      </div>
      <div class="line">
        <span class="left">年龄:</span>
        <InputNumber class="right" size="small" v-model:value="age" />
      </div>
      <div class="line">
        <span class="left">性别:</span>
        <Select class="right" v-model:value="sex" size="small">
          <SelectOption v-for="v in sexs" :key="v" :value="v">{{ v }}</SelectOption>
        </Select>
      </div>
      <Button class="btn" size="small" @click="startTest">开始测试</Button>
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
  .content {
    margin: 0 auto; // 居中
  }
}
.content {
  text-align: center;
  .line {
    margin-bottom: 30px;
  }
  .left {
    display: inline-block;
    width: 60px;
    text-align: right;
    margin-right: 5px;
  }
  .right {
    display: inline-block;
    width: 100px;
  }
  .required{
    border: 1px solid red;
  }

  :deep(.ant-select-selection-item) {
    text-align: left;
  }
  .btn {
    margin-top: 60px;
    display: inline-block;
    width: 120px;
    background-color: black;
    color: white;
    height: 30px;
  }
}
</style>