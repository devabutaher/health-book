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
  {
    title: "Walking 8,000 steps a week can lower dementia risk, study finds",
    source: "WHO",
    url: "https://www.who.int/news-room/walking-dementia-2025",
    imageUrl: null,
    category: "fitness",
    publishedAt: new Date("2025-04-10"),
  },
  {
    title: "How intermittent fasting affects your metabolism after 40",
    source: "Healthline",
    url: "https://www.healthline.com/nutrition/intermittent-fasting-metabolism",
    imageUrl: null,
    category: "nutrition",
    publishedAt: new Date("2025-04-12"),
  },
  {
    title: "Bangladesh launches national mental health helpline",
    source: "DGHS",
    url: "https://www.dghs.gov.bd/mental-health-helpline",
    imageUrl: null,
    category: "mental_health",
    publishedAt: new Date("2025-04-08"),
  },
  {
    title: "Brisk walking for 30 minutes daily cuts heart disease risk by 35%",
    source: "AHA",
    url: "https://www.heart.org/en/news/brisk-walking-heart-health",
    imageUrl: null,
    category: "fitness",
    publishedAt: new Date("2025-04-15"),
  },
  {
    title: "COVID-19 subvariant JN.1: Symptoms and prevention tips",
    source: "CDC",
    url: "https://www.cdc.gov/covid/jn1-variant-2025",
    imageUrl: null,
    category: "general",
    publishedAt: new Date("2025-04-14"),
  },
  {
    title: "Probiotics vs prebiotics: What the science actually says",
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/probiotics-prebiotics",
    imageUrl: null,
    category: "nutrition",
    publishedAt: new Date("2025-04-06"),
  },
  {
    title: "Tea drinkers have lower risk of type 2 diabetes, study shows",
    source: "Healthline",
    url: "https://www.healthline.com/nutrition/tea-diabetes-risk",
    imageUrl: null,
    category: "nutrition",
    publishedAt: new Date("2025-04-11"),
  },
  {
    title: "Posture correction: Simple exercises for desk workers",
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/posture-exercises",
    imageUrl: null,
    category: "fitness",
    publishedAt: new Date("2025-04-03"),
  },
  {
    title: "Digital detox: How screen time affects sleep quality",
    source: "CDC",
    url: "https://www.cdc.gov/sleep/digital-detox",
    imageUrl: null,
    category: "general",
    publishedAt: new Date("2025-03-28"),
  },
  {
    title: "Omega-3 fatty acids: Best food sources for brain health",
    source: "AHA",
    url: "https://www.heart.org/en/healthy-living/omega3-brain-health",
    imageUrl: null,
    category: "nutrition",
    publishedAt: new Date("2025-03-30"),
  },
  {
    title: "How to build a sustainable home workout routine",
    source: "WHO",
    url: "https://www.who.int/news-room/home-workout-guide",
    imageUrl: null,
    category: "fitness",
    publishedAt: new Date("2025-04-02"),
  },
];

export async function seedNews() {
  for (const article of articles) {
    const existing = await prisma.newsArticle.findFirst({ where: { url: article.url } });
    if (!existing) {
      await prisma.newsArticle.create({ data: article });
    }
  }
  const total = await prisma.newsArticle.count();
  console.log(`Seeded ${articles.length} articles (total in DB: ${total})`);
}

seedNews()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
