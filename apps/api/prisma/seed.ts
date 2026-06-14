import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

const supabaseUrl = process.env["SUPABASE_URL"] || "";
const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Demo123!";
const NOW = new Date();
const DAY = 86400000;

function daysAgo(n: number) {
  return new Date(NOW.getTime() - n * DAY);
}

function daysFromNow(n: number) {
  return new Date(NOW.getTime() + n * DAY);
}

async function createSupabaseUser(email: string, password: string, name: string, username: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, username },
  });
  if (error) {
    if (error.message.includes("already been registered")) {
      console.log(`  Supabase user ${email} already exists, fetching...`);
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users.find((u) => u.email === email);
      if (found) return found;
    }
    console.error(`  Failed to create Supabase user ${email}:`, error.message);
    return null;
  }
  return data.user;
}

async function main() {
  console.log("Connecting to database...");
  await prisma.$connect();
  console.log("Connected.\n");

  // ─── 1. USERS ───────────────────────────────────────────
  console.log("Creating users...");

  const usersData = [
    { key: "demo", email: "demo@healthbook.app", name: "Demo User", username: "demo", gender: "male", isVerified: true },
    { key: "sarah", email: "sarah@example.com", name: "Sarah Rahman", username: "sarahrahman", gender: "female" },
    { key: "arif", email: "arif@example.com", name: "Arif Hossain", username: "arifhossain", gender: "male" },
    { key: "nusrat", email: "nusrat@example.com", name: "Nusrat Jahan", username: "nusratjahan", gender: "female" },
    { key: "hasan", email: "hasan@example.com", name: "Hasan Mahmud", username: "hasanmahmud", gender: "male" },
  ];

  const userIds: Record<string, string> = {};

  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`  User ${u.email} already exists, skipping.`);
      userIds[u.key] = existing.id;
      continue;
    }

    const supabaseUser = await createSupabaseUser(u.email, DEMO_PASSWORD, u.name, u.username);
    if (!supabaseUser) throw new Error(`Could not create supabase user for ${u.email}`);

    const prismaUser = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: u.email,
        name: u.name,
        username: u.username,
        gender: u.gender,
        isVerified: u.isVerified ?? false,
        bio: await getBio(u.key),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&size=200`,
      },
    });
    userIds[u.key] = prismaUser.id;
    console.log(`  Created user: ${u.email}`);
  }

  // ─── 2. FOLLOWS ─────────────────────────────────────────
  console.log("\nCreating follows...");
  const demoId = userIds["demo"];
  const sarahId = userIds["sarah"];
  const arifId = userIds["arif"];
  const nusratId = userIds["nusrat"];
  const hasanId = userIds["hasan"];

  const followPairs = [
    [demoId, sarahId], [demoId, arifId], [demoId, nusratId], [demoId, hasanId],
    [sarahId, demoId], [sarahId, arifId], [sarahId, nusratId],
    [arifId, demoId], [arifId, sarahId], [arifId, hasanId],
    [nusratId, demoId], [nusratId, sarahId],
    [hasanId, demoId], [hasanId, arifId],
  ];

  for (const [followerId, followingId] of followPairs) {
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!existing) {
      await prisma.follow.create({ data: { followerId, followingId } });
    }
  }
  console.log(`  Created ${followPairs.length} follows`);

  // ─── 3. POSTS ────────────────────────────────────────────
  console.log("\nCreating posts...");
  const postIds: Record<string, string> = {};
  const postData = [
    { key: "p1", userId: demoId, content: "Just completed my morning run! 5K in 25 minutes. Feeling amazing!", mediaUrls: ["https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop"], daysAgo: 1 },
    { key: "p2", userId: demoId, content: "New personal record on deadlifts! 100kg x 5 reps. Consistency pays off 💪", mediaUrls: ["https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600&h=400&fit=crop"], daysAgo: 2 },
    { key: "p3", userId: demoId, content: "Morning routine is getting stronger every day. Wake up at 5AM, meditate 10min, workout 45min. Who else is on this grind?", mediaUrls: [], daysAgo: 3 },
    { key: "p4", userId: demoId, content: "Meal prep Sunday! Grilled chicken, quinoa, roasted veggies for the week. Nutrition is 80% of the battle 🥗", mediaUrls: ["https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop"], daysAgo: 4 },
    { key: "p5", userId: demoId, content: "Anyone else tracking their water intake? I'm at 6 glasses so far today. Goal is 8 💧", mediaUrls: [], daysAgo: 5 },
    { key: "p6", userId: demoId, content: "Proud of this transformation. 3 months of consistent work. The journey continues...", mediaUrls: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop"], daysAgo: 6 },
    { key: "p7", userId: sarahId, content: "Yoga flow this morning was incredible. 30 minutes of pure zen 🧘‍♀️", mediaUrls: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop"], daysAgo: 1 },
    { key: "p8", userId: sarahId, content: "New smoothie recipe: banana, spinach, almond milk, protein powder, peanut butter. Game changer! 🥤", mediaUrls: [], daysAgo: 3 },
    { key: "p9", userId: arifId, content: "Leg day done! Squats, lunges, and calf raises. Walking is going to be fun tomorrow 😅", mediaUrls: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop"], daysAgo: 2 },
    { key: "p10", userId: arifId, content: "Anyone have good book recommendations for habit building?", mediaUrls: ["https://images.unsplash.com/photo-1495440632907-9e56f2e365e3?w=600&h=400&fit=crop"], daysAgo: 5 },
    { key: "p11", userId: nusratId, content: "Evening walk along the lake. Nature is the best therapy 🌅", mediaUrls: ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop"], daysAgo: 1 },
    { key: "p12", userId: nusratId, content: "Hit my 10K steps goal for the 7th day in a row! 🎯", mediaUrls: [], daysAgo: 4 },
  ];

  for (const p of postData) {
    const post = await prisma.post.create({
      data: {
        userId: p.userId,
        content: p.content,
        mediaUrls: p.mediaUrls,
        privacy: "PUBLIC",
        createdAt: daysAgo(p.daysAgo),
      },
    });
    postIds[p.key] = post.id;
    console.log(`  Created post: ${p.content.slice(0, 50)}...`);
  }

  // ─── 4. REACTIONS ────────────────────────────────────────
  console.log("\nCreating reactions...");
  const reactions = [
    { userId: sarahId, postId: postIds["p1"], type: "CLAP" as const },
    { userId: arifId, postId: postIds["p1"], type: "FIRE" as const },
    { userId: nusratId, postId: postIds["p1"], type: "INSPIRED" as const },
    { userId: hasanId, postId: postIds["p2"], type: "STRONG" as const },
    { userId: sarahId, postId: postIds["p2"], type: "HUNDRED" as const },
    { userId: arifId, postId: postIds["p3"], type: "LOVE" as const },
    { userId: nusratId, postId: postIds["p3"], type: "KEEP_IT_UP" as const },
    { userId: hasanId, postId: postIds["p4"], type: "HEALING" as const },
    { userId: sarahId, postId: postIds["p5"], type: "CLAP" as const },
    { userId: arifId, postId: postIds["p6"], type: "FIRE" as const },
    { userId: nusratId, postId: postIds["p6"], type: "INSPIRED" as const },
    { userId: demoId, postId: postIds["p7"], type: "LOVE" as const },
    { userId: demoId, postId: postIds["p9"], type: "FIRE" as const },
    { userId: demoId, postId: postIds["p11"], type: "HEALING" as const },
  ];
  for (const r of reactions) {
    const exists = await prisma.reaction.findUnique({
      where: { postId_userId: { postId: r.postId, userId: r.userId } },
    });
    if (!exists) {
      await prisma.reaction.create({ data: r });
    }
  }
  console.log(`  Created ${reactions.length} reactions`);

  // ─── 5. COMMENTS ────────────────────────────────────────
  console.log("\nCreating comments...");
  const commentData: { userId: string; postId: string; content: string; parentId?: string }[] = [
    { userId: sarahId, postId: postIds["p1"], content: "Amazing pace! I need to get back to running too 🏃‍♀️" },
    { userId: arifId, postId: postIds["p1"], content: "Solid time brother! 💪" },
    { userId: nusratId, postId: postIds["p2"], content: "100kg is insane! You're a beast 🔥" },
    { userId: hasanId, postId: postIds["p3"], content: "I'm in! Already waking up at 5:30. Baby steps." },
    { userId: sarahId, postId: postIds["p4"], content: "Your meal prep looks amazing! Share the recipe?" },
    { userId: nusratId, postId: postIds["p5"], content: "I use an app to track mine. So helpful!" },
    { userId: arifId, postId: postIds["p6"], content: "Incredible transformation man! What's your secret?" },
    { userId: demoId, postId: postIds["p7"], content: "Love your yoga routine! Which poses do you focus on?" },
    { userId: demoId, postId: postIds["p9"], content: "Leg day = best day! 💪" },
    { userId: demoId, postId: postIds["p11"], content: "Beautiful view! Where is this lake?" },
  ];

  const commentIds: string[] = [];
  for (const c of commentData) {
    const comment = await prisma.comment.create({ data: c });
    commentIds.push(comment.id);
  }

  // Reply to comment on p4
  await prisma.comment.create({
    data: {
      userId: demoId,
      postId: postIds["p4"],
      content: "Sure! It's quite simple actually. I'll DM you the recipe.",
      parentId: commentIds[4],
    },
  });

  console.log(`  Created ${commentData.length + 1} comments`);

  // ─── 6. HEALTH LOGS ─────────────────────────────────────
  console.log("\nCreating health logs...");

  const healthLogs = [
    { userId: demoId, type: "ROUTINE" as const, date: daysAgo(1), data: { wakeTime: "05:00", sleepTime: "22:00", meals: ["Breakfast: Oats & Protein Shake", "Lunch: Chicken Rice & Vegetables", "Dinner: Grilled Fish & Salad"], waterGlasses: 8, screenTime: "2h" }, score: 85 },
    { userId: demoId, type: "ROUTINE" as const, date: daysAgo(3), data: { wakeTime: "05:30", sleepTime: "23:00", meals: ["Breakfast: Eggs & Toast", "Lunch: Beef Curry & Rice", "Dinner: Light Salad"], waterGlasses: 6, screenTime: "3h" }, score: 70 },
    { userId: demoId, type: "GOAL" as const, date: daysAgo(1), data: { title: "Run 5K Daily", target: 5, unit: "km", progress: 100, completed: true }, score: 90 },
    { userId: demoId, type: "GOAL" as const, date: daysAgo(2), data: { title: "Read 20 Pages Daily", target: 20, unit: "pages", progress: 100, completed: true }, score: 95 },
    { userId: demoId, type: "WORKOUT" as const, date: daysAgo(0), data: { activity: "Morning Run", duration: 30, calories: 350, intensity: "high", notes: "Outdoor run in the park" }, score: 88 },
    { userId: demoId, type: "WORKOUT" as const, date: daysAgo(2), data: { activity: "Upper Body Weights", duration: 45, calories: 280, sets: 4, reps: 10, intensity: "high", notes: "Chest & Triceps focus" }, score: 82 },
    { userId: demoId, type: "MOOD" as const, date: daysAgo(0), data: { mood: "great", emoji: "🔥", gratitude: "Grateful for my health and discipline", reflection: "Best workout week ever", stress: 2 }, score: 92 },
    { userId: demoId, type: "MOOD" as const, date: daysAgo(2), data: { mood: "good", emoji: "💪", gratitude: "Productive work day", reflection: "Felt strong during workout", stress: 3 }, score: 80 },
    { userId: demoId, type: "QUICK" as const, date: daysAgo(0), data: { type: "water", value: 8, unit: "glasses" }, score: 100 },
    { userId: demoId, type: "QUICK" as const, date: daysAgo(1), data: { type: "sleep", value: 7.5, unit: "hours" }, score: 75 },
  ];

  for (const h of healthLogs) {
    await prisma.healthLog.create({ data: h });
  }
  console.log(`  Created ${healthLogs.length} health logs`);

  // Weight log
  await prisma.weightLog.create({
    data: { userId: demoId, weight: 75, bodyFat: 15, date: daysAgo(2) },
  });
  console.log("  Created 1 weight log");

  // ─── 7. GROUP ────────────────────────────────────────────
  console.log("\nCreating group...");

  const group = await prisma.group.create({
    data: {
      name: "FitFam Bangladesh",
      description: "A community for fitness enthusiasts in Bangladesh! Share your workouts, tips, and motivate each other. All fitness levels welcome 🏋️‍♂️",
      type: "PUBLIC",
      createdById: demoId,
    },
  });

  const groupMembers = [
    { groupId: group.id, userId: demoId, role: "ADMIN" as const },
    { groupId: group.id, userId: sarahId, role: "MEMBER" as const },
    { groupId: group.id, userId: arifId, role: "MEMBER" as const },
    { groupId: group.id, userId: nusratId, role: "MEMBER" as const },
    { groupId: group.id, userId: hasanId, role: "MEMBER" as const },
  ];
  for (const m of groupMembers) {
    await prisma.groupMember.create({ data: m });
  }
  console.log(`  Created group "${group.name}" with ${groupMembers.length} members`);

  // Group post
  await prisma.post.create({
    data: {
      userId: demoId,
      groupId: group.id,
      content: "Welcome to FitFam Bangladesh! 🎉 This is a space for everyone passionate about fitness. Introduce yourself and share your fitness goals!",
      privacy: "PUBLIC",
      createdAt: daysAgo(7),
    },
  });
  console.log("  Created group welcome post");

  // Group poll
  const poll = await prisma.groupPoll.create({
    data: {
      groupId: group.id,
      createdById: demoId,
      question: "What's your preferred workout time?",
      options: ["Morning 5-7AM", "Mid-day 12-2PM", "Evening 5-8PM", "Night 9-11PM"],
    },
  });
  const pollVotes = [
    { pollId: poll.id, userId: demoId, optionIndex: 0 },
    { pollId: poll.id, userId: sarahId, optionIndex: 0 },
    { pollId: poll.id, userId: arifId, optionIndex: 2 },
    { pollId: poll.id, userId: nusratId, optionIndex: 1 },
    { pollId: poll.id, userId: hasanId, optionIndex: 2 },
  ];
  for (const v of pollVotes) {
    await prisma.groupPollVote.create({ data: v });
  }
  console.log("  Created group poll with votes");

  // Group event
  const event = await prisma.groupEvent.create({
    data: {
      groupId: group.id,
      createdById: demoId,
      title: "Monthly Group Run - Dhaka University Campus",
      description: "Come join us for our monthly group run! We'll meet at the central library and run 5K together. All paces welcome!",
      date: daysFromNow(7),
      location: "Dhaka University Campus, Central Library",
    },
  });
  await prisma.groupEventRSVP.create({ data: { eventId: event.id, userId: demoId, status: "GOING" } });
  await prisma.groupEventRSVP.create({ data: { eventId: event.id, userId: sarahId, status: "GOING" } });
  await prisma.groupEventRSVP.create({ data: { eventId: event.id, userId: arifId, status: "MAYBE" } });
  console.log("  Created group event with RSVPs");

  // ─── 8. CHALLENGE ────────────────────────────────────────
  console.log("\nCreating challenge...");

  const challengeStart = daysAgo(10);
  const challengeEnd = daysFromNow(20);

  const challenge = await prisma.challenge.create({
    data: {
      title: "30-Day Morning Workout Challenge",
      description: "Complete a morning workout every day for 30 days! Whether it's a run, yoga, weights, or bodyweight exercises — just move your body within 1 hour of waking up. Let's build the habit together! 🔥",
      type: "SOLO",
      groupId: group.id,
      createdById: demoId,
      startDate: challengeStart,
      endDate: challengeEnd,
      category: "FITNESS",
      difficulty: "BEGINNER",
      dayCount: 30,
      goalTarget: 30,
      goalUnit: "sessions",
      milestones: [
        { name: "Bronze", threshold: 7, icon: "🥉" },
        { name: "Silver", threshold: 15, icon: "🥈" },
        { name: "Gold", threshold: 21, icon: "🥇" },
        { name: "Champion", threshold: 30, icon: "🏆" },
      ],
    },
  });

  // Day plans
  const dayPlans = [
    { dayNumber: 1, title: "Start Slow", description: "Begin with a 15-minute light workout. Walk, jog, or do basic stretches.", tips: "Don't push too hard on day 1. The goal is to build the habit." },
    { dayNumber: 2, title: "Add 5 Minutes", description: "Increase to 20 minutes today. Try bodyweight exercises: squats, push-ups, lunges.", tips: "Focus on form over speed." },
    { dayNumber: 3, title: "Mix It Up", description: "Try a different type of workout today. If you ran yesterday, try yoga or strength today.", tips: "Variety keeps it interesting and works different muscles." },
    { dayNumber: 4, title: "Find Your Pace", description: "30-minute workout today. Find a pace you can sustain comfortably.", tips: "You should be able to hold a conversation while exercising." },
    { dayNumber: 5, title: "Rest & Recover", description: "Active recovery day. Light stretching or a 15-minute walk.", tips: "Recovery is just as important as the workout itself!" },
  ];
  for (const dp of dayPlans) {
    await prisma.challengeDayPlan.create({
      data: { challengeId: challenge.id, ...dp },
    });
  }
  console.log("  Created 5 day plans");

  // Participants
  await prisma.challengeParticipant.create({
    data: { challengeId: challenge.id, userId: demoId, score: 10, currentDayNumber: 11, totalValue: 10 },
  });
  await prisma.challengeParticipant.create({
    data: { challengeId: challenge.id, userId: sarahId, score: 8, currentDayNumber: 9, totalValue: 8 },
  });
  await prisma.challengeParticipant.create({
    data: { challengeId: challenge.id, userId: arifId, score: 5, currentDayNumber: 6, totalValue: 5 },
  });
  console.log("  Created 3 participants");

  // Day entries for demo user (days 1-10, all completed)
  for (let day = 1; day <= 10; day++) {
    await prisma.challengeDayEntry.create({
      data: {
        challengeId: challenge.id,
        userId: demoId,
        dayNumber: day,
        completed: true,
        notes: `Day ${day} workout completed! Feeling great 💪`,
        value: 1,
        completedAt: daysAgo(10 - day),
      },
    });
  }
  console.log("  Created 10 challenge day entries for demo user");

  // Activities
  const activities = [
    { userId: demoId, type: "JOIN", message: "Joined the 30-Day Morning Workout Challenge!" },
    { userId: sarahId, type: "JOIN", message: "Sarah Rahman joined the challenge!" },
    { userId: arifId, type: "JOIN", message: "Arif Hossain joined the challenge!" },
    { userId: demoId, type: "CHECK_IN", message: "Completed Day 1 - Morning run 20min ✅", metadata: { dayNumber: 1 } },
    { userId: demoId, type: "CHECK_IN", message: "Completed Day 7 - First week done! 🥉", metadata: { dayNumber: 7, milestoneName: "Bronze" } },
    { userId: demoId, type: "MILESTONE", message: "Earned Bronze badge! 7 days streak 🔥", metadata: { milestoneName: "Bronze" } },
  ];
  for (const a of activities) {
    await prisma.challengeActivity.create({
      data: { challengeId: challenge.id, ...a },
    });
  }
  console.log("  Created challenge activities");

  // Challenge comments
  await prisma.challengeComment.create({
    data: { challengeId: challenge.id, userId: sarahId, content: "This challenge is exactly what I needed! Day 3 and feeling great 💪" },
  });
  await prisma.challengeComment.create({
    data: { challengeId: challenge.id, userId: demoId, content: "Love the energy Sarah! Keep pushing! 🔥" },
  });
  await prisma.challengeComment.create({
    data: { challengeId: challenge.id, userId: arifId, content: "Day 5 here! This is getting easier. Loving the routine!" },
  });
  console.log("  Created 3 challenge comments");

  // ─── 9. CONVERSATIONS & MESSAGES ────────────────────────
  console.log("\nCreating conversations...");

  // Conversation 1: demo ↔ sarah
  const conv1 = await prisma.conversation.create({ data: {} });
  await prisma.conversationParticipant.create({ data: { conversationId: conv1.id, userId: demoId } });
  await prisma.conversationParticipant.create({ data: { conversationId: conv1.id, userId: sarahId } });

  const msgs1 = [
    { senderId: sarahId, content: "Hey! Loved your post about the morning routine! I've been trying to wake up earlier too." },
    { senderId: demoId, content: "Thanks Sarah! The key is consistency. Start with 15 minutes earlier each week." },
    { senderId: sarahId, content: "That's great advice! I'll try that. How long did it take you to adjust?" },
    { senderId: demoId, content: "About 2-3 weeks actually. Now my body just wakes up naturally at 5AM." },
    { senderId: sarahId, content: "Goals! 🔥 Do you have any tips for the first week?" },
    { senderId: demoId, content: "Put your alarm across the room. And have a reason to get up — I look forward to my coffee ☕" },
    { senderId: sarahId, content: "Haha, coffee is a great motivator! I'll try the alarm trick tomorrow!" },
  ];
  for (const m of msgs1) {
    await prisma.message.create({ data: { conversationId: conv1.id, ...m } });
  }
  console.log("  Created conversation: demo ↔ sarah (7 messages)");

  // Conversation 2: demo ↔ arif
  const conv2 = await prisma.conversation.create({ data: {} });
  await prisma.conversationParticipant.create({ data: { conversationId: conv2.id, userId: demoId } });
  await prisma.conversationParticipant.create({ data: { conversationId: conv2.id, userId: arifId } });

  const msgs2 = [
    { senderId: arifId, content: "Bro that deadlift PR was insane! 100kg?! 🤯" },
    { senderId: demoId, content: "Thanks man! Consistency is key. Been working on it for months." },
    { senderId: arifId, content: "Incredible! I'm stuck at 70kg. Any tips?" },
    { senderId: demoId, content: "Focus on form first. And progressive overload — add 2.5kg each week." },
  ];
  for (const m of msgs2) {
    await prisma.message.create({ data: { conversationId: conv2.id, ...m } });
  }
  console.log("  Created conversation: demo ↔ arif (4 messages)");

  // Conversation 3: demo ↔ nusrat
  const conv3 = await prisma.conversation.create({ data: {} });
  await prisma.conversationParticipant.create({ data: { conversationId: conv3.id, userId: demoId } });
  await prisma.conversationParticipant.create({ data: { conversationId: conv3.id, userId: nusratId } });

  const msgs3 = [
    { senderId: nusratId, content: "Your meal prep game is on another level! Can you share the quinoa recipe?" },
    { senderId: demoId, content: "Thanks Nusrat! It's super simple actually. I'll send it over." },
    { senderId: nusratId, content: "Please do! I've been looking for healthy meal prep ideas." },
    { senderId: demoId, content: "Just sent it! Let me know how it turns out 😊" },
  ];
  for (const m of msgs3) {
    await prisma.message.create({ data: { conversationId: conv3.id, ...m } });
  }
  console.log("  Created conversation: demo ↔ nusrat (4 messages)");

  // ─── 10. STORIES ──────────────────────────────────────────
  console.log("\nCreating stories...");

  const storyExpiresAt = daysFromNow(1);

  const story1 = await prisma.story.create({
    data: {
      userId: demoId,
      type: "text",
      privacy: "public",
      textOverlay: "Morning run complete! 🏃‍♂️ 5K done before breakfast",
      backgroundColor: "#1a1a2e",
      textColor: "#ffffff",
      textPosition: "center",
      expiresAt: storyExpiresAt,
    },
  });

  const story2 = await prisma.story.create({
    data: {
      userId: demoId,
      type: "poll",
      privacy: "public",
      stickerData: { question: "Which workout is best for fat loss?", options: ["Cardio", "Weights", "HIIT", "Yoga"] },
      backgroundColor: "#16213e",
      textColor: "#ffffff",
      expiresAt: storyExpiresAt,
    },
  });

  const story3 = await prisma.story.create({
    data: {
      userId: demoId,
      type: "text",
      privacy: "public",
      textOverlay: "Consistency > Intensity. Small daily habits beat huge weekly efforts. 🔑",
      backgroundColor: "#0f3460",
      textColor: "#ffffff",
      textPosition: "center",
      expiresAt: storyExpiresAt,
    },
  });
  console.log("  Created 3 stories for demo user");

  // Story views
  const storyViews = [
    { storyId: story1.id, userId: sarahId },
    { storyId: story1.id, userId: arifId },
    { storyId: story1.id, userId: nusratId },
    { storyId: story1.id, userId: hasanId },
    { storyId: story2.id, userId: sarahId },
    { storyId: story2.id, userId: arifId },
    { storyId: story3.id, userId: sarahId },
    { storyId: story3.id, userId: nusratId },
  ];
  for (const sv of storyViews) {
    await prisma.storyView.create({ data: sv });
  }
  console.log("  Created 8 story views");

  // Story reactions (emoji)
  await prisma.storyReaction.create({ data: { storyId: story1.id, userId: sarahId, emoji: "🔥" } });
  await prisma.storyReaction.create({ data: { storyId: story1.id, userId: nusratId, emoji: "💪" } });
  await prisma.storyReaction.create({ data: { storyId: story3.id, userId: sarahId, emoji: "🙌" } });
  console.log("  Created 3 story reactions");

  // Story poll votes
  await prisma.storyPollVote.create({ data: { storyId: story2.id, userId: sarahId, optionIndex: 2 } });
  await prisma.storyPollVote.create({ data: { storyId: story2.id, userId: arifId, optionIndex: 0 } });
  await prisma.storyPollVote.create({ data: { storyId: story2.id, userId: nusratId, optionIndex: 1 } });
  await prisma.storyPollVote.create({ data: { storyId: story2.id, userId: hasanId, optionIndex: 2 } });
  console.log("  Created 4 story poll votes");

  // Story likes
  await prisma.storyLike.create({ data: { storyId: story1.id, userId: sarahId } });
  await prisma.storyLike.create({ data: { storyId: story1.id, userId: nusratId } });
  await prisma.storyLike.create({ data: { storyId: story3.id, userId: arifId } });
  console.log("  Created 3 story likes");

  // ─── 11. REEL ──────────────────────────────────────────────
  console.log("\nCreating reel...");

  const reel = await prisma.reel.create({
    data: {
      userId: demoId,
      videoUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop",
      caption: "Morning run motivation! 🏃‍♂️ Consistency is key #fitness #morningroutine #health #bangladesh",
      thumbnailUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop",
    },
  });

  // Reel likes
  await prisma.reelLike.create({ data: { reelId: reel.id, userId: sarahId } });
  await prisma.reelLike.create({ data: { reelId: reel.id, userId: arifId } });
  await prisma.reelLike.create({ data: { reelId: reel.id, userId: nusratId } });
  console.log("  Created 3 reel likes");

  // Reel comments
  await prisma.reelComment.create({
    data: { reelId: reel.id, userId: sarahId, content: "Love this! Need to get back to running 🏃‍♀️" },
  });
  await prisma.reelComment.create({
    data: { reelId: reel.id, userId: arifId, content: "Fire content bro! 🔥" },
  });
  console.log("  Created 2 reel comments");

  // ─── 12. SAVED POSTS ──────────────────────────────────────
  console.log("\nCreating saved posts...");
  await prisma.savedPost.create({ data: { userId: demoId, postId: postIds["p7"] } });
  await prisma.savedPost.create({ data: { userId: demoId, postId: postIds["p11"] } });
  console.log("  Created 2 saved posts");

  // ─── 13. NOTIFICATIONS ────────────────────────────────────
  console.log("\nCreating notifications...");

  const notifications = [
    { type: "NEW_FOLLOWER" as const, userId: demoId, fromUserId: sarahId, message: "Sarah Rahman started following you" },
    { type: "NEW_FOLLOWER" as const, userId: demoId, fromUserId: arifId, message: "Arif Hossain started following you" },
    { type: "NEW_FOLLOWER" as const, userId: demoId, fromUserId: nusratId, message: "Nusrat Jahan started following you" },
    { type: "NEW_FOLLOWER" as const, userId: demoId, fromUserId: hasanId, message: "Hasan Mahmud started following you" },
    { type: "POST_REACTION" as const, userId: demoId, fromUserId: sarahId, postId: postIds["p1"], message: "Sarah Rahman reacted Clap to your post" },
    { type: "POST_REACTION" as const, userId: demoId, fromUserId: arifId, postId: postIds["p1"], message: "Arif Hossain reacted Fire to your post" },
    { type: "POST_COMMENT" as const, userId: demoId, fromUserId: sarahId, postId: postIds["p1"], message: "Sarah Rahman commented: Amazing pace!" },
    { type: "POST_COMMENT" as const, userId: demoId, fromUserId: arifId, postId: postIds["p1"], message: "Arif Hossain commented: Solid time brother!" },
    { type: "POST_COMMENT" as const, userId: demoId, fromUserId: nusratId, postId: postIds["p2"], message: "Nusrat Jahan commented: 100kg is insane!" },
    { type: "MESSAGE" as const, userId: demoId, fromUserId: sarahId, message: "Sarah Rahman sent you a message" },
    { type: "MESSAGE" as const, userId: demoId, fromUserId: arifId, message: "Arif Hossain sent you a message" },
    { type: "MESSAGE" as const, userId: demoId, fromUserId: nusratId, message: "Nusrat Jahan sent you a message" },
  ];
  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }
  console.log(`  Created ${notifications.length} notifications`);

  console.log("\n✅ Seed complete! Data summary:");
  console.log(`  5 users created`);
  console.log(`  ${followPairs.length} follows`);
  console.log(`  12 posts created`);
  console.log(`  14 reactions`);
  console.log(`  11 comments (1 reply)`);
  console.log(`  10 health logs + 1 weight log`);
  console.log(`  1 group with 5 members, 1 poll, 1 event`);
  console.log(`  1 challenge with 3 participants, 10 day entries`);
  console.log(`  3 conversations with 15 messages`);
  console.log(`  3 stories with views, reactions, poll votes, likes`);
  console.log(`  1 reel with likes and comments`);
  console.log(`  2 saved posts`);
  console.log(`  12 notifications`);
  console.log(`\n📧 Demo login: demo@healthbook.app / ${DEMO_PASSWORD}`);
}

async function getBio(key: string): Promise<string | undefined> {
  const bios: Record<string, string> = {
    demo: "Fitness enthusiast | Morning person | Deadlift 100kg 💪 | Building healthier habits every day",
    sarah: "Yoga lover 🧘‍♀️ | Smoothie queen 🥤 | On a journey to better health",
    arif: "Gym rat 🏋️‍♂️ | Trying to get those gains | Leg day enthusiast",
    nusrat: "Nature walker 🌅 | Step goal crusher 🎯 | Mental health matters",
    hasan: "Fitness newbie but loving the journey | Every rep counts",
  };
  return bios[key] || undefined;
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
