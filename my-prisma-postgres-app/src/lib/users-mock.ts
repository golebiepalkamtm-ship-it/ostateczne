// Mock data service dla demonstracji CRUD operations
export interface User {
  id: string
  email: string
  name?: string
  age?: number
  createdAt: string
  updatedAt: string
}

const initialUsers: User[] = [
  {
    id: '1',
    email: 'jan.kowalski@example.com',
    name: 'Jan Kowalski',
    age: 25,
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2',
    email: 'anna.nowak@example.com',
    name: 'Anna Nowak',
    age: 30,
    createdAt: new Date('2024-01-16').toISOString(),
    updatedAt: new Date('2024-01-16').toISOString()
  },
  {
    id: '3',
    email: 'piotr.wisniewski@example.com',
    name: 'Piotr Wiśniewski',
    age: 28,
    createdAt: new Date('2024-01-17').toISOString(),
    updatedAt: new Date('2024-01-17').toISOString()
  }
]

const users = [...initialUsers]

export class UsersService {
  static async getAllUsers(): Promise<User[]> {
    // Symulacja opóźnienia sieci
    await new Promise(resolve => setTimeout(resolve, 500))
    return users
  }

  static async getUserById(id: string): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return users.find(user => user.id === id) || null
  }

  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const newUser: User = {
      id: (users.length + 1).toString(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    users.push(newUser)
    return newUser
  }

  static async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex === -1) return null
    
    users[userIndex] = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString()
    }
    
    return users[userIndex]
  }

  static async deleteUser(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex === -1) return false
    
    users.splice(userIndex, 1)
    return true
  }
}
