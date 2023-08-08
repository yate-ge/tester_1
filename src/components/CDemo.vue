<script setup>
import { ref, watch } from 'vue';
import { Radio, RadioGroup, RadioButton, Checkbox, CheckboxGroup } from 'ant-design-vue'

const v1 = ref('0')
const v1Options = ['1', '2', '3']

watch(v1, (n) => {
  console.log('v1:', n)
})

</script>
<template>
  <div class="about">
    <RadioGroup v-model:value="v1" :options="v1Options" optionType="button" />
  </div>
</template>