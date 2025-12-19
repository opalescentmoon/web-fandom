import { HttpContext } from '@adonisjs/core/http'
import { PostService } from '#services/post_service'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import Media from '#models/DBModel/media'

export default class PostsController {
  private postService = new PostService()

  /**
   * Create a new post
   */
  public async create({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { caption, postType, contentId, fandomId, parentId } = request.only([
        'caption',
        'postType',
        'contentId',
        'fandomId',
        'parentId',
      ])

      const post = await this.postService.createPost(
        user.userId,
        fandomId,
        caption,
        parentId || null,
        postType || 'post',
        contentId || 0
      )

      if (!post) {
        return response.internalServerError({
          error: 'Post service returned no data',
        })
      }

      const fullPost = await this.postService.getPostWithContent(post.postId)

      return response.created(fullPost ?? post.serialize())
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Add hashtag to a post
   */
  public async addHashtag({ params, request, response }: HttpContext) {
    try {
      const { hashtagId } = request.only(['hashtagId'])
      const postId = Number(params.postId)

      const post = await this.postService.addHashtagToPost(postId, hashtagId)
      return response.ok(post)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Remove hashtag from a post
   */
  public async removeHashtag({ params, response }: HttpContext) {
    try {
      const postId = Number(params.postId)
      const hashtagId = Number(params.hashtagId)

      const post = await this.postService.removeHashtagToPost(postId, hashtagId)
      return response.ok(post)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Edit post content
   */
  public async update({ params, request, response }: HttpContext) {
    try {
      const postId = Number(params.postId)
      const { caption } = request.only(['caption'])

      const post = await this.postService.editPost(postId, caption)
      return response.ok(post)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Delete a post
   */
  public async delete({ params, response }: HttpContext) {
    try {
      const postId = Number(params.postId)
      const deleted = await this.postService.deletePost(postId)
      return response.ok(deleted)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get a single post
   */
  public async get({ params, response }: HttpContext) {
    try {
      const postId = Number(params.postId)
      const post = await this.postService.getPost(postId)
      return response.ok(post)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get all posts from a user
   */
  public async getByUser({ params, request, response }: HttpContext) {
    try {
      const userId = Number(params.userId)
      const fandomIdRaw = request.input('fandomId')
      const branch = request.input('branch') || undefined
      const fandomId = fandomIdRaw ? Number(fandomIdRaw) : undefined

      const posts = await this.postService.getPostsByUser(userId, fandomId, branch)
      return response.ok(posts)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get all posts
   */
  public async getAll({ response }: HttpContext) {
    try {
      const posts = await this.postService.getAllPosts()
      return response.ok(posts)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get posts by fandom
   */
  public async getByFandom({ params, request, response, auth }: HttpContext) {
    try {
      const fandomId = Number(params.fandomId)
      const { tab, branch } = request.qs()

      let userId: number | null = null
      try {
        await auth.check() // if Authorization header exists + valid → auth.user filled
        userId = auth.user?.userId ?? null
      } catch {
        userId = null
      }

      const posts = await this.postService.getPostsByFandom(fandomId, tab, branch, userId)
      return response.ok(posts)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }


  /**
   * Get posts by type
   */
  public async getByType({ params, response }: HttpContext) {
    try {
      const { postType } = params
      const posts = await this.postService.getPostsByType(postType)
      return response.ok(posts)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get comments for a post
   */
  public async comments({ params, response }: HttpContext) {
    try {
      const postId = Number(params.postId)
      const comments = await this.postService.getCommentsForPost(postId)
      return response.ok(comments)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get posts with a specific hashtag
   */
  public async getByHashtag({ params, response }: HttpContext) {
    try {
      const hashtagId = Number(params.hashtagId)
      const posts = await this.postService.getPostsWithHashtag(hashtagId)
      return response.ok(posts)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Add media to post
   */
  public async addMedia({ params, request, response }: HttpContext) {
    try {
      const postId = Number(params.postId)
      if (!postId) return response.badRequest({ error: 'Invalid postId' })

      // make sure post exists

      const file = request.file('media', {
        size: '15mb',
        extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'],
      })

      if (!file) {
        return response.badRequest({ error: 'No media file uploaded (field name must be "media")' })
      }

      const fileName = `${cuid()}.${file.extname}`
      const uploadDir = app.makePath('public/uploads/posts')

      await file.move(uploadDir, { name: fileName })

      if (!file.isValid) {
        return response.badRequest({ error: file.errors })
      }

      // Determine type
      const mediaType = file.type === 'video' ? 'video' : 'image'

      // Public URL path stored in DB
      const fileUrl = `/uploads/posts/${fileName}`

      // 1) create media row
      const media = await Media.create({ postId, fileUrl, mediaType })

      return response.ok(media)
    } catch (error) {
      return response.internalServerError({ error: error.message })
    }
  }


  /**
   * Get media for a post
   */
  public async media({ params, response }: HttpContext) {
    try {
      const postId = Number(params.postId)
      const media = await this.postService.getMediaForPost(postId)
      return response.ok(media)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Remove media
   */
  public async removeMedia({ params, response }: HttpContext) {
    try {
      const postId = Number(params.postId)
      const mediaId = Number(params.mediaId)

      const removed = await this.postService.removeMediaFromPost(postId, mediaId)
      return response.ok(removed)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get comments by a user
   */
  public async commentsByUser({ params, response }: HttpContext) {
    try {
      const userId = Number(params.userId)
      const comments = await this.postService.getCommentsByUser(userId)
      return response.ok(comments)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get all comments
   */
  public async allComments({ response }: HttpContext) {
    try {
      const comments = await this.postService.getAllComments()
      return response.ok(comments)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
