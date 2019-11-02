<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="10">
        <div class="display-1">
          <span>恋人探し</span><span>アンケート</span>
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

    <div v-else-if="submitted">
      <v-row justify="center">
        <v-col cols="10">
          <v-alert class="my-2 my-sm-8" type="success">
            <div class="mt-4 font-weight-bold text-center">
              <p>回答を送信しました</p>
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

    <div v-else-if="apiStatus.submitted">
      <v-row justify="center">
        <v-col cols="10">
          <v-alert class="my-2 my-sm-8" color="info">
            <div class="mt-4 font-weight-bold text-center">
              <p>回答済みです</p>
              <p>結果発表までお待ち下さい</p>
              <p>発表時間: 15:00 ～ 24:00</p>
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

    <div v-else-if="!apiStatus.canSubmit">
      <v-row justify="center">
        <v-col cols="10">
          <v-alert class="my-2 my-sm-8" color="error">
            <div class="mt-4 font-weight-bold text-center">
              <p>現在、回答時間外です</p>
              <p>回答時間: 09:00 ～ 15:00</p>
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
          <v-card class="mb-2">
            <v-card-title>あなたについて</v-card-title>
            <v-card-text>
              <v-form ref="form" lazy-validation>
                <v-text-field
                  id="name"
                  v-model="name"
                  label="おなまえ（ニックネーム）"
                  :counter="30"
                  :rules="nameRules"
                />

                <v-radio-group v-model="gender" class="mt-2" label="性別" row>
                  <v-radio label="男" :value="enumGender.MALE" />
                  <v-radio label="女" :value="enumGender.FEMALE" />
                </v-radio-group>

                <v-slider
                  v-model="age"
                  class="mt-2"
                  label="年齢"
                  :min="0"
                  :max="100"
                  thumb-label="always"
                  thumb-size="24"
                />
              </v-form>
            </v-card-text>
          </v-card>

          <v-card class="mb-2">
            <v-card-title>相手について</v-card-title>
            <v-card-text>
              <v-form>
                <v-radio-group v-model="partnerGender" label="性別" row>
                  <v-radio label="男" :value="enumGender.MALE" />
                  <v-radio label="女" :value="enumGender.FEMALE" />
                </v-radio-group>

                <v-range-slider
                  v-model="partnerAgeRange"
                  class="mt-2"
                  label="年齢の範囲"
                  :min="0"
                  :max="100"
                  thumb-label="always"
                  thumb-size="24"
                />
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-col cols="10">
          <v-card
            v-for="(question, index) in questions"
            :key="index"
            class="mb-2"
          >
            <v-card-title>第{{ index + 1 }}問</v-card-title>
            <v-card-text>
              <div class="headline font-weight-bold text--primary">
                {{ question }}
              </div>
            </v-card-text>
            <v-card-actions class="mt-n4">
              <v-radio-group v-model="answers[index]" class="mx-4">
                <v-radio :value="5">
                  <template v-slot:label>
                    <div class="text--primary">
                      思う
                    </div>
                  </template>
                </v-radio>
                <v-radio :value="4">
                  <template v-slot:label>
                    <div class="text--primary">
                      やや思う
                    </div>
                  </template>
                </v-radio>
                <v-radio :value="3">
                  <template v-slot:label>
                    <div class="text--primary">
                      普通
                    </div>
                  </template>
                </v-radio>
                <v-radio :value="2">
                  <template v-slot:label>
                    <div class="text--primary">
                      やや思わない
                    </div>
                  </template>
                </v-radio>
                <v-radio :value="1">
                  <template v-slot:label>
                    <div class="text--primary">
                      思わない
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col class="text-center">
          <v-dialog v-model="dialog" width="500">
            <template v-slot:activator="{ on }">
              <v-btn
                color="primary"
                :disabled="!apiStatus.canSubmit"
                @click.stop="confirm"
              >
                回答
              </v-btn>
            </template>

            <v-card class="pb-2">
              <v-card-title primary-title>確認</v-card-title>
              <v-card-text>
                <v-card class="mb-2">
                  <v-card-title>あなたについて</v-card-title>
                  <v-card-text>
                    <v-simple-table>
                      <template v-slot:default>
                        <tbody>
                          <tr>
                            <td>おなまえ（ニックネーム）</td>
                            <td class="table-value">
                              {{ name }}
                            </td>
                          </tr>
                          <tr>
                            <td>性別</td>
                            <td class="table-value">
                              {{ genderText(gender) }}
                            </td>
                          </tr>
                          <tr>
                            <td>年齢</td>
                            <td class="table-value">{{ age }}才</td>
                          </tr>
                        </tbody>
                      </template>
                    </v-simple-table>
                  </v-card-text>
                </v-card>

                <v-card class="mb-2">
                  <v-card-title>相手について</v-card-title>
                  <v-card-text>
                    <v-simple-table>
                      <template v-slot:default>
                        <tbody>
                          <tr>
                            <td>性別</td>
                            <td class="table-value">
                              {{ genderText(partnerGender) }}
                            </td>
                          </tr>
                          <tr>
                            <td>年齢の範囲</td>
                            <td class="table-value">
                              {{ partnerAgeRange[0] }}才から{{
                                partnerAgeRange[1]
                              }}才
                            </td>
                          </tr>
                        </tbody>
                      </template>
                    </v-simple-table>
                  </v-card-text>
                </v-card>

                <v-card>
                  <v-card-text>
                    <v-simple-table>
                      <template v-slot:default>
                        <thead>
                          <tr>
                            <th class="text-left">
                              質問
                            </th>
                            <th class="text-left">
                              解答
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(question, index) in questions"
                            :key="index"
                          >
                            <td>{{ question }}</td>
                            <td class="table-value">
                              {{ answerText(answers[index]) }}
                            </td>
                          </tr>
                        </tbody>
                      </template>
                    </v-simple-table>
                  </v-card-text>
                </v-card>
              </v-card-text>
              <v-card-actions class="justify-center">
                <v-btn text @click="dialog = false">
                  戻る
                </v-btn>
                <v-btn
                  color="primary"
                  :disabled="!apiStatus.canSubmit"
                  @click="submit"
                >
                  回答
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script lang="ts">
import axios from 'axios'
import { Vue, Component } from 'vue-property-decorator'
import Gender from '~/models/Gender'
import { questionnaireStore } from '~/store'
import { AgeRange } from '~/store/questionnaire'
import { APIStatus } from '~/models/APIStatus'
import { ErrorResponse } from '~/models/ErrorResponse'

@Component
export default class extends Vue {
  apiStatus: APIStatus = {
    canSubmit: false,
    matched: false,
    submitted: false
  }
  submitted: boolean = false
  error: ErrorResponse | null = null

  enumGender = Gender

  dialog: boolean = false

  nameRules = [
    (v: string) => !!v || 'おなまえは必須項目です',
    (v: string) => (v && v.length <= 30) || 'おなまえは30文字までです'
  ]

  name: string = ''
  gender: Gender = Gender.UNKNOWN
  age: number = 0
  partnerGender: Gender = Gender.UNKNOWN
  partnerAgeRange: AgeRange = [0, 100]

  get questions() {
    return questionnaireStore.getQuestions
  }

  get answers() {
    return questionnaireStore.getAnswers
  }
  set answers(value) {
    questionnaireStore.SET_ANSWERS(value)
  }

  answerText(answer: number) {
    switch (answer) {
      case 1:
        return '思わない'
      case 2:
        return 'やや思わない'
      case 3:
        return '普通'
      case 4:
        return 'やや思う'
      case 5:
        return '思う'
      default:
        return ''
    }
  }
  genderText(gender: Gender) {
    switch (gender) {
      case Gender.UNKNOWN:
        return '不明'
      case Gender.MALE:
        return '男'
      case Gender.FEMALE:
        return '女'
    }
  }
  confirm() {
    if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
      this.dialog = true
    } else {
      this.$vuetify.goTo('#name', { offset: 120 })
    }
  }

  async submit() {
    questionnaireStore.SET_NAME(this.name)
    questionnaireStore.SET_GENDER(this.gender)
    questionnaireStore.SET_AGE(this.age)
    questionnaireStore.SET_PARTNER_GENDER(this.partnerGender)
    questionnaireStore.SET_PARTNER_AGE_RANGE(this.partnerAgeRange)

    await axios
      .post('/api/submit', {
        name: questionnaireStore.getName,
        gender: questionnaireStore.getGender,
        age: questionnaireStore.getAge,
        partnerGender: questionnaireStore.getPartnerGender,
        partnerMinAge: questionnaireStore.getPartnerAgeRange[0],
        partnerMaxAge: questionnaireStore.getPartnerAgeRange[1],
        answers: questionnaireStore.getAnswers
      })
      .then(() => {
        this.submitted = true
      })
      .catch(err => {
        this.error = err.response.data.error
      })
  }

  mounted() {
    axios.get('/api/status').then(value => {
      this.apiStatus = value.data
    })

    questionnaireStore.obtainQuestions()
    this.name = questionnaireStore.getName
    this.gender = questionnaireStore.getGender
    this.age = questionnaireStore.getAge
    this.partnerGender = questionnaireStore.getPartnerGender
    this.partnerAgeRange = questionnaireStore.getPartnerAgeRange
  }
}
</script>

<style scoped>
span {
  display: inline-block;
}

.table-value {
  width: 40%;
}
</style>
