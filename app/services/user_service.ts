import User from '#models/DBModel/User/user'
import hash from '@adonisjs/core/services/hash'

export class UserService {
  // Edit user profile (bio and profile picture)
  public async editProfile(userId: number, data: { bio?: string; profilePicture?: string }) {
    const user = await User.findOrFail(userId)
    if (typeof data.bio !== 'undefined') user.bio = data.bio
    if (typeof data.profilePicture !== 'undefined') user.profilePicture = data.profilePicture as any
    await user.save()
    return user
  }

  public async updateEmail(userId: number, email: string) {
    const user = await User.findOrFail(userId)
    user.email = email
    await user.save()
    return user
  }

  public async changePassword(userId: number, newPassword: string) {
    const user = await User.findOrFail(userId)
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
