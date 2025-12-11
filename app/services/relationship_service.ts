import Relationship from '#models/DBModel/relationship'

export class RelationshipService {
  public async findOrCreateRelationship(userFollowed: number, userFollow: number) {
    let relationship = await Relationship.query()
      .where('followed_id', userFollowed)
      .andWhere('follow_id', userFollow)
      .first()
    if (!relationship) {
      relationship = await Relationship.create({ userFollowed, userFollow })
    }
    return relationship
  }

  public async removeRelationship(userFollowed: number, userFollow: number) {
    const relationship = await Relationship.query()
      .where('followed_id', userFollowed)
      .andWhere('follow_id', userFollow)
      .first()
    if (relationship) {
      await relationship.delete()
      return true
    }
    return false
  }

  public async toggleRelationship(userFollowed: number, userFollow: number) {
    const relationship = await Relationship.query()
      .where('followed_id', userFollowed)
      .andWhere('follow_id', userFollow)
      .first()
    if (relationship) {
      await relationship.delete()
      return { action: 'removed' as const }
    }

    const newRelationship = await Relationship.create({ userFollowed, userFollow })
    return { action: 'added' as const, relationship: newRelationship }
  }

  public async countFollowers(userId: number) {
    const rows = await Relationship.query().where('followed_id', userId).count('* as total')
    const total = rows && rows[0] ? (rows[0] as any).total : 0
    return Number(total)
  }

  public async countFollowing(userId: number) {
    const rows = await Relationship.query().where('follow_id', userId).count('* as total')
    const total = rows && rows[0] ? (rows[0] as any).total : 0
    return Number(total)
  }
}
