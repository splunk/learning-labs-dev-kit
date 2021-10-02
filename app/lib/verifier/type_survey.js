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

const QUESTION_TYPE = {
  MULTIPLE: 'multiple',
  TEXT: 'text',
  CHECKBOX: 'checkbox',
  LINEAR: 'linear',
  PARAGRAPH: 'paragraph'
}

/**
 *
 * @param {Object} token
 * @param {Object} targetDef
 * @param {Array}  targets
 */
class VerifierSurvey extends VerifierBase {
  async _runVerification (data) {
    const result = {}

    // If data is not empty, it means a user submitted survey answers.
    if (!_.isEmpty(data)) {
      result.data = data
      return result
    }

    result.pending = {}
    result.pending.type = 'survey'
    result.pending.questions = this.targetDef.questions
    return result
  }

  static verifyTargetDef (targetDef) {
    super.verifyTargetDef(targetDef)
    super.verifyTargetFileDef(targetDef)
    VerifierSurvey.verifyTargetSurveyDef(targetDef)
  }

  static verifyTargetSurveyQuestionMultiple (question) {
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
  }

  static verifyTargetSurveyQuestionLinear (question) {
    question.range = VerifierSurvey.verifyValue(question.range, 'Object',
      'question.range', {})
    question.range.start = VerifierSurvey.verifyValue(question.range.start,
      'Number', 'question.range.start', 0)
    question.range.end = VerifierSurvey.verifyValue(question.range.end,
      'Number', 'question.range.end', 10)
    question.labels = VerifierSurvey.verifyValue(question.labels, 'Object',
      'question.labels', {})
    question.labels.left = VerifierSurvey.verifyValue(question.labels.left,
      'String', 'question.labels.left', 'Very unlikely')
    question.labels.right = VerifierSurvey.verifyValue(question.labels.right,
      'String', 'question.labels.right', 'Very likely')
  }

  static verifyTargetSurveyQuestion (question) {
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
    if (!_.isString(question.id)) {
      const message = 'A question item must contain a String property "id"'
      throw new errors.VerifierConfigError(message)
    }
    if (_.isUndefined(question.page)) {
      question.page = 1
    } else if (!_.isUndefined(question.page) && !_.isNumber(question.page)) {
      const message = 'A question item must contain a Number property "page"'
      throw new errors.VerifierConfigError(message)
    }
    if (!_.isUndefined(question.required) && !_.isBoolean(question.required)) {
      const message = 'A question item must contain a Boolean property "required"'
      throw new errors.VerifierConfigError(message)
    }
    switch (question.type) {
      case QUESTION_TYPE.MULTIPLE:
      case QUESTION_TYPE.CHECKBOX:
        VerifierSurvey.verifyTargetSurveyQuestionMultiple(question)
        break
      case QUESTION_TYPE.TEXT:
      case QUESTION_TYPE.PARAGRAPH:
        break
      case QUESTION_TYPE.LINEAR:
        VerifierSurvey.verifyTargetSurveyQuestionLinear(question)
        break
      default: {
        const message = `Invalid question type "${question.type}"`
        throw new errors.VerifierConfigError(message)
      }
    }
  }

  static verifyTargetSurveyDef (targetDef) {
    const surveyDefRawStr = fs.readFileSync(targetDef.filepath)
    const questionDefs = yaml.safeLoad(surveyDefRawStr)

    // Parse Questions
    if (!_.isArray(questionDefs.questions)) {
      const message = 'A question item must contain an Array property "questions"'
      throw new errors.VerifierConfigError(message)
    }
    const idSet = new Set()
    questionDefs.questions.forEach((questionDef) => {
      VerifierSurvey.verifyTargetSurveyQuestion(questionDef)
      idSet.add(questionDef.id)
    })
    if (idSet.size !== questionDefs.questions.length) {
      const message = 'A question item must contain an unique String property "id"'
      throw new errors.VerifierConfigError(message)
    }
    targetDef.questions = questionDefs.questions
  }
}

exports.VerifierSurvey = VerifierSurvey
