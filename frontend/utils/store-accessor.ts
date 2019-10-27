import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import questionnaire from '~/store/questionnaire'

let questionnaireStore: questionnaire

function initialiseStores(store: Store<any>): void {
  questionnaireStore = getModule(questionnaire, store)
}

export { initialiseStores, questionnaireStore }
