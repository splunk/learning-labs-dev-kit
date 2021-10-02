/**
 * Copyright 2021 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
 */

'use strict'

const _ = require('underscore')
const fs = require('fs')
const yaml = require('js-yaml')
const { VerifierBase, errors } = require('./base')

const QUIZ_TYPE = {
  MULTIPLE: 'multiple',
  TEXT: 'text'
}

const REVEAL_ANSWER_LIMIT = 3

class VerifierQuiz extends VerifierBase {
  async _runVerification (data) {
    const result = {}

    const questionIndex = data.questionIndex
    const answer = data.answer
    const targetStatus = await this._getTargetStatus()

    if (!_.isEmpty(data)) {
      const [passed, correctAnswer] = this._checkQuestion(questionIndex, answer)
      targetStatus.passed = passed
      if (passed) {
        targetStatus.solved.push(questionIndex)
        targetStatus.solved = _.uniq(targetStatus.solved)
      } else {
        // Count failures.
        targetStatus.failedCount[questionIndex] += 1

        // If users failed more than REVEAL_ANSWER_LIMIT, then give away answer.
        const failedColunt = targetStatus.failedCount[questionIndex]
        const exceededRevealLimit = failedColunt >= REVEAL_ANSWER_LIMIT
        if (this.targetDef.global.displayAnswer && exceededRevealLimit && correctAnswer) {
          targetStatus.correctAnswer = correctAnswer
        }
      }
    }

    const isDone = targetStatus.solved.length >= this.targetDef.passThreshold
    if (!isDone) {
      // Get next question
      const solvedQuestions = targetStatus.solved || []
      targetStatus.question = this._prepareNextQuestion(solvedQuestions)

      // Add status as pending
      result.pending = targetStatus
    }

    return result
  }

  async _getTargetStatus () {
    let targetStatus = await super._getTargetStatus()
    if (!_.isObject(targetStatus) || _.isEmpty(targetStatus)) {
      targetStatus = {}
      targetStatus.solved = []
      targetStatus.type = this.targetDef.type
      targetStatus.name = this.targetDef.name
      targetStatus.passThreshold = this.targetDef.passThreshold
      targetStatus.failedCount = {}
      this.targetDef.questions.forEach(question => {
        targetStatus.failedCount[question.index] = 0
      })
    }

    // Delete correctAnswer if was set before
    delete targetStatus.correctAnswer
    return targetStatus
  }

  _prepareNextQuestion (solvedQuestions) {
    // Randomly pick questions that are not solved yet.
    const unsolved = this.targetDef.questions.filter(question => {
      return !solvedQuestions.includes(question.index)
    })
    const randomInteger = Math.floor(Math.random() * (new Date()).getTime())
    const randomPick = randomInteger % unsolved.length
    const question = _.clone(unsolved[randomPick])
    delete question.answer
    return question
  }

  _checkQuestion (questionIndex, answer) {
    const questions = this.targetDef.questions
    const question = questions[questionIndex]
    let passed
    let correctAnswer = null
    if (question.type === 'multiple' && _.isArray(question.answer)) {
      passed = _.isEmpty(_.difference(question.answer, answer)) &&
                _.isEmpty(_.difference(answer, question.answer))
    } else {
      passed = (question.answer === answer)
    }

    // For 'text' type, optionally show the correct answer
    if (question.type === 'text' && !question.hideAnswer && !passed) {
      correctAnswer = question.answer
    }

    return [passed, correctAnswer]
  }

  static verifyTargetDef (targetDef) {
    super.verifyTargetDef(targetDef)
    super.verifyTargetFileDef(targetDef)
    VerifierQuiz.verifyTargetQuizDef(targetDef)
  }

  static veirfyTargetQuizQuestionMultiple (question) {
    if (!_.isArray(question.choices)) {
      const message = `A question item of "${question.type}" type must contain an Array property "choices"`
      throw new errors.VerifierConfigError(message)
    }
    for (const choice of question.choices) {
      if (!_.isString(choice)) {
        const message = 'Items within "choices" property must be String'
        throw new errors.VerifierConfigError(message)
      }
    }
    const numOfChoices = question.choices.length
    if (!_.isArray(question.answer) && !_.isNumber(question.answer)) {
      const message = '"answer" property within a question item must be either a Number of an Array'
      throw new errors.VerifierConfigError(message)
    }
    if (_.isArray(question.answer)) {
      for (const answer of question.answer) {
        if (!_.isNumber(answer)) {
          const message = 'Items within "answer" property must be a Number'
          throw new errors.VerifierConfigError(message)
        }
        if (answer >= question.choices.length || answer < 0) {
          const message = `Items within "answer" must be a value between 0 and ${numOfChoices - 1}`
          throw new errors.VerifierConfigError(message)
        }
      }
      question.multiAnswer = true
      question.answer = _.uniq(question.answer)
    } else if (_.isNumber(question.answer)) {
      if (question.answer >= question.choices.length || question.answer < 0) {
        const message = `Property "answer" must be a value between 0 and ${numOfChoices - 1}`
        throw new errors.VerifierConfigError(message)
      }
    }
  }

  static verifyTargetQuizQuestion (question) {
    if (!_.isObject(question)) {
      const message = 'Items within "questions" array must be Object'
      throw new errors.VerifierConfigError(message)
    }
    if (!_.isString(question.question)) {
      const message = 'A question item must contain a String property "question"'
      throw new errors.VerifierConfigError(message)
    }
    if (!_.isString(question.type)) {
      const message = 'A question item must contain a String property "type"'
      throw new errors.VerifierConfigError(message)
    }
    switch (question.type) {
      case QUIZ_TYPE.MULTIPLE:
        VerifierQuiz.veirfyTargetQuizQuestionMultiple(question)
        break
      case QUIZ_TYPE.TEXT:
        if (!_.isString(question.answer)) {
          const message = `"answer" property of a question item of type "${question.type}" must be a String`
          throw new errors.VerifierConfigError(message)
        }
        break
      default: {
        const message = `Invalid question type "${question.type}"`
        throw new errors.VerifierConfigError(message)
      }
    }
  }

  static verifyTargetQuizDef (targetDef) {
    const quizDef = fs.readFileSync(targetDef.filepath)

    const parsedQuestions = yaml.safeLoad(quizDef)

    // Parse Questions
    if (!_.isArray(parsedQuestions.questions)) {
      const message = 'Quiz description must contain an Array property "questions"'
      throw new errors.VerifierConfigError(message)
    }
    let index = 0
    for (const question of parsedQuestions.questions) {
      VerifierQuiz.verifyTargetQuizQuestion(question)
      question.index = index
      index += 1
    }
    targetDef.questions = parsedQuestions.questions

    // Parse Pass Threshold
    if (_.isUndefined(parsedQuestions.passThreshold)) {
      parsedQuestions.passThreshold = parsedQuestions.questions.length
    } else if (!_.isNumber(parsedQuestions.passThreshold)) {
      const message = '"passThreshold" property within a quiz description must be a Number'
      throw new errors.VerifierConfigError(message)
    }
    const parsedPassThreshold = parsedQuestions.passThreshold
    const numOfQuestions = targetDef.questions.length
    if (parsedPassThreshold > numOfQuestions || parsedPassThreshold <= 0) {
      const message = `Property "passThreshold" must be a value between 0 and ${numOfQuestions}`
      throw new errors.VerifierConfigError(message)
    }
    targetDef.passThreshold = parsedPassThreshold
  }
}

exports.VerifierQuiz = VerifierQuiz
