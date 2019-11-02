import axios from 'axios'
import { Module, Mutation, Action, VuexModule } from 'vuex-module-decorators'
import Gender from '~/models/Gender'
import InputError from '~/error/InputError'

export interface IQuestionnaireState {
  name: string
  gender: Gender
  age: number
  partnerGender: Gender
  partnerMinAge: number
  partnerMaxAge: number
  questions: string[]
  answers: number[]
}

@Module({ name: 'questionnaire', namespaced: true, stateFactory: true })
export default class Questionnaire extends VuexModule
  implements IQuestionnaireState {
  name: string = ''
  gender: Gender = Gender.UNKNOWN
  age: number = 0
  partnerGender: Gender = Gender.UNKNOWN
  partnerMinAge: number = 0
  partnerMaxAge: number = 100
  questions: string[] = []
  answers: number[] = []

  get getName() {
    return this.name
  }
  get getGender() {
    return this.gender
  }
  get getAge() {
    return this.age
  }
  get getPartnerGender() {
    return this.partnerGender
  }
  get getPartnerMinAge() {
    return this.partnerMinAge
  }
  get getPartnerMaxAge() {
    return this.partnerMaxAge
  }
  get getQuestions() {
    return this.questions
  }
  get getAnswers() {
    return this.answers
  }

  @Mutation
  SET_NAME(name: string) {
    this.name = name
  }
  @Mutation
  SET_GENDER(gender: Gender) {
    this.gender = gender
  }
  @Mutation
  SET_AGE(age: number) {
    if (age < 0 || age > 100) {
      throw new InputError('age must be between 0 and 100')
    }

    this.age = age
  }
  @Mutation
  SET_PARTNER_GENDER(partnerGender: Gender) {
    this.partnerGender = partnerGender
  }
  @Mutation
  SET_PARTNER_AGE_RANGE([partnerMinAge, partnerMaxAge]: [number, number]) {
    if (partnerMinAge < 0 || partnerMinAge > 100) {
      throw new InputError('partnerMinAge must be between 0 and 100')
    }
    if (partnerMaxAge < 0 || partnerMaxAge > 100) {
      throw new InputError('partnerMaxAge must be between 0 and 100')
    }
    if (partnerMinAge > partnerMaxAge) {
      throw new InputError(
        'partnerMinAge must be less than or equal to partnerMaxAge'
      )
    }

    this.partnerMinAge = partnerMinAge
    this.partnerMaxAge = partnerMaxAge
  }
  @Mutation
  SET_QUESTIONS(questions: string[]) {
    this.questions = questions
  }
  @Mutation
  SET_ANSWERS(answers: number[]) {
    if (answers.length !== this.questions.length) {
      throw new InputError(
        'The length of answers does not match the length of questions'
      )
    }

    this.answers = answers
  }
  @Mutation
  RESET_ANSWERS() {
    this.answers = new Array(this.questions.length).fill(3)
  }

  @Action
  async obtainQuestions() {
    const res = await axios.get('/api/questions')
    const newQuestions = res.data

    if (newQuestions !== this.questions) {
      this.SET_QUESTIONS(newQuestions)
      this.RESET_ANSWERS()
    }
  }
}
