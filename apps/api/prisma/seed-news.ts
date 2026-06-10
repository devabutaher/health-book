import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const articles = [
  {
    title: "WHO launches new global health guidelines for 2025",
    source: "WHO",
    url: "https://www.who.int/news-room/guidelines-2025",
    imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop",
    category: "general",
    publishedAt: new Date("2025-01-15"),
  },
  {
    title: "Benefits of regular exercise: CDC updates recommendations",
    source: "CDC",
    url: "https://www.cdc.gov/physicalactivity/basics",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
    category: "fitness",
    publishedAt: new Date("2025-02-10"),
  },
  {
    title: "New study reveals link between gut health and mental wellbeing",
    source: "Healthline",
    url: "https://www.healthline.com/nutrition/gut-brain-connection",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
    category: "mental_health",
    publishedAt: new Date("2025-03-05"),
  },
  {
    title: "FDA approves new weight loss drug for broader use",
    source: "FDA",
    url: "https://www.fda.gov/news-events/drug-approvals",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&h=400&fit=crop",
    category: "general",
    publishedAt: new Date("2025-03-12"),
  },
  {
    title: "American Heart Association releases updated dietary guidelines",
    source: "AHA",
    url: "https://www.heart.org/en/healthy-living/healthy-eating",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop",
    category: "nutrition",
    publishedAt: new Date("2025-02-28"),
  },
  {
    title: "Meditation and mindfulness: Proven benefits for stress reduction",
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/stress-management",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop",
    category: "mental_health",
    publishedAt: new Date("2025-01-20"),
  },
  {
    title: "WHO recommends 150 minutes of moderate exercise per week",
    source: "WHO",
    url: "https://www.who.int/news-room/physical-activity",
    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop",
    category: "fitness",
    publishedAt: new Date("2025-04-01"),
  },
  {
    title: "Vitamin D deficiency: Symptoms, causes, and prevention",
    source: "Healthline",
    url: "https://www.healthline.com/nutrition/vitamin-d-deficiency",
    imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop",
    category: "nutrition",
    publishedAt: new Date("2025-03-18"),
  },
  {
    title: "Sleep science: How quality rest affects your health",
    source: "CDC",
    url: "https://www.cdc.gov/sleep/about_sleep",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop",
    category: "general",
    publishedAt: new Date("2025-02-14"),
  },
  {
    title: "New research shows HIIT workouts improve cardiovascular health",
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/fitness",
    imageUrl: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600&h=400&fit=crop",
    category: "fitness",
    publishedAt: new Date("2025-04-05"),
  },
  {
    title: "Plant-based diets: Health benefits and nutritional considerations",
    source: "AHA",
    url: "https://www.heart.org/en/healthy-living/healthy-eating/plant-based",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
    category: "nutrition",
    publishedAt: new Date("2025-03-25"),
  },
  {
    title: "Managing anxiety: Evidence-based techniques that work",
    source: "Healthline",
    url: "https://www.healthline.com/health/anxiety",
    imageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=400&fit=crop",
    category: "mental_health",
    publishedAt: new Date("2025-01-30"),
  },
  {
    title: "Walking 8,000 steps a week can lower dementia risk, study finds",
    source: "WHO",
    url: "https://www.who.int/news-room/walking-dementia-2025",
    imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop",
    category: "fitness",
    publishedAt: new Date("2025-04-10"),
  },
  {
    title: "How intermittent fasting affects your metabolism after 40",
    source: "Healthline",
    url: "https://www.healthline.com/nutrition/intermittent-fasting-metabolism",
    imageUrl: "https://images.unsplash.com/photo-1526406915895-315b0bb8d0f3?w=600&h=400&fit=crop",
    category: "nutrition",
    publishedAt: new Date("2025-04-12"),
  },
  {
    title: "Bangladesh launches national mental health helpline",
    source: "DGHS",
    url: "https://www.dghs.gov.bd/mental-health-helpline",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop",
    category: "mental_health",
    publishedAt: new Date("2025-04-08"),
  },
  {
    title: "Brisk walking for 30 minutes daily cuts heart disease risk by 35%",
    source: "AHA",
    url: "https://www.heart.org/en/news/brisk-walking-heart-health",
    imageUrl: "https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?w=600&h=400&fit=crop",
    category: "fitness",
    publishedAt: new Date("2025-04-15"),
  },
  {
    title: "COVID-19 subvariant JN.1: Symptoms and prevention tips",
    source: "CDC",
    url: "https://www.cdc.gov/covid/jn1-variant-2025",
    imageUrl: "https://images.unsplash.com/photo-1584036561584-b03c19da874c?w=600&h=400&fit=crop",
    category: "general",
    publishedAt: new Date("2025-04-14"),
  },
  {
    title: "Probiotics vs prebiotics: What the science actually says",
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/probiotics-prebiotics",
    imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=400&fit=crop",
    category: "nutrition",
    publishedAt: new Date("2025-04-06"),
  },
  {
    title: "Tea drinkers have lower risk of type 2 diabetes, study shows",
    source: "Healthline",
    url: "https://www.healthline.com/nutrition/tea-diabetes-risk",
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop",
    category: "nutrition",
    publishedAt: new Date("2025-04-11"),
  },
  {
    title: "Posture correction: Simple exercises for desk workers",
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/posture-exercises",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
    category: "fitness",
    publishedAt: new Date("2025-04-03"),
  },
  {
    title: "Digital detox: How screen time affects sleep quality",
    source: "CDC",
    url: "https://www.cdc.gov/sleep/digital-detox",
    imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop",
    category: "general",
    publishedAt: new Date("2025-03-28"),
  },
  {
    title: "Omega-3 fatty acids: Best food sources for brain health",
    source: "AHA",
    url: "https://www.heart.org/en/healthy-living/omega3-brain-health",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop",
    category: "nutrition",
    publishedAt: new Date("2025-03-30"),
  },
  {
    title: "How to build a sustainable home workout routine",
    source: "WHO",
    url: "https://www.who.int/news-room/home-workout-guide",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop",
    category: "fitness",
    publishedAt: new Date("2025-04-02"),
  },
];

async function main() {
  await prisma.$connect();
  console.log("Connected.");

  for (const article of articles) {
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM news_articles WHERE url = $1 LIMIT 1`,
      article.url,
    );
    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO news_articles (id, title, source, url, "imageUrl", category, "publishedAt", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW())`,
        article.title,
        article.source,
        article.url,
        article.imageUrl,
        article.category,
        article.publishedAt,
      );
    }
  }

  const total = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM news_articles`,
  );
  console.log(`Seeded ${articles.length} articles (total in DB: ${total[0].count})`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
