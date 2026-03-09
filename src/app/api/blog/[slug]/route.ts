import { NextResponse } from 'next/server';
import { getPostBySlug, getRelatedPosts } from '@/lib/blog';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const relatedPosts = getRelatedPosts(slug, post.category);

  return NextResponse.json({ post, relatedPosts });
}
