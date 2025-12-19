import Poll from '#models/DBModel/Polls/poll'
import PollOption from '#models/DBModel/Polls/poll_option'
import PollVote from '#models/DBModel/Polls/poll_vote'

export class PollService {
  public async createPoll(postId: number, question: string) {
    const poll = await Poll.create({ postId, question })
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

    // already voted? block (twitter style)
    const existingVote = await PollVote.query()
      .join('poll_options', 'poll_options.id', 'poll_votes.poll_option_id')
      .where('poll_options.poll_id', pollId)
      .andWhere('poll_votes.user_id', userId)
      .select('poll_votes.*')
      .first()

    if (existingVote) {
      throw new Error('User has already voted in this poll')
    }

    await PollVote.create({ pollOptionId, userId })

    // counts per option
    const rows = await PollVote.query()
      .join('poll_options', 'poll_options.id', 'poll_votes.poll_option_id')
      .where('poll_options.poll_id', pollId)
      .select('poll_votes.poll_option_id as poll_option_id')
      .count('* as total')
      .groupBy('poll_votes.poll_option_id')

    const counts = (rows as any[]).map((r) => ({
      optionId: Number(r.$extras?.poll_option_id ?? r.poll_option_id ?? r.pollOptionId),
      total: Number(r.$extras?.total ?? r.total ?? 0),
    }))

    const totalVotes = counts.reduce((sum, c) => sum + c.total, 0)

    return { pollId, votedOptionId: pollOptionId, totalVotes, counts }
  }

  public async deletePoll(pollId: number) {
    const poll = await Poll.findOrFail(pollId)
    await poll.delete()
    return poll
  }
}
