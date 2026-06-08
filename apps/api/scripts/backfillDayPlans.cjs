// Backfill: create default day plans for existing challenges with no plans
// Usage: node scripts/backfillDayPlans.cjs

const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

async function main() {
  const challenges = await prisma.challenge.findMany({
    where: {
      dayPlans: { none: {} },
      dayCount: { gt: 0 },
    },
    select: { id: true, dayCount: true, title: true },
  });

  console.log(`Found ${challenges.length} challenges without day plans`);

  let total = 0;
  for (const c of challenges) {
    const plans = Array.from({ length: c.dayCount }, (_, i) => ({
      challengeId: c.id,
      dayNumber: i + 1,
      title: `Day ${i + 1}`,
    }));
    await prisma.challengeDayPlan.createMany({ data: plans });
    total += plans.length;
    console.log(`  ${c.title}: ${c.dayCount} plans`);
  }

  console.log(`\nCreated ${total} day plans across ${challenges.length} challenges`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
