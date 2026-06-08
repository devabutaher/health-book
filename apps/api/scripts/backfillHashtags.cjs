/**
 * Backfill script: extract hashtags from existing posts and populate
 * the Hashtag + PostHashtag tables.
 *
 * Usage: node scripts/backfillHashtags.cjs
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const HASHTAG_REGEX = /#([\w]+)/g;

function extractHashtags(content) {
  const matches = content.match(HASHTAG_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

async function main() {
  console.log("Fetching all posts with content…");
  const posts = await prisma.post.findMany({
    where: { content: { not: null } },
    select: { id: true, content: true },
  });

  console.log(`Processing ${posts.length} posts…`);

  for (const post of posts) {
    const tags = extractHashtags(post.content);
    if (tags.length === 0) continue;

    for (const name of tags) {
      await prisma.hashtag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      const hashtag = await prisma.hashtag.findUnique({ where: { name } });
      if (!hashtag) continue;

      await prisma.postHashtag
        .create({ data: { postId: post.id, hashtagId: hashtag.id } })
        .catch(() => {
          /* ignore duplicate */
        });
    }
  }

  // Recalculate post counts
  await prisma.$executeRawUnsafe(
    `UPDATE hashtags SET "postCount" = (SELECT COUNT(*) FROM post_hashtags WHERE "hashtagId" = hashtags."id")`,
  );

  const total = await prisma.hashtag.count();
  console.log(`Done. ${total} hashtags indexed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
