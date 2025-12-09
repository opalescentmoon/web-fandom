import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/DBModel/User/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  /**
   * Register a new user
   */
  async register({ request, response }: HttpContext) {
    try {
      // Validate input
      const { username, displayName, email, password, passwordConfirmation } = request.only([
        'username',
        'displayName',
        'email',
        'password',
        'passwordConfirmation',
      ])

      // Check if passwords match
      if (password.trim() !== passwordConfirmation.trim()) {
        return response.status(400).json({
          success: false,
          message: 'Passwords do not match',
        })
      }

      // Check if user already exists
      const existingUser = await User.findBy('email', email)
      if (existingUser) {
        return response.status(409).json({
          success: false,
          message: 'Email already registered',
        })
      }

      // Create new user
      const user = await User.create({
        username,
        displayName: displayName || username,
        email,
        password,
        bio: '',
      })

      // Generate access token
      const token = await User.accessTokens.create(user)

      return response.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            userId: user.userId,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            bio: user.bio,
          },
          token: {
            type: 'bearer',
            token: token.value,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Login user with email and password
   */
  async login({ request, response }: HttpContext) {
    try {
      const { username, password } = request.only(['username', 'password'])

      // Find user by email
      const user = await User.findBy('username', username)
      if (!user) {
        return response.status(401).json({
          success: false,
          message: 'Invalid email or password',
        })
      }

      // Verify password
      const isPasswordValid = await hash.verify(user.password, password)
      if (!isPasswordValid) {
        return response.status(401).json({
          success: false,
          message: 'Invalid email or password',
        })
      }

      // Generate access token
      const token = await User.accessTokens.create(user)

      return response.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            userId: user.userId,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            bio: user.bio,
          },
          token: {
            type: 'bearer',
            token: token.value,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Logout user by revoking token
   */
  async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const token = auth.user!.currentAccessToken

      // Revoke the current token
      await User.accessTokens.delete(user, token.tokenableId)

      return response.status(200).json({
        success: true,
        message: 'Logged out successfully',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Get current user profile
   */
  async getProfile({ auth, response }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      return response.status(200).json({
        success: true,
        data: {
          userId: user.userId,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          bio: user.bio,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
