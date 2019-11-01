<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col cols="12">
        <div class="mt-6 mt-sm-12">
          <p class="text-center title-text display-2">
            <span>恋人探し</span><span>アンケート</span>
          </p>
        </div>
      </v-col>

      <v-col cols="12">
        <v-alert class="my-2 my-sm-8" outlined color="warning">
          <div class="title text-center mb-6">
            注意!
          </div>
          <div>
            <p>質問には高専生向けのものが多く含まれます</p>
            <p>
              Cookieを用いて回答者を識別していますので、
              シークレットモードを使用したり、Cookieを無効化・削除などすると正しく機能しません
            </p>
            <p>
              同上の理由で、結果を見る際には解答時と同じブラウザをご利用ください
            </p>
          </div>
        </v-alert>
      </v-col>

      <v-col v-if="apiStatus.submitted && !apiStatus.matched" cols="12">
        <v-alert class="my-2 my-sm-8" color="info">
          <div class="mt-4 font-weight-bold text-center">
            <p>回答済みです</p>
            <p>結果発表までお待ち下さい</p>
            <p>発表時間: 15:00 ～ 24:00</p>
          </div>
        </v-alert>
      </v-col>

      <v-col
        v-else-if="
          !apiStatus.canSubmit && apiStatus.matched && !apiStatus.submitted
        "
        cols="12"
      >
        <v-alert class="my-2 my-sm-8" color="info">
          <div class="mt-4 font-weight-bold text-center">
            <p>未回答のため結果を見ることができません</p>
            <p>次回、ご参加いただけると幸いです</p>
            <p>日程: 11月2日/11月3日 09:00 ～ 15:00</p>
          </div>
        </v-alert>
      </v-col>

      <v-col v-else-if="!apiStatus.canSubmit && !apiStatus.matched" cols="12">
        <v-alert class="my-2 my-sm-8" color="error">
          <div class="mt-4 font-weight-bold text-center">
            <p>現在、回答時間外です</p>
            <p>回答時間: 09:00 ～ 15:00</p>
          </div>
        </v-alert>
      </v-col>

      <v-col cols="12">
        <div class="text-center">
          <v-btn
            v-if="apiStatus.matched"
            :disabled="!apiStatus.submitted"
            to="/result"
            nuxt
            class="mx-2"
            rounded
            x-large
            color="blue darken-2"
          >
            結果を見る
          </v-btn>

          <v-btn
            v-else-if="apiStatus.submitted"
            disabled
            class="mx-2"
            rounded
            x-large
            color="blue darken-2"
          >
            回答済み
          </v-btn>

          <v-btn
            v-else
            :disabled="!apiStatus.canSubmit"
            to="/questionnaire"
            nuxt
            class="mx-2"
            rounded
            x-large
            color="blue darken-2"
          >
            回答する
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import axios from 'axios'
import { Vue, Component } from 'vue-property-decorator'
import { APIStatus } from '~/models/APIStatus'

@Component
export default class extends Vue {
  apiStatus: APIStatus = {
    canSubmit: true,
    matched: false,
    submitted: false
  }

  mounted() {
    axios.get('/api/status').then((value) => {
      this.apiStatus = value.data
    })
  }
}
</script>

<style scoped>
span {
  display: inline-block;
}

.title-text {
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}
</style>
