import { prisma } from "../src/lib/prisma";

const articles = [
  {
    title: "WHO launches new global health guidelines for 2025",
    source: "WHO",
    url: "https://www.who.int/news-room/guidelines-2025",
    imageUrl: null,
    category: "general",
    publishedAt: new Date("2025-01-15"),
  },
  {
    title: "Benefits of regular exercise: CDC updates recommendations",
    source: "CDC",
    url: "https://www.cdc.gov/physicalactivity/basics",
    imageUrl: null,
    category: "fitness",
    publishedAt: new Date("2025-02-10"),
  },
  {
    title: "New study reveals link between gut health and mental wellbeing",
    source: "Healthline",
    url: "https://www.healthline.com/nutrition/gut-brain-connection",
    imageUrl: null,
    category: "mental_health",
    publishedAt: new Date("2025-03-05"),
  },
  {
    title: "FDA approves new weight loss drug for broader use",
    source: "FDA",
    url: "https://www.fda.gov/news-events/drug-approvals",
    imageUrl: null,
    category: "general",
    publishedAt: new Date("2025-03-12"),
  },
  {
    title: "American Heart Association releases updated dietary guidelines",
    source: "AHA",
    url: "https://www.heart.org/en/healthy-living/healthy-eating",
    imageUrl: null,
    category: "nutrition",
    publishedAt: new Date("2025-02-28"),
  },
  {
    title: "Meditation and mindfulness: Proven benefits for stress reduction",
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/stress-management",
    imageUrl: null,
    category: "mental_health",
    publishedAt: new Date("2025-01-20"),
  },
  {
    title: "WHO recommends 150 minutes of moderate exercise per week",
    source: "WHO",
    url: "https://www.who.int/news-room/physical-activity",
    imageUrl: null,
    category: "fitness",
    publishedAt: new Date("2025-04-01"),
  },
  {
    title: "Vitamin D deficiency: Symptoms, causes, and prevention",
    source: "Healthline",
    url: "https://www.healthline.com/nutrition/vitamin-d-deficiency",
    imageUrl: null,
    category: "nutrition",
    publishedAt: new Date("2025-03-18"),
  },
  {
    title: "Sleep science: How quality rest affects your health",
    source: "CDC",
    url: "https://www.cdc.gov/sleep/about_sleep",
    imageUrl: null,
    category: "general",
    publishedAt: new Date("2025-02-14"),
  },
  {
    title: "New research shows HIIT workouts improve cardiovascular health",
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/fitness",
    imageUrl: null,
    category: "fitness",
    publishedAt: new Date("2025-04-05"),
  },
  {
    title: "Plant-based diets: Health benefits and nutritional considerations",
    source: "AHA",
    url: "https://www.heart.org/en/healthy-living/healthy-eating/plant-based",
    imageUrl: null,
    category: "nutrition",
    publishedAt: new Date("2025-03-25"),
  },
  {
    title: "Managing anxiety: Evidence-based techniques that work",
    source: "Healthline",
    url: "https://www.healthline.com/health/anxiety",
    imageUrl: null,
    category: "mental_health",
    publishedAt: new Date("2025-01-30"),
  },
];

export async function seedNews() {
  for (const article of articles) {
    await prisma.newsArticle.upsert({
      where: { url: article.url },
      update: { publishedAt: article.publishedAt },
      create: article,
    });
  }
  console.log(`Seeded ${articles.length} news articles`);
}

seedNews()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
