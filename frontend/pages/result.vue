<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="10">
        <div class="display-1">
          <span>恋人探し</span><span>アンケート</span> <span>結果</span>
        </div>
      </v-col>
    </v-row>

    <div v-if="error != null">
      <v-row justify="center">
        <v-col cols="10">
          <v-alert class="my-2 my-sm-8" color="error">
            <div class="mt-4 font-weight-bold text-center">
              <p>エラー: {{ error.message }}</p>
            </div>
          </v-alert>
        </v-col>

        <v-col cols="10" class="text-center">
          <v-btn to="/" nuxt class="mx-2" rounded x-large color="blue darken-2">
            トップに戻る
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <div v-else-if="!apiStatus.matched">
      <v-row justify="center">
        <v-col cols="10">
          <v-alert class="my-2 my-sm-8" color="error">
            <div class="mt-4 font-weight-bold text-center">
              <p>結果はまだありません</p>
              <p>結果発表時間: 15:00 ～ 24:00</p>
            </div>
          </v-alert>
        </v-col>

        <v-col cols="10" class="text-center">
          <v-btn to="/" nuxt class="mx-2" rounded x-large color="blue darken-2">
            トップに戻る
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <div v-else>
      <v-row justify="center">
        <v-col cols="10">
          <v-card
            v-if="result != null && result.partnerScore != null"
            class="mb-2"
          >
            <v-card-text>
              <div
                class="mt-4 text-center headline font-weight-bold text--primary"
              >
                <p>
                  {{ result.name }}（あなた）は
                  {{ result.partnerName }} と相性が良さそうです
                </p>
                <p>
                  スコア:
                  {{ result.partnerScore }}
                </p>
              </div>
              <div class="text-center">
                <p>スコアは値が小さいほど良いです</p>
              </div>
            </v-card-text>
          </v-card>

          <v-card
            v-else-if="result != null && result.name != null"
            class="mb-2"
          >
            <v-card-text
              class="text-center headline font-weight-bold text--primary"
            >
              <div class="mt-4">
                <p>
                  {{
                    result.name
                  }}（あなた）と相性が良さそうな人は見つかりませんでした...
                </p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="10" class="text-center">
          <v-btn to="/" nuxt class="mx-2" rounded x-large color="blue darken-2">
            トップに戻る
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script lang="ts">
import axios from 'axios'
import { Vue, Component } from 'vue-property-decorator'
import { APIStatus } from '~/models/APIStatus'
import { ErrorResponse } from '~/models/ErrorResponse'

type ResultResponse = {
  name: string
  partnerName: string
  partnerScore: number | null
}

@Component
export default class extends Vue {
  apiStatus: APIStatus = {
    canSubmit: false,
    matched: false,
    submitted: false
  }
  error: ErrorResponse | null = null
  result: ResultResponse | null = null

  async mounted() {
    const status = await axios.get('/api/status')
    this.apiStatus = status.data

    if (this.apiStatus.matched) {
      await axios
        .get('/api/results')
        .then((result) => {
          this.result = result.data
        })
        .catch((err) => {
          this.error = err.response.data
        })
    }
  }
}
</script>

<style scoped>
span {
  display: inline-block;
}
</style>
