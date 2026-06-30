import User from '#models/DBModel/User/user'
import hash from '@adonisjs/core/services/hash'

export class UserService {
  // Edit user profile (bio and profile picture)
  public async editProfile(
    userId: number,
    data: { displayName?: string; bio?: string; profilePicture?: string }
  ) {
    const user = await User.findOrFail(userId)
    const updates: Record<string, any> = {}
    if (typeof data.bio !== 'undefined') updates.bio = data.bio
    if (typeof data.displayName !== 'undefined') updates.displayName = data.displayName
    if (typeof data.profilePicture !== 'undefined') updates.profilePicture = data.profilePicture
    user.merge(updates)
    await user.save()
    return user
  }

  public async updateUsername(userId: number, username: string) {
    const user = await User.findOrFail(userId)
    user.username = username
    await user.save()
    return user
  }

  public async updateEmail(userId: number, currentPassword: string, email: string) {
    const user = await User.findOrFail(userId)

    const isValid = await hash.verify(user.password, currentPassword)
    if (!isValid) throw new Error('Current password is incorrect')

    user.email = email
    await user.save()
    return user
  }

  public async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await User.findOrFail(userId)

    const isValid = await hash.verify(user.password, currentPassword)
    if (!isValid) throw new Error('Current password is incorrect')

    user.password = await hash.make(newPassword)
    await user.save()
    return user
  }

  public async deleteUser(userId: number) {
    const user = await User.findOrFail(userId)
    await user.delete()
    return user
  }
}
