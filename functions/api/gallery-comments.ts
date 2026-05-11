
// Gallery Comments API
type D1Database = any;
type PagesFunction<T, P = any> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);

  const headers = { 'Content-Type': 'application/json' };

  // GET: List comments for a gallery item
  if (request.method === 'GET') {
    try {
      const galleryId = url.searchParams.get('galleryId');
      if (!galleryId) {
        return new Response(JSON.stringify({ error: 'galleryId required' }), { status: 400, headers });
      }

      const { results } = await env.DB.prepare(
        'SELECT * FROM gallery_comments WHERE gallery_id = ? ORDER BY created_at DESC'
      ).bind(galleryId).all();

      return new Response(JSON.stringify(results.map((c: any) => ({
        id: c.id,
        galleryId: c.gallery_id,
        authorName: c.author_name,
        authorId: c.author_id,
        authorImage: c.author_image,
        content: c.content,
        likesCount: c.likes_count || 0,
        dislikesCount: c.dislikes_count || 0,
        createdAt: c.created_at
      }))), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  // POST: Create a comment
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { galleryId, authorName, content } = body;
      const authorId = body.authorId || body.author_id;
      const authorImage = body.authorImage || body.author_image;

      if (!galleryId || !authorName || !authorId || !content) {
        return new Response(JSON.stringify({ error: 'galleryId, authorName, authorId, and content required' }), { status: 400, headers });
      }

      const newId = crypto.randomUUID();
      await env.DB.prepare(
        'INSERT INTO gallery_comments (id, gallery_id, author_name, author_id, author_image, content) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newId, galleryId, authorName, authorId, authorImage || null, content).run();

      // Update comments_count on gallery
      const countResult = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM gallery_comments WHERE gallery_id = ?'
      ).bind(galleryId).first();

      await env.DB.prepare(
        'UPDATE gallery SET comments_count = ? WHERE id = ?'
      ).bind(countResult?.count || 0, galleryId).run();

      return new Response(JSON.stringify({
        success: true,
        id: newId,
        commentsCount: countResult?.count || 0
      }), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  // DELETE: Remove a comment
  if (request.method === 'DELETE') {
    try {
      const commentId = url.searchParams.get('id');
      if (!commentId) {
        return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
      }

      // Get gallery_id before deletion for count update
      const comment = await env.DB.prepare(
        'SELECT gallery_id FROM gallery_comments WHERE id = ?'
      ).bind(commentId).first();

      await env.DB.prepare(
        'DELETE FROM gallery_comments WHERE id = ?'
      ).bind(commentId).run();

      if (comment) {
        const countResult = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM gallery_comments WHERE gallery_id = ?'
        ).bind(comment.gallery_id).first();

        await env.DB.prepare(
          'UPDATE gallery SET comments_count = ? WHERE id = ?'
        ).bind(countResult?.count || 0, comment.gallery_id).run();
      }

      return new Response(JSON.stringify({ success: true }), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};
