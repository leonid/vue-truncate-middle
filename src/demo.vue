<template>
  <div class="ma-24">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-input label="Text" v-model="text"></el-input>
      </el-col>
      <el-col :span="8">
        <el-input label="Start" v-model="start"></el-input>
      </el-col>
      <el-col :span="8">
        <el-input label="End" v-model="end"></el-input>
      </el-col>
    </el-row>
    <el-row>
      <el-col class="ma-24" :span="16">
        <input width="100%" type="range" v-model="width" name="quantity" min="10" max="100">
      </el-col>
    </el-row>
    <div :style="{width: width+'%', backgroundColor: '#fbed6b'}">
      <vue-truncate-middle
          :text="text"
          :start="start.toString()"
          :end="end.toString()"
          :ellipsis="ellipsis"
      ></vue-truncate-middle>
    </div>
  </div>
</template>

<script>
import VueTruncateMiddle from '../src/truncate-middle';

export default {
  components: {
    VueTruncateMiddle
  },

  data() {
    return {
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer risus ante, molestie eu ex suscipit, mollis pellentesque metus.',
      start: '/Lorem\\sipsum/',
      end: '5',
      ellipsis: '...',
      width: 50
    };
  },
}
</script>
