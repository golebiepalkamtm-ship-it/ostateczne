import { UsersService, User } from '../lib/users-service'

export default async function Home() {
  // For static export, provide fallback data
  let users: User[] = [];

  try {
    users = await UsersService.getAllUsers();
  } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    console.warn('Database not available during build, using fallback data');
    users = [];
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center -mt-16">
      <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist-sans)] text-[#333333]">
        Superblog
      </h1>
      <ol className="list-decimal list-inside font-[family-name:var(--font-geist-sans)]">
        {users.length > 0 ? users.map((user) => (
          <li key={user.id} className="mb-2">
            {user.name || user.email}
          </li>
        )) : (
          <li className="mb-2 text-gray-500">No users found (database not available during build)</li>
        )}
      </ol>
    </div>
  );
}
