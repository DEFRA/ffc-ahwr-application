import joi from 'joi'
import { v4 as uuid } from 'uuid'
import appInsights from 'applicationinsights'
import { sendMessage } from '../../messaging/send-message.js'
import { config } from '../../config/index.js'
import {
  piHunt,
  piHuntAllAnimals,
  testResults as testResultsConstant,
  livestockTypes,
  claimType,
  applicationStatus
} from '../../constants/index.js'
import { getClaimByReference, updateClaimByReference, getByApplicationReference, isURNNumberUnique } from '../../repositories/claim-repository.js'
import { getApplication } from '../../repositories/application-repository.js'
import { getAmount } from '../../lib/getAmount.js'
import { searchPayloadSchema } from './schema/search-payload.schema.js'
import { createClaimReference } from '../../lib/create-reference.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../lib/context-helper.js'
import { validateClaim } from '../../processing/claim/validation.js'
import { StatusCodes } from 'http-status-codes'
import { AHWR_SCHEME, TYPE_OF_LIVESTOCK, UNNAMED_FLOCK, UNNAMED_HERD } from 'ffc-ahwr-common-library'
import { generateEventsAndComms, saveClaimAndRelatedData } from '../../processing/claim/ahwr/processor.js'
import { searchClaims } from '../../repositories/claim/claim-search-repository.js'

const { submitPaymentRequestMsgType, submitRequestQueue, messageGeneratorMsgType, messageGeneratorQueue } = config

const isFollowUp = (payload) => payload.type === claimType.endemics

const getUnnamedHerdValueByTypeOfLivestock = (typeOfLivestock) => typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD

export const claimHandlers = [
  {
    method: 'GET',
    path: '/api/claim/get-by-reference/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const claim = await getClaimByReference(request.params.ref)
        if (claim?.dataValues) {
          return h.response(claim.dataValues).code(StatusCodes.OK)
        } else {
          return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/claim/get-by-application-reference/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string()
        }),
        query: joi.object({
          typeOfLivestock: joi.string().optional().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep)
        })
      },
      handler: async (request, h) => {
        const { typeOfLivestock } = request.query
        const claims = await getByApplicationReference(request.params.ref, typeOfLivestock)

        return h.response(claims).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim/search',
    options: {
      validate: {
        payload: joi.object({
          ...searchPayloadSchema,
          sort: joi.object({
            field: joi.string().valid().optional().allow(''),
            direction: joi.string().valid().optional().allow(''),
            reference: joi.string().valid().optional().allow('')
          }).optional()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { search, filter, offset, limit, sort } = request.payload
        const { total, claims } = await searchClaims(
          search,
          filter,
          offset,
          limit,
          sort
        )
        return h.response({ total, claims }).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim/is-urn-unique',
    options: {
      validate: {
        payload: joi.object({
          sbi: joi.string().required(),
          laboratoryURN: joi.string().required()
        })
      },
      handler: async (request, h) => {
        const { sbi, laboratoryURN } = request.payload
        const result = await isURNNumberUnique(sbi, laboratoryURN)

        return h.response(result).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim',
    options: {
      handler: async (request, h) => {
        const { payload, logger } = request
        const applicationReference = payload?.applicationReference
        const application = await getApplication(applicationReference)

        if (!application?.dataValues) {
          return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
        }

        const { flags } = application.dataValues

        const { error } = validateClaim(AHWR_SCHEME, request.payload, flags)
        if (error) {
          logger.setBindings({ error })
          appInsights.defaultClient.trackException({ exception: error })
          return h.response({ error }).code(StatusCodes.BAD_REQUEST).takeover()
        }

        const tempClaimReference = payload.reference
        const { type } = payload
        const { typeOfLivestock, laboratoryURN, herd } = payload.data
        const claimReference = createClaimReference(tempClaimReference, type, typeOfLivestock)

        logger.setBindings({
          isFollowUp: isFollowUp(payload),
          applicationReference,
          claimReference,
          laboratoryURN
        })

        const { sbi } = application.dataValues.data.organisation

        request.logger.setBindings({ sbi })

        if (laboratoryURN) {
          const { isURNUnique } = await isURNNumberUnique(sbi, laboratoryURN)
          if (!isURNUnique) {
            return h.response({ error: 'URN number is not unique' }).code(StatusCodes.BAD_REQUEST).takeover()
          }
        }

        // create the claim and herd in DB
        const { claim, herdGotUpdated, herdData, isMultiHerdsClaim } = await saveClaimAndRelatedData(sbi, { incoming: payload, claimReference }, flags, logger)

        if (!claim) {
          throw new Error('Claim was not created')
        }

        // now send outbound events and comms. For now, we will call directly here and not await. Ideally we would move this to an offline
        // async process by sending a message to the application input queue. But will save that for part 3 as this current change is already complex
        generateEventsAndComms(isMultiHerdsClaim, claim, application, herdData, herdGotUpdated, herd?.herdId)

        return h.response(claim).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim/get-amount',
    options: {
      validate: {
        payload: joi.object({
          typeOfLivestock: joi.string().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep).required(),
          reviewTestResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).optional(),
          type: joi.string().valid(claimType.review, claimType.endemics).required(),
          piHunt: joi.string().valid(piHunt.yes, piHunt.no).optional(),
          piHuntAllAnimals: joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).optional(),
          dateOfVisit: joi.date().required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const amount = await getAmount({ type: request.payload.type, data: request.payload })
        return h.response(amount).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/claim/update-by-reference',
    options: {
      validate: {
        payload: joi.object({
          reference: joi.string().valid().required(),
          status: joi.number().required(),
          user: joi.string().required(),
          note: joi.string()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })

          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { reference, status, note } = request.payload

        request.logger.setBindings({
          reference,
          status
        })

        const claim = await getClaimByReference(reference)
        if (!claim.dataValues) {
          return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
        }
        const { typeOfLivestock, reviewTestResults, vetVisitsReviewTestResults } = claim.dataValues.data || {}
        const applicationReference = claim.dataValues.applicationReference

        const application = await getApplication(applicationReference)
        const { sbi, frn, crn } = application?.dataValues?.data?.organisation || {}

        request.logger.setBindings({ sbi })

        await updateClaimByReference(
          {
            reference,
            statusId: status,
            updatedBy: request.payload.user,
            sbi
          },
          note,
          request.logger
        )

        await sendMessage(
          {
            crn,
            sbi,
            agreementReference: applicationReference,
            claimReference: reference,
            claimStatus: status,
            claimType: claim.dataValues.data.claimType,
            typeOfLivestock,
            reviewTestResults: reviewTestResults ?? vetVisitsReviewTestResults,
            piHuntRecommended: claim.dataValues.data.piHuntRecommended,
            piHuntAllAnimals: claim.dataValues.data.piHuntAllAnimals,
            dateTime: new Date(),
            herdName: claim.dataValues?.herd?.herdName || getUnnamedHerdValueByTypeOfLivestock(typeOfLivestock)
          },
          messageGeneratorMsgType,
          messageGeneratorQueue,
          { sessionId: uuid() }
        )

        if (status === applicationStatus.readyToPay) {
          let optionalPiHuntValue

          if (isVisitDateAfterPIHuntAndDairyGoLive(claim.dataValues.data.dateOfVisit)) {
            optionalPiHuntValue = claim.dataValues.data.piHunt === piHunt.yes && claim.dataValues.data.piHuntAllAnimals === piHuntAllAnimals.yes ? 'yesPiHunt' : 'noPiHunt'
          }

          await sendMessage(
            {
              reference,
              sbi,
              whichReview: typeOfLivestock,
              isEndemics: true,
              claimType: claim.dataValues.data.claimType,
              reviewTestResults: reviewTestResults ?? vetVisitsReviewTestResults,
              frn,
              optionalPiHuntValue
            },
            submitPaymentRequestMsgType,
            submitRequestQueue,
            { sessionId: uuid() }
          )
        }

        return h.response().code(StatusCodes.OK)
      }
    }
  }
]
