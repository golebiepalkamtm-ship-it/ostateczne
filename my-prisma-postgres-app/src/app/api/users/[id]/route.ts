import { NextRequest, NextResponse } from 'next/server'
import { UsersService } from '@/lib/users-service'

interface Params {
  params: Promise<{
    id: string
  }>
}

// GET /api/users/[id] - pobierz konkretnego użytkownika
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const user = await UsersService.getUserById(parseInt(id))
    
    if (!user) {
      return NextResponse.json(
        { error: 'Użytkownik nie został znaleziony' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania użytkownika' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - zaktualizuj użytkownika
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email, name } = body

    const updatedUser = await UsersService.updateUser(parseInt(id), {
      ...(email && { email }),
      ...(name !== undefined && { name })
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Użytkownik nie został znaleziony' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji użytkownika' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - usuń użytkownika
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const success = await UsersService.deleteUser(parseInt(id))

    if (!success) {
      return NextResponse.json(
        { error: 'Użytkownik nie został znaleziony' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Użytkownik został usunięty' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania użytkownika' },
      { status: 500 }
    )
  }
}
