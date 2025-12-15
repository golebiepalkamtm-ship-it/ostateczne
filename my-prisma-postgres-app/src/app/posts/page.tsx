import prisma from '../../lib/prisma'

interface PostWithAuthor {
  id: number;
  title: string;
  content: string | null;
  published: boolean;
  authorId: number;
  author: {
    id: number;
    email: string;
    name: string | null;
  } | null;
}

export default async function Posts() {
  let posts: PostWithAuthor[] = [];

  try {
    posts = await prisma.post.findMany({
      include: {
        author: true,
      },
    });
  } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    console.warn('Database not available during build, using fallback data');
    posts = [];
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center -mt-16 text-[#333333]">
      <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist-sans)]">
        Posts
      </h1>
      <ul className="font-[family-name:var(--font-geist-sans)] max-w-2xl space-y-4">
        {posts.length > 0 ? posts.map((post) => (
          <li key={post.id}>
            <span className="font-semibold">{post.title}</span>
            <span className="text-sm text-gray-600 ml-2">
              by {post.author?.name || post.author?.email || 'Unknown'}
            </span>
          </li>
        )) : (
          <li className="text-gray-500">No posts found (database not available during build)</li>
        )}
      </ul>
    </div>
  );
}
