import { HttpContext } from '@adonisjs/core/http'
import { PollService } from '#services/poll_service'

export default class PollsController {
  private pollService = new PollService()

  /**
   * Create a poll for a post
   */
  public async create({ request, response }: HttpContext) {
    try {
      const { postId, question } = request.only(['postId', 'question'])
      const poll = await this.pollService.createPoll(postId, question || '')
      return response.ok(poll)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Add options to a poll
   */
  public async addOptions({ request, response }: HttpContext) {
    try {
      const { pollId, options } = request.only(['pollId', 'options'])
      const created = await this.pollService.addPollOptions(pollId, options)
      return response.ok(created)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Remove a poll option
   */
  public async removeOption({ request, response }: HttpContext) {
    try {
      const { optionId } = request.only(['optionId'])
      const result = await this.pollService.removePollOption(optionId)
      return response.ok(result)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Vote in a poll
   */
  public async vote({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { pollId, pollOptionId } = request.only(['pollId', 'pollOptionId'])

      const result = await this.pollService.votePoll(pollId, user.userId, pollOptionId)

      return response.ok(result)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Delete a poll
   */
  public async delete({ request, response }: HttpContext) {
    try {
      const { pollId } = request.only(['pollId'])
      const poll = await this.pollService.deletePoll(pollId)
      return response.ok(poll)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
