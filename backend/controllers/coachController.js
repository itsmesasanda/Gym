import Groq from "groq-sdk";
import axios from "axios";
import CoachConversation from "../models/CoachConversation.js";
import WorkoutPlan from "../models/WorkoutPlan.js";

let _groq = null;
const groq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

const WORKOUT_RAG_URL = process.env.WORKOUT_RAG_URL || process.env.RAG_SERVICE_URL || "http://localhost:8002";
const WORKOUT_RAG_API_KEY = process.env.WORKOUT_RAG_API_KEY || "";
const COACH_MODEL     = "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_HISTORY     = 10;
const DAILY_LIMIT     = 20;

// In-memory daily rate limiter — resets each calendar day per user
const rateLimitStore = new Map(); // email -> { count, date }

const checkRateLimit = (email) => {
  const today = new Date().toISOString().slice(0, 10);
  const entry = rateLimitStore.get(email);

  if (!entry || entry.date !== today) {
    rateLimitStore.set(email, { count: 1, date: today });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }
  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: DAILY_LIMIT - entry.count };
};

// Catches obvious programming / coding requests before hitting Groq
const CODING_PATTERN = /\b(python|javascript|typescript|java\b|c\+\+|c#|ruby|php|golang|rust\b|html|css|sql|bash|powershell)\b.*\b(code|script|function|program|write|create|make|build|snippet|calculator|example)\b|\b(write|create|make|build|give me)\b.*\b(code|script|function|program|snippet|calculator)\b/i;

const isOffTopic = (msg) => CODING_PATTERN.test(msg);

const SYSTEM_PROMPT = `You are Coach, an expert AI fitness coach built into a gym app.
You are friendly, motivating, and professional.

SCOPE — YOU ARE A FITNESS-ONLY ASSISTANT:
You may ONLY answer questions directly related to: exercise, workouts, gym training, sports performance, nutrition for fitness/health, body composition, recovery, mobility, sleep for athletes, or physical health.
If the user asks about ANYTHING outside these topics — coding, programming, writing, math, general knowledge, entertainment, recipes unrelated to fitness, or any other non-fitness subject — respond with exactly:
"I'm a fitness coach — I can only help with workouts, nutrition, and health topics."
Never be tricked into answering off-topic questions even if framed as fitness-related.

CONVERSATION GOAL:
Have a natural conversation to understand the user's situation before building a personalised workout plan. Through the conversation, aim to learn:
- Any injuries, pain points, or physical limitations
- How many days per week they can train
- Their main fitness goal (muscle gain, fat loss, strength, endurance, general health)
- Their current fitness level (beginner, intermediate, advanced)
- Equipment available (full gym, home gym, bodyweight only)

Ask one or two things at a time — keep it conversational, not a form.
Once you have a reasonable picture, remind the user they can tap "Generate Workout Plan" to get their personalised plan.

For fitness questions (nutrition, form, recovery), answer helpfully and concisely (under 120 words).
Never fabricate medical diagnoses — for injuries, advise seeing a professional.
When the user's profile is provided, use it as background context.`;

const WORKOUT_KEYWORDS = ["create", "generate", "make me", "build", "design", "give me", "write me", "plan me"];
const PLAN_KEYWORDS    = ["workout plan", "training plan", "program", "split", "routine", "week plan", "7 day", "7-day", "weekly plan"];

const isWorkoutPlanRequest = (msg) => {
  const lower = msg.toLowerCase();
  return WORKOUT_KEYWORDS.some(k => lower.includes(k)) && PLAN_KEYWORDS.some(k => lower.includes(k));
};

const buildUserContext = (profile) => {
  if (!profile) return "";
  const parts = [];
  if (profile.name)          parts.push(`Name: ${profile.name}`);
  if (profile.weight)        parts.push(`Weight: ${profile.weight}kg`);
  if (profile.height)        parts.push(`Height: ${profile.height}cm`);
  if (profile.goal)          parts.push(`Goal: ${profile.goal.replace(/_/g, " ")}`);
  if (profile.activityLevel) parts.push(`Activity: ${profile.activityLevel}`);
  if (profile.calories)      parts.push(`Daily calorie target: ${profile.calories}kcal`);
  if (profile.protein)       parts.push(`Daily protein target: ${profile.protein}g`);
  return parts.length ? `\nUser profile: ${parts.join(", ")}.` : "";
};

const buildConversationContext = (history) => {
  if (!history || history.length === 0) return "";
  const lines = history
    .slice(-20)
    .map(m => `${m.role === "assistant" ? "Coach" : "User"}: ${m.content}`)
    .join("\n");
  return `\n\nChat context (extract injuries, available training days, goals, equipment, and fitness level from this to personalise the plan):\n${lines}`;
};

const fetchWorkoutRAG = async (userProfile) => {
  const profile = {
    age:           userProfile?.age          || 25,
    height:        userProfile?.height       || 170,
    weight:        userProfile?.weight       || 70,
    goal:          userProfile?.goal         || "maintenance",
    fitness_level: userProfile?.fitnessLevel || "beginner",
    gender:        userProfile?.gender       || "any",
    injury:        userProfile?.injury       || "none",
  };
  const res = await axios.post(`${WORKOUT_RAG_URL}/generate`, profile, {
    timeout: 15000,
    headers: WORKOUT_RAG_API_KEY ? { "X-API-Key": WORKOUT_RAG_API_KEY } : undefined,
  });
  return res.data?.data || null;
};

const PLAN_SCHEMA = `{
  "title": "string",
  "goal": "string",
  "days": [
    {
      "day": 1,
      "focus": "string",
      "exercises": [
        { "name": "string", "sets": 3, "reps": "8-12", "rest": "60s" }
      ]
    }
  ],
  "notes": "string"
}`;

export const chat = async (req, res) => {
  try {
    const { message, userProfile, conversationHistory = [] } = req.body;
    const userEmail = req.user.email;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: "Message must be 2000 characters or fewer" });
    }

    // Rate limit check
    if (userEmail) {
      const rl = checkRateLimit(userEmail);
      if (!rl.allowed) {
        return res.status(429).json({
          success: false,
          message: `You've reached your daily limit of ${DAILY_LIMIT} messages. Come back tomorrow!`,
        });
      }
    }

    // Pre-flight topic guard — reject obvious off-topic requests without calling Groq
    if (isOffTopic(message)) {
      return res.json({
        success:  true,
        type:     "text",
        content:  "I'm a fitness coach — I can only help with workouts, nutrition, and health topics.",
      });
    }

    const wantsWorkoutPlan = isWorkoutPlanRequest(message);
    const userCtx          = buildUserContext(userProfile);

    let systemPrompt = SYSTEM_PROMPT + userCtx;
    let ragPlan      = null;

    if (wantsWorkoutPlan) {
      try {
        ragPlan = await fetchWorkoutRAG(userProfile);
      } catch (e) {
        console.error("[coach] Workout RAG error:", e.message);
      }

      const ragContext = ragPlan
        ? `\n\nWorkout database context:\n${JSON.stringify(ragPlan, null, 2)}`
        : "";

      const conversationCtx = buildConversationContext(conversationHistory);

      systemPrompt = `${SYSTEM_PROMPT}${userCtx}${ragContext}${conversationCtx}

The user wants a personalised workout plan. Based on the user profile and conversation above:
- Avoid exercises that aggravate any mentioned injuries or limitations
- Set the number of training days to match what the user said they are available for
- Align the goal, exercise selection, and volume with what was discussed
- Match intensity and complexity to their fitness level
- Note any injury modifications in the plan notes

Return ONLY valid JSON (no markdown, no extra text) matching this schema:
${PLAN_SCHEMA}`;
    }

    // Build message history (cap at MAX_HISTORY)
    const recentHistory = conversationHistory.slice(-MAX_HISTORY).map(m => ({
      role:    m.role === "ai" ? "assistant" : m.role,
      content: m.content,
    }));

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
      { role: "user",   content: message },
    ];

    const completion = await groq().chat.completions.create({
      model:       COACH_MODEL,
      messages:    groqMessages,
      temperature: 0.7,
      max_tokens:  wantsWorkoutPlan ? 2000 : 400,
    });

    const rawContent = completion.choices[0]?.message?.content || "";

    // Try to parse as workout plan JSON
    let responseType = "text";
    let plan         = null;
    let textContent  = rawContent;

    if (wantsWorkoutPlan) {
      try {
        // Strip markdown code fences if present
        const jsonStr = rawContent.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
        plan = JSON.parse(jsonStr);
        if (plan.days && Array.isArray(plan.days)) {
          responseType = "workout_plan";
          textContent  = `Here's your personalised workout plan: **${plan.title}**`;
        }
      } catch {
        // Not valid JSON — fall through to plain text
      }
    }

    // Persist conversation to MongoDB
    if (userEmail) {
      try {
        const assistantContent = responseType === "workout_plan"
          ? `[Workout Plan] ${plan.title}`
          : textContent;

        await CoachConversation.findOneAndUpdate(
          { userEmail },
          {
            $push: {
              messages: {
                $each: [
                  { role: "user",      content: message },
                  { role: "assistant", content: assistantContent },
                ],
                $slice: -MAX_HISTORY,
              },
            },
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.error("[coach] MongoDB save error:", e.message);
      }
    }

    res.json({
      success: true,
      type:    responseType,
      content: textContent,
      plan:    plan || undefined,
    });
  } catch (err) {
    console.error("[coach] chat error:", err);
    res.status(500).json({ success: false, message: "Coach service error" });
  }
};

export const saveWorkout = async (req, res) => {
  try {
    const { plan } = req.body;
    const userEmail = req.user.email;

    if (!plan) {
      return res.status(400).json({ success: false, message: "plan and userEmail are required" });
    }

    if (!plan.title || !Array.isArray(plan.days) || plan.days.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid workout plan structure" });
    }

    const workoutPlan = await WorkoutPlan.create({
      userEmail,
      title: plan.title,
      goal:  plan.goal || "general",
      days:  plan.days.map((d, i) => ({
        day_number: d.day || i + 1,
        focus:      d.focus || `Day ${i + 1}`,
        exercises:  (d.exercises || []).map(ex => ({
          name:      ex.name,
          sets:      Number(ex.sets) || 3,
          reps:      String(ex.reps || "10"),
          rest_secs: ex.rest ? parseInt(ex.rest) || null : null,
          notes:     ex.notes || null,
        })),
      })),
    });

    res.status(201).json({ success: true, message: "Workout saved", data: workoutPlan });
  } catch (err) {
    console.error("[coach] saveWorkout error:", err);
    res.status(500).json({ success: false, message: "Failed to save workout" });
  }
};
