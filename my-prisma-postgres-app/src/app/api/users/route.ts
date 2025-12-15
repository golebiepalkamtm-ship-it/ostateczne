import { NextRequest, NextResponse } from 'next/server'
import { UsersService } from '@/lib/users-service'

// GET /api/users - pobierz wszystkich użytkowników
export async function GET() {
  try {
    const users = await UsersService.getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania użytkowników' },
      { status: 500 }
    )
  }
}

// POST /api/users - utwórz nowego użytkownika
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    // Walidacja podstawowych danych
    if (!email) {
      return NextResponse.json(
        { error: 'Email jest wymagany' },
        { status: 400 }
      )
    }

    const newUser = await UsersService.createUser({
      email,
      name: name || null
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia użytkownika' },
      { status: 500 }
    )
  }
}
