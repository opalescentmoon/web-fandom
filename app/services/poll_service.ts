import Poll from '#models/DBModel/Polls/poll'
import PollOption from '#models/DBModel/Polls/poll_option'
import PollVote from '#models/DBModel/Polls/poll_vote'

export class PollService {
  public async createPoll(postId: number) {
    let poll = await Poll.create({ postId })
    return poll
  }

  public async addPollOptions(pollId: number, optionTexts: string[]) {
    const poll = await Poll.findOrFail(pollId)

    const createdOptions = await Promise.all(
      optionTexts.map((text) =>
        PollOption.create({
          pollId: poll.id,
          optionText: text,
        })
      )
    )
    return createdOptions
  }

  public async removePollOption(optionId: number) {
    const option = await PollOption.findOrFail(optionId)
    await option.delete()

    return { message: `Option ${option.id} removed` }
  }

  public async votePoll(pollId: number, userId: number, pollOptionId: number) {
    const option = await PollOption.findOrFail(pollOptionId)
    if (option.pollId !== pollId) {
      throw new Error('Option does not belong to this poll')
    }

    const existingVote = await PollVote.query()
      .where('poll_id', pollId)
      .andWhere('user_id', userId)
      .first()

    if (existingVote) {
      throw new Error('User has already voted in this poll')
    }

    const vote = await PollVote.create({
      pollOptionId,
      userId,
    })
    return vote
  }

  public async deletePoll(pollId: number) {
    const poll = await Poll.findOrFail(pollId)
    await poll.delete()
    return poll
  }
}
