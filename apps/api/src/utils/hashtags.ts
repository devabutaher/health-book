import { prisma } from "../lib/prisma";

const HASHTAG_REGEX = /#([\w]+)/g;

export function extractHashtags(content: string): string[] {
  const matches = content.match(HASHTAG_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export async function syncPostHashtags(postId: string, content: string | null | undefined) {
  const tags = content ? extractHashtags(content) : [];

  // Remove existing associations
  await prisma.postHashtag.deleteMany({ where: { postId } });

  if (tags.length === 0) return;

  // Upsert each hashtag and create associations
  for (const name of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { name },
      create: { name, postCount: 1 },
      update: {},
    });
    await prisma.postHashtag.create({
      data: { postId, hashtagId: hashtag.id },
    });
  }

  // Recalculate postCount for all affected hashtags
  await prisma.$executeRawUnsafe(
    `UPDATE hashtags SET "postCount" = (SELECT COUNT(*) FROM post_hashtags WHERE "hashtagId" = hashtags."id")`,
  );
}
