// app/Repositories/UserRepository.ts
import User from '#models/DBModel/User/user'
import Hash from '@adonisjs/core/services/hash'

export default class UserRepository {
  async getById(id: number) {
    return await User.find(id)
  }

  async getbyEmail(email: string) {
    return await User.findBy('email', email)
  }

  async create(data: {
    name: string
    email: string
    passwordHash: string
    display_name?: string
    bio?: string
    profile_picture?: URL
  }) {
    return await User.create(data)
  }

  async update(id: number, data: Partial<User>) {
    const user = await User.findOrFail(id)
    user.merge(data)
    await user.save()
    return user
  }

  async updateName(id: number, name: string) {
    const user = await User.findOrFail(id)
    user.name = name
    await user.save()
    return user
  }

  async updatePassword(id: number, plainPassword: string) {
    const user = await User.findOrFail(id)
    user.password = await Hash.make(plainPassword)
    await user.save()
    return user
  }

  async updateEmail(id: number, email: string) {
    const user = await User.findOrFail(id)
    user.email = email
    await user.save()

    // Example: trigger verification workflow
    // await Mail.sendVerification(user)

    return user
  }

  async delete(id: number) {
    const user = await User.findOrFail(id)
    await user.delete()
  }
}
