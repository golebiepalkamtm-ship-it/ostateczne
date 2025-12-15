// Real Prisma User service
import prisma from './prisma'

export interface User {
  id: number
  email: string
  name?: string | null
}

export class UsersService {
  static async getAllUsers(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany()
      return users
    } catch (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }
  }

  static async getUserById(id: number): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      })
      return user
    } catch (error) {
      console.error('Error fetching user:', error)
      throw new Error('Failed to fetch user')
    }
  }

  static async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      const newUser = await prisma.user.create({
        data: userData
      })
      return newUser
    } catch (error) {
      console.error('Error creating user:', error)
      throw new Error('Failed to create user')
    }
  }

  static async updateUser(id: number, userData: Partial<Omit<User, 'id'>>): Promise<User | null> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: userData
      })
      return updatedUser
    } catch (error) {
      console.error('Error updating user:', error)
      throw new Error('Failed to update user')
    }
  }

  static async deleteUser(id: number): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      })
      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('Failed to delete user')
    }
  }
}
