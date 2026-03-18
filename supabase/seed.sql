-- Milestone 02 seed data

DO $$
DECLARE
  default_journey constant uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  DELETE FROM public.quiz_questions;
  DELETE FROM public.notification_log;
  DELETE FROM public.notification_templates;
  DELETE FROM public.push_tokens;
  DELETE FROM public.community_reports;
  DELETE FROM public.community_replies;
  DELETE FROM public.community_reactions;
  DELETE FROM public.community_posts;
  DELETE FROM public.spaced_repetition_state;
  DELETE FROM public.check_ins;
  DELETE FROM public.user_progress;
  DELETE FROM public.tasks WHERE journey_id = default_journey;

  WITH task_seed AS (
    SELECT *
    FROM jsonb_to_recordset($seed$[
  {
    "task_order": 1,
    "title": "Time Log Your Day",
    "task_body": "For the rest of today, write down what you're doing every time you switch activities. Use pen & paper, Notes app, or a timer. Don't judge — just observe."
  },
  {
    "task_order": 2,
    "title": "Identify Your Top 3 Urge Triggers",
    "task_body": "List the 3 apps, habits, or situations that most often pull you off track (e.g., opening YouTube, checking your phone in bed, snacking when bored). Just name them — no fixing yet."
  },
  {
    "task_order": 3,
    "title": "The 5-Minute Urge Surf",
    "task_body": "Next time you feel a pull toward one of yesterday's triggers, set a 5-minute timer. Don't fight it — just watch the urge. Notice where you feel it in your body. Let it pass on its own."
  },
  {
    "task_order": 4,
    "title": "Map Your Energy Peaks",
    "task_body": "Look at yesterday's time log. Circle the 2–3 hours where you felt most focused and the 2–3 where you felt most drained. This is your energy map."
  },
  {
    "task_order": 5,
    "title": "Screen Time & Sensory Audit",
    "task_body": "Part 1: Check your phone's screen time report (Settings → Screen Time on iOS, Digital Wellbeing on Android). Screenshot it. No guilt — just data.\nPart 2: Score your environment: noise (1–5), light (1–5), temperature (1–5), clutter (1–5). Write down one small change you could make to each."
  },
  {
    "task_order": 6,
    "title": "The Dopamine Lemon",
    "task_body": "Think of your dopamine like a lemon. You start the day with a full lemon. Every high-stimulation activity (doom-scrolling, junk food, adult content, social media) gives the lemon a big squeeze — and now there's less juice left for the work that actually matters. Today's task: do your hardest or most important work FIRST, before any high-dopamine reward. Save games, social media, and entertainment for the end of the day — they'll still be enjoyable even with a squeezed lemon. Notice the difference."
  },
  {
    "task_order": 7,
    "title": "Reflection & Recalibration",
    "task_body": "Review your time log, energy map, urge triggers, screen time, and dopamine lemon experience. Write 3 sentences: \"I noticed…\", \"I was surprised by…\", \"I want to change…\""
  },
  {
    "task_order": 8,
    "title": "Box Breathing (4-4-4-4)",
    "task_body": "Do one round of box breathing right now: inhale 4 seconds, hold 4, exhale 4, hold 4. Repeat 4 cycles. That's it — under 2 minutes."
  },
  {
    "task_order": 9,
    "title": "HRV Coherence Breathing",
    "task_body": "Breathe at a 5.5-second inhale, 5.5-second exhale pace for 5 minutes. Use a metronome app or count slowly. This is the pace that maximizes heart rate variability."
  },
  {
    "task_order": 10,
    "title": "Find Your Sleep Window",
    "task_body": "For the next 3 nights, note the exact time you feel the first wave of sleepiness (yawning, heavy eyes). This is your sleep window. Write it down — don't push past it tonight."
  },
  {
    "task_order": 11,
    "title": "The ADHD-Friendly Meal",
    "task_body": "Eat one meal today that has all 3: protein, healthy fat, and complex carbs. No perfection needed — just one meal with all three. Notice your energy 2 hours later."
  },
  {
    "task_order": 12,
    "title": "Gut-Brain Connection: Start a Probiotic",
    "task_body": "Research shows specific gut bacteria strains (Lactobacillus rhamnosus, Bifidobacterium longum, Lactobacillus helveticus) are linked to ADHD-related dopamine and serotonin regulation. Today's task: buy or order a probiotic supplement that contains at least one of these strains. Check the label for live active cultures and CFU count (aim for 10B+ CFU). Start taking it daily."
  },
  {
    "task_order": 13,
    "title": "3-Minute Body Scan",
    "task_body": "Set a 3-minute timer. Close your eyes. Scan from head to toes — just notice tension, warmth, tingling. Don't fix anything. This is ADHD-friendly meditation: short, body-based, no \"empty your mind.\""
  },
  {
    "task_order": 14,
    "title": "The ADHD Exercise Prescription",
    "task_body": "Exercise is one of the most evidence-backed ADHD interventions: it increases dopamine and norepinephrine (the same neurotransmitters ADHD meds target), reduces excess fat cells that worsen ADHD symptoms through inflammation, and improves executive function for hours afterward. Today: do 20+ minutes of moderate cardio — brisk walk, jog, bike, swim, dance, whatever you'll actually do. Notice your focus in the 2 hours after. This isn't a \"get fit\" task — it's a brain chemistry task."
  },
  {
    "task_order": 15,
    "title": "Build Your Rotation List",
    "task_body": "Write down 3–5 projects or tasks you're currently excited about (work, creative, personal — anything). These are your rotation candidates. Order doesn't matter."
  },
  {
    "task_order": 16,
    "title": "Start Rotation Cycling",
    "task_body": "Pick the project from your rotation list that excites you most RIGHT NOW. Work on it for as long as the excitement lasts. The moment you feel boredom creeping in — maybe hours, maybe days — stop. Switch to the next one on your list. No guilt. You're using your ADHD brain's need for novelty as fuel, not fighting it. You'll cycle back to the first project eventually — and when you do, it'll feel fresh again. This is how you do 5 projects instead of 1 in the same amount of time."
  },
  {
    "task_order": 17,
    "title": "Set Up the Mindful Gateway",
    "task_body": "Follow the in-app tutorial to set up a 5-second breathing pause before your top trigger app (from Day 02). iOS: Shortcuts app. Android: automation. The app walks you through it step by step."
  },
  {
    "task_order": 18,
    "title": "Emotional Labeling",
    "task_body": "Three times today, pause and name your emotion in one word (frustrated, restless, excited, flat, anxious). Say it out loud or write it down. That's the whole task — just label, don't fix."
  },
  {
    "task_order": 19,
    "title": "The \"What Story Am I Telling Myself?\" Check",
    "task_body": "When you catch yourself procrastinating or feeling stuck, ask: \"What story am I telling myself right now?\" Write down the narrative (e.g., \"I'm lazy,\" \"This is too hard,\" \"I'll do it later\"). Just capture it."
  },
  {
    "task_order": 20,
    "title": "Rewrite One Self-Narrative",
    "task_body": "Take one story from yesterday and rewrite it. \"I'm lazy\" → \"I have a brain that needs novelty to engage.\" \"This is too hard\" → \"I haven't found the right entry point yet.\" Write your rewrite and read it aloud."
  },
  {
    "task_order": 21,
    "title": "Mid-Journey Check-In",
    "task_body": "Review your rotation list, sleep window, breathing practice, energy map, probiotic habit, and exercise. Update anything that's changed. Write: \"The most useful thing so far has been…\" and \"I'm still struggling with…\""
  },
  {
    "task_order": 22,
    "title": "Anxiety Surfing",
    "task_body": "Next time you feel anxious or overwhelmed, treat it like an urge surf (Day 03). Set a 5-minute timer. Observe where anxiety lives in your body. Breathe into that spot. Let it peak and recede without acting on it."
  },
  {
    "task_order": 23,
    "title": "Sensory Tuning Session",
    "task_body": "Based on your Day 05 audit, build a 15-minute \"focus environment.\" Adjust noise (music, white noise, silence), light (dimmer, brighter, blue-light filter), and clutter (clear your immediate workspace). Work in this environment for one task."
  },
  {
    "task_order": 24,
    "title": "Dopamine Management Day",
    "task_body": "Remember the dopamine lemon from Day 06. Today, go deeper. Write two lists: \"Big squeezes\" (doom-scrolling, junk food, adult content, impulse shopping, binge-watching) and \"Small sips\" (walk, music, calling a friend, cooking, creative work, exercise). Plan tomorrow using the lemon rule: hardest work first when the lemon is full, rewards and entertainment last when it's squeezed. The key insight: the fun stuff is still fun at the end of the day — but the hard stuff is nearly impossible on an empty lemon."
  },
  {
    "task_order": 25,
    "title": "Time Blocking with ADHD Rules",
    "task_body": "Block out tomorrow using your energy map (Day 04) AND the dopamine lemon (Day 06). High-energy peaks + full lemon = hardest work. Low-energy troughs = admin, movement, rest. End of day = rewards from your \"small sips\" list. Build in 10-minute buffers between blocks. Blocks are suggestions, not prison."
  },
  {
    "task_order": 26,
    "title": "Ayurvedic Morning Ritual",
    "task_body": "Tomorrow morning, before checking your phone: drink a glass of warm water, splash cold water on your face, and take 5 slow breaths. That's the whole ritual. This is a zero-screen, zero-squeeze start to the day — preserving your dopamine lemon for the work ahead."
  },
  {
    "task_order": 27,
    "title": "Evening Wind-Down Ritual",
    "task_body": "Tonight, start a wind-down 30 minutes before your sleep window (Day 10): dim lights, no screens (or night mode), do your box breathing (Day 08), then body scan (Day 13). Stack the habits you've already learned."
  },
  {
    "task_order": 28,
    "title": "Rotation List Review & Refresh",
    "task_body": "Look at your rotation list from Day 15. Cross off anything that's lost all excitement. Add anything new that's grabbed your attention. Rotate order based on current energy. This list is alive — it should change."
  },
  {
    "task_order": 29,
    "title": "Design Your Daily Default",
    "task_body": "Combine the practices that worked best into a simple daily default: morning ritual (Day 26), dopamine lemon rule (Day 06), one breathing session (Day 08/09), work via rotation (Day 16), exercise (Day 14), one urge surf (Day 03), wind-down (Day 27), probiotic (Day 12). Write it on one card or one phone note."
  },
  {
    "task_order": 30,
    "title": "The Journal",
    "task_body": "Journal all the things that are hard right now, and why they are hard and what it would take to do them. Just build that awareness."
  }
]$seed$::jsonb) AS x(task_order integer, title text, task_body text)
  )
  INSERT INTO public.tasks (
    journey_id,
    "order",
    title,
    task_body,
    explanation_body,
    deeper_reading,
    difficulty_rating,
    default_duration_days,
    tags
  )
  SELECT
    default_journey,
    task_seed.task_order,
    task_seed.title,
    task_seed.task_body,
    'Explanation coming soon — the science behind this task will be added here.',
    NULL,
    CASE
      WHEN task_seed.task_order IN (7, 21, 28, 30) THEN 2
      WHEN task_seed.task_order IN (14, 16, 17, 24, 25, 29) THEN 4
      ELSE 3
    END,
    1,
    ARRAY['adhd', 'focus']::text[]
  FROM task_seed
  ORDER BY task_seed.task_order;

  WITH quiz_seed AS (
    SELECT *
    FROM jsonb_to_recordset($quiz$[
  {
    "task_order": 1,
    "question": "What is the primary goal of the first task in the FocusLab journey?",
    "options": [
      "Build a complex habit system",
      "Take one small immediate action",
      "Read a long article about ADHD",
      "Set up a detailed planner"
    ],
    "correct_index": 1
  },
  {
    "task_order": 2,
    "question": "Placeholder question for Task 2 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 3,
    "question": "Placeholder question for Task 3 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 4,
    "question": "Placeholder question for Task 4 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 5,
    "question": "Placeholder question for Task 5 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 6,
    "question": "Placeholder question for Task 6 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 7,
    "question": "Placeholder question for Task 7 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 8,
    "question": "Placeholder question for Task 8 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 9,
    "question": "Placeholder question for Task 9 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 10,
    "question": "Placeholder question for Task 10 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 11,
    "question": "Placeholder question for Task 11 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 12,
    "question": "Placeholder question for Task 12 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 13,
    "question": "Placeholder question for Task 13 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 14,
    "question": "Placeholder question for Task 14 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 15,
    "question": "Placeholder question for Task 15 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 16,
    "question": "Placeholder question for Task 16 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 17,
    "question": "Placeholder question for Task 17 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 18,
    "question": "Placeholder question for Task 18 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 19,
    "question": "Placeholder question for Task 19 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 20,
    "question": "Placeholder question for Task 20 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 21,
    "question": "Placeholder question for Task 21 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 22,
    "question": "Placeholder question for Task 22 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 23,
    "question": "Placeholder question for Task 23 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 24,
    "question": "Placeholder question for Task 24 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 25,
    "question": "Placeholder question for Task 25 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 26,
    "question": "Placeholder question for Task 26 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 27,
    "question": "Placeholder question for Task 27 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 28,
    "question": "Placeholder question for Task 28 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 29,
    "question": "Placeholder question for Task 29 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  },
  {
    "task_order": 30,
    "question": "Placeholder question for Task 30 — will be replaced with real content.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_index": 0
  }
]$quiz$::jsonb) AS x(task_order integer, question text, options jsonb, correct_index integer)
  )
  INSERT INTO public.quiz_questions (task_id, question, options, correct_index)
  SELECT
    tasks.id,
    quiz_seed.question,
    quiz_seed.options,
    quiz_seed.correct_index
  FROM quiz_seed
  INNER JOIN public.tasks ON tasks.journey_id = default_journey AND tasks."order" = quiz_seed.task_order
  ORDER BY quiz_seed.task_order;

  WITH template_seed AS (
    SELECT *
    FROM jsonb_to_recordset($templates$[
  {
    "channel": "push",
    "subject": "Your next FocusLab step is ready",
    "body": "Day {{day_number}} is waiting for you. Tiny step, then momentum.",
    "tone_tag": "encouraging"
  },
  {
    "channel": "push",
    "subject": "Keep the lemon full",
    "body": "Protect your focus juice today. Start with {{task_title}} before the scroll.",
    "tone_tag": "playful"
  },
  {
    "channel": "push",
    "subject": "One task. Then done.",
    "body": "FocusLab only needs one small win today: {{task_title}}.",
    "tone_tag": "direct"
  },
  {
    "channel": "push",
    "subject": "A quick reset for your brain",
    "body": "You have {{streak}} days of proof already. Today is {{task_title}}.",
    "tone_tag": "reflective"
  },
  {
    "channel": "push",
    "subject": "Momentum likes consistency",
    "body": "Open FocusLab, do {{task_title}}, and let tomorrow be easier.",
    "tone_tag": "encouraging"
  },
  {
    "channel": "email",
    "subject": "Your FocusLab check-in for today",
    "body": "<p>Hi {{user_name}},</p><p>Your next FocusLab action is <strong>{{task_title}}</strong>.</p><p>You are on day {{day_number}} with a {{streak}} day streak. One small action counts.</p>",
    "tone_tag": "encouraging"
  },
  {
    "channel": "email",
    "subject": "Today's focus move",
    "body": "<p>{{user_name}}, here is today's move: <strong>{{task_title}}</strong>.</p><p>Do the task first. Explanation can come later.</p>",
    "tone_tag": "direct"
  },
  {
    "channel": "email",
    "subject": "A softer way back in",
    "body": "<p>If today feels noisy, start small.</p><p>{{task_title}} is enough for today.</p>",
    "tone_tag": "reflective"
  },
  {
    "channel": "email",
    "subject": "Novelty works when you aim it",
    "body": "<p>You do not need a perfect day.</p><p>You need one focused action: <strong>{{task_title}}</strong>.</p>",
    "tone_tag": "playful"
  },
  {
    "channel": "email",
    "subject": "Keep your streak kind",
    "body": "<p>{{streak}} days means you have already built momentum.</p><p>Today's step: {{task_title}}.</p>",
    "tone_tag": "encouraging"
  }
]$templates$::jsonb) AS x(channel text, subject text, body text, tone_tag text)
  )
  INSERT INTO public.notification_templates (channel, subject, body, tone_tag)
  SELECT channel, subject, body, tone_tag
  FROM template_seed;

  INSERT INTO public.spaced_repetition_config (id, base_interval_days, ease_floor, struggle_threshold, max_reviews_per_day, decay_multiplier)
  VALUES (1, 1, 1.3, 2, 1, 0.5)
  ON CONFLICT (id) DO UPDATE
  SET
    base_interval_days = EXCLUDED.base_interval_days,
    ease_floor = EXCLUDED.ease_floor,
    struggle_threshold = EXCLUDED.struggle_threshold,
    max_reviews_per_day = EXCLUDED.max_reviews_per_day,
    decay_multiplier = EXCLUDED.decay_multiplier,
    updated_at = timezone('utc', now());

  INSERT INTO public.profiles (id, name, role)
  SELECT
    users.id,
    COALESCE(users.raw_user_meta_data ->> 'name', 'Admin'),
    'admin'
  FROM auth.users AS users
  WHERE users.email = 'admin@focuslab.local'
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END $$;
