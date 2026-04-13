-- Milestone 02 seed data

DO $$
DECLARE
  default_journey constant uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  DELETE FROM public.quiz_questions;
  DELETE FROM public.notification_log;
  DELETE FROM public.notification_templates;
  DELETE FROM public.push_tokens;
  DELETE FROM public.reward_resources;
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
    "title": "Rotation Cycling: Build Your Project List",
    "task_body": "ADHD brains thrive on novelty. Instead of forcing yourself to finish one thing before starting the next, use that need for newness as fuel. List 3 to 5 projects, interests, or hobbies that excite you right now. You will cycle between them throughout this journey."
  },
  {
    "task_order": 2,
    "title": "Urge Surfing",
    "task_body": "When you feel a pull toward a distraction (scrolling, snacking, switching tabs), do not fight it. Set a 5-minute timer and just observe the urge. Notice where it lives in your body. Let it rise, peak, and fade on its own. You are training your brain to tolerate discomfort without reacting."
  },
  {
    "task_order": 3,
    "title": "Morning Dopamine Protection",
    "task_body": "Your dopamine is like a lemon. Every high-stimulation hit (doom-scrolling, junk food, social media) squeezes juice out early, leaving nothing for the work that matters. Today, protect your morning. Check off each item you managed to do BEFORE any high-dopamine reward."
  },
  {
    "task_order": 4,
    "title": "Environment and Habit Setup",
    "task_body": "Your environment shapes your behavior more than willpower does. Walk through each area of your daily routine and design one small change that makes the right action easier and the wrong action harder."
  },
  {
    "task_order": 5,
    "title": "Concentration Drills",
    "task_body": "Set a timer and focus on a single task with zero distractions. No phone, no tabs, no music with lyrics. When your mind wanders (it will), gently bring it back. The goal is not perfection. The goal is noticing the wander and returning."
  },
  {
    "task_order": 6,
    "title": "Time Tracking",
    "task_body": "ADHD makes time feel slippery. Today, pick one task you have been avoiding and track exactly how long it actually takes. Most people with ADHD overestimate boring tasks and underestimate fun ones. Use the timer below to find out."
  },
  {
    "task_order": 7,
    "title": "Executive Function: 5-Step Task Breakdown",
    "task_body": "Executive function is the brain's project manager. ADHD weakens it, making big tasks feel impossible. The fix: break everything into 5 concrete steps. Walk through a task that feels overwhelming and make it tiny."
  },
  {
    "task_order": 8,
    "title": "Sprint and Breathe",
    "task_body": "Alternate nostril breathing balances your nervous system and sharpens focus. Close your right nostril with your thumb, inhale through the left. Close the left with your ring finger, exhale through the right. Then inhale right, close, exhale left. Follow the guided timer."
  },
  {
    "task_order": 9,
    "title": "1:2 Breathing for Calm",
    "task_body": "When your exhale is twice as long as your inhale, it activates your parasympathetic nervous system, the body's built-in calm-down switch. This is one of the fastest ways to reduce ADHD-related anxiety and racing thoughts."
  },
  {
    "task_order": 10,
    "title": "Anxiety Mapping",
    "task_body": "Anxiety and ADHD are deeply connected. Instead of letting worry swirl, map it out. For each worry, identify the trigger, the physical sensation, and one small action you could take right now."
  },
  {
    "task_order": 11,
    "title": "Self-Belief and Reframing",
    "task_body": "ADHD often comes with a harsh inner critic. Years of \"you are lazy\" or \"why can't you just focus\" leave marks. Today, catch those stories and rewrite them. Not with toxic positivity, but with accuracy."
  },
  {
    "task_order": 12,
    "title": "Om Chanting Meditation",
    "task_body": "Om chanting creates a vibration that activates the vagus nerve and calms the nervous system. Research shows it reduces activity in the amygdala (your brain's alarm center). Set the timer, close your eyes, and chant \"Om\" slowly on each exhale. If chanting out loud feels awkward, hum quietly. The vibration matters more than volume."
  },
  {
    "task_order": 13,
    "title": "Yoga Nidra Body Scan",
    "task_body": "Yoga Nidra (\"yogic sleep\") is a guided relaxation that keeps you awake but deeply rested. It is especially powerful for ADHD brains that struggle to \"turn off.\" Follow each step, spending about 30 seconds on each body region. Do not try to relax. Just notice."
  },
  {
    "task_order": 14,
    "title": "Map Your Ideal Day",
    "task_body": "If you could design one perfect day (realistic, not fantasy), what would it look like? When would you wake up? What would you do first? When would you work, rest, move, eat? This is not about productivity. It is about knowing what you actually want so you can build toward it."
  },
  {
    "task_order": 15,
    "title": "Duplicate Your Best Days",
    "task_body": "Think about a day in the last month where things just clicked. You felt focused, calm, maybe even productive. What made that day different? Write about what happened, what you did (or did not do), and what conditions were present. The goal is to find patterns you can repeat on purpose."
  },
  {
    "task_order": 16,
    "title": "Sleep Hygiene for ADHD",
    "task_body": "ADHD and sleep problems are deeply linked. Poor sleep worsens every ADHD symptom. Good sleep is one of the highest-leverage changes you can make. Check off each sleep practice you will commit to starting tonight."
  },
  {
    "task_order": 17,
    "title": "Addictive Personality: Play the Tape Forward",
    "task_body": "ADHD brains are wired for instant reward, which makes addictive patterns more likely (screens, food, substances, shopping, gambling). The \"play the tape forward\" technique interrupts the autopilot by forcing you to think past the immediate hit."
  },
  {
    "task_order": 18,
    "title": "Phone Decoupling",
    "task_body": "Your phone is engineered to capture attention. For ADHD brains, it is especially hard to resist because every notification is a tiny dopamine hit. Today, create friction between you and your phone. Check off the barriers you put in place, then reflect."
  },
  {
    "task_order": 19,
    "title": "Find Your Sensory Sweet Spot",
    "task_body": "ADHD brains are often either sensory-seeking (need more stimulation) or sensory-avoiding (get overwhelmed easily). Knowing your pattern helps you design environments where focus comes naturally."
  },
  {
    "task_order": 20,
    "title": "Impulsive Eating Awareness",
    "task_body": "ADHD and impulsive eating are closely linked. The same dopamine-seeking pattern that drives distraction also drives reaching for food when you are bored, stressed, or understimulated. Today is not about restriction. It is about noticing. Check off the practices you will try today."
  },
  {
    "task_order": 21,
    "title": "Gut-Brain Connection",
    "task_body": "Your gut produces about 90% of your body's serotonin and a significant amount of dopamine. Research increasingly links gut health to ADHD symptoms. Three bacterial strains show the strongest evidence for supporting focus and mood:\n\n**Lactobacillus rhamnosus** - supports GABA production, reducing anxiety\n**Bifidobacterium longum** - linked to lower cortisol and better stress resilience\n**Lactobacillus helveticus** - associated with improved mood and cognitive function\n\nToday's action: look for a probiotic supplement containing at least one of these strains. Check the label for \"live active cultures\" and aim for 10 billion+ CFU. Start taking it daily alongside the dietary changes from yesterday."
  },
  {
    "task_order": 22,
    "title": "Ayurvedic Diet Swaps",
    "task_body": "Ayurveda views ADHD-like symptoms as excess \"Vata\" energy: scattered, restless, ungrounded. The dietary fix is grounding, warm, nourishing food. You do not need to overhaul your diet. Just make a few swaps. Check off each swap you will try this week."
  },
  {
    "task_order": 23,
    "title": "The Structured Apology",
    "task_body": "ADHD often leads to social friction: forgotten commitments, interrupting, emotional blowups, running late. These moments build up guilt and shame. A structured apology repairs the relationship AND reduces the shame spiral. Walk through an apology you have been putting off."
  },
  {
    "task_order": 24,
    "title": "Communication Planner",
    "task_body": "ADHD affects communication in specific ways: interrupting, losing track of the conversation, blurting things out, going on tangents, or zoning out entirely. Today, pick one difficult conversation you need to have and plan it step by step."
  },
  {
    "task_order": 25,
    "title": "Organize Your Space",
    "task_body": "Clutter is not just messy. For ADHD brains, visual clutter competes for attention, making everything harder. But \"just clean up\" is too vague. Instead, list specific zones in your space that need attention and tackle them one by one. Start with the 3 to 5 most impactful areas."
  },
  {
    "task_order": 26,
    "title": "Thriving at Work with ADHD",
    "task_body": "ADHD in the workplace creates specific challenges: missing deadlines, forgetting details, struggling in long meetings, difficulty with boring-but-necessary tasks. But it also brings strengths: creativity, hyperfocus on interesting work, crisis performance, big-picture thinking. Today, map both sides."
  },
  {
    "task_order": 27,
    "title": "Learning with ADHD",
    "task_body": "Traditional learning methods (long lectures, dense reading, passive note-taking) are designed for neurotypical brains. ADHD brains learn best with movement, variety, and active engagement. Build a personal learning strategy."
  },
  {
    "task_order": 28,
    "title": "Medication: An Honest Look",
    "task_body": "ADHD medication is one of the most studied and effective treatments in all of psychiatry. It is also one of the most misunderstood. Whether you take medication, are considering it, or have chosen not to, today is about making an informed, shame-free decision."
  },
  {
    "task_order": 29,
    "title": "Therapy and Support",
    "task_body": "Medication treats symptoms. Therapy builds skills. The most effective ADHD management combines both, but even without medication, the right therapeutic approach can be transformative. Check off the support structures you want to explore."
  },
  {
    "task_order": 30,
    "title": "Karma, Reflection, and What Comes Next",
    "task_body": "You have spent 30 days building awareness, skills, and habits. Today is about looking back honestly and looking forward with intention. What is still hard? Why is it hard? What would it take to keep going? Write it all down. No filter, no performance. Just truth."
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
    'The science behind this task will be added here.',
    NULL,
    CASE
      WHEN task_seed.task_order IN (15, 21, 30) THEN 2
      WHEN task_seed.task_order IN (7, 10, 17, 23, 24, 27) THEN 4
      ELSE 3
    END,
    1,
    ARRAY['adhd', 'focus']::text[]
  FROM task_seed
  ORDER BY task_seed.task_order;

  WITH task_formats("order", interaction_type, interaction_config) AS (
    VALUES
      (
        1,
        'drag_list'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Add 3 to 5 projects, interests, or hobbies that excite you right now.',
          'minItems', 3,
          'maxItems', 5,
          'placeholder', 'Add a project, interest, or hobby...'
        )
      ),
      (
        2,
        'timed_challenge'::public.interaction_type,
        jsonb_build_object(
          'durationSeconds', 300,
          'label', 'Surf the urge',
          'breathingCadence',
          jsonb_build_object(
            'inhaleSeconds', 4,
            'holdSeconds', 4,
            'exhaleSeconds', 6
          )
        )
      ),
      (
        3,
        'checklist'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Check off each item you did BEFORE any high-dopamine reward this morning.',
          'items', jsonb_build_array(
            jsonb_build_object('label', 'Woke up and did NOT check my phone first'),
            jsonb_build_object('label', 'Drank water before coffee or food'),
            jsonb_build_object('label', 'Spent 5 minutes on my hardest or most important task'),
            jsonb_build_object('label', 'Delayed social media, news, or entertainment until after focused work'),
            jsonb_build_object('label', 'Took 5 slow breaths before starting the day')
          ),
          'minChecked', 3
        )
      ),
      (
        4,
        'guided_steps'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Walk through each area and design one small environment change.',
          'steps', jsonb_build_array(
            jsonb_build_object(
              'prompt', 'Workspace: What is one change that would make it easier to start working? (e.g., clear desk the night before, put phone in another room)',
              'inputType', 'textarea',
              'placeholder', 'Describe one workspace change...'
            ),
            jsonb_build_object(
              'prompt', 'Morning routine: What is one thing you could prepare the night before to make mornings smoother?',
              'inputType', 'textarea',
              'placeholder', 'Describe one morning routine change...'
            ),
            jsonb_build_object(
              'prompt', 'Digital environment: What is one app, notification, or shortcut you could remove or add to reduce friction?',
              'inputType', 'textarea',
              'placeholder', 'Describe one digital change...'
            ),
            jsonb_build_object(
              'prompt', 'Which of these three changes will you do TODAY?',
              'inputType', 'text',
              'placeholder', 'Write the one you will start with...'
            )
          )
        )
      ),
      (
        5,
        'timed_challenge'::public.interaction_type,
        jsonb_build_object(
          'durationSeconds', 600,
          'label', 'Stay with it. Single focus.'
        )
      ),
      (
        6,
        'time_tracker'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Pick a task you have been avoiding. Start the timer, do the task, then stop it when you are done. Compare the real time to what you expected.',
          'taskLabel', 'The task I have been avoiding',
          'estimateMinutes', 30
        )
      ),
      (
        7,
        'guided_steps'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Pick one task that feels overwhelming and break it into 5 tiny steps.',
          'steps', jsonb_build_array(
            jsonb_build_object(
              'prompt', 'What is the task that feels too big or overwhelming?',
              'inputType', 'text',
              'placeholder', 'Name the task...'
            ),
            jsonb_build_object(
              'prompt', 'Step 1: What is the very first physical action? (e.g., open the document, find the email, pick up the phone)',
              'inputType', 'text',
              'placeholder', 'First tiny action...'
            ),
            jsonb_build_object(
              'prompt', 'Step 2: What comes right after that?',
              'inputType', 'text',
              'placeholder', 'Second action...'
            ),
            jsonb_build_object(
              'prompt', 'Step 3: Then what?',
              'inputType', 'text',
              'placeholder', 'Third action...'
            ),
            jsonb_build_object(
              'prompt', 'Steps 4 and 5: What are the last two actions to finish it?',
              'inputType', 'textarea',
              'placeholder', 'Write steps 4 and 5...'
            )
          )
        )
      ),
      (
        8,
        'breathing_exercise'::public.interaction_type,
        jsonb_build_object(
          'durationSeconds', 120,
          'label', 'Alternate nostril breathing',
          'inhaleSeconds', 4,
          'holdSeconds', 2,
          'exhaleSeconds', 6
        )
      ),
      (
        9,
        'breathing_exercise'::public.interaction_type,
        jsonb_build_object(
          'durationSeconds', 180,
          'label', '1:2 breathing for calm',
          'inhaleSeconds', 4,
          'holdSeconds', 0,
          'exhaleSeconds', 8
        )
      ),
      (
        10,
        'guided_steps'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Map your anxieties. For each one, identify the trigger, the sensation, and one small action.',
          'steps', jsonb_build_array(
            jsonb_build_object(
              'prompt', 'Worry 1: What is something that has been causing you anxiety?',
              'inputType', 'text',
              'placeholder', 'Name the worry...'
            ),
            jsonb_build_object(
              'prompt', 'Where do you feel it in your body? (chest tightness, stomach knot, racing heart, etc.)',
              'inputType', 'text',
              'placeholder', 'Describe the physical sensation...'
            ),
            jsonb_build_object(
              'prompt', 'What is one small action you could take about this worry in the next 24 hours?',
              'inputType', 'textarea',
              'placeholder', 'One concrete step...'
            ),
            jsonb_build_object(
              'prompt', 'Worry 2: Name another source of anxiety and one action you could take.',
              'inputType', 'textarea',
              'placeholder', 'Second worry and action...'
            ),
            jsonb_build_object(
              'prompt', 'Worry 3: Name a third worry and one action, or write "I only have two right now" if that is true.',
              'inputType', 'textarea',
              'placeholder', 'Third worry and action...'
            )
          )
        )
      ),
      (
        11,
        'reflection_prompts'::public.interaction_type,
        jsonb_build_object(
          'prompts',
          jsonb_build_array(
            'What is one negative story you tell yourself repeatedly? (e.g., "I am lazy," "I always mess things up," "I will never finish anything")',
            'Where did this story come from? Who first said it, or when did you start believing it?',
            'Rewrite the story with accuracy instead of judgment. (e.g., "I am lazy" becomes "I have a brain that needs novelty and clear structure to engage.")'
          )
        )
      ),
      (
        12,
        'timed_challenge'::public.interaction_type,
        jsonb_build_object(
          'durationSeconds', 300,
          'label', 'Om chanting. Exhale slowly with a hum.'
        )
      ),
      (
        13,
        'guided_steps'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Follow each body scan step. Spend about 30 seconds on each region. Do not try to relax. Just notice.',
          'steps', jsonb_build_array(
            jsonb_build_object(
              'prompt', 'Lie down or sit comfortably. Close your eyes. Take three deep breaths. Set an intention: "I am going to notice my body without changing anything."',
              'inputType', 'none',
              'placeholder', ''
            ),
            jsonb_build_object(
              'prompt', 'Bring your attention to your feet and legs. Notice any warmth, tingling, heaviness, or numbness. No judgment.',
              'inputType', 'none',
              'placeholder', ''
            ),
            jsonb_build_object(
              'prompt', 'Move your attention to your stomach and chest. Notice your breath moving in and out. Notice any tightness or ease.',
              'inputType', 'none',
              'placeholder', ''
            ),
            jsonb_build_object(
              'prompt', 'Move to your hands, arms, and shoulders. Notice where you hold tension. Let your awareness rest there.',
              'inputType', 'none',
              'placeholder', ''
            ),
            jsonb_build_object(
              'prompt', 'Finally, bring attention to your face, jaw, and forehead. Notice if you are clenching. Soften if you can.',
              'inputType', 'none',
              'placeholder', ''
            ),
            jsonb_build_object(
              'prompt', 'Take three deep breaths. Slowly open your eyes. How do you feel compared to when you started?',
              'inputType', 'textarea',
              'placeholder', 'Describe how you feel now...'
            )
          )
        )
      ),
      (
        14,
        'reflection_prompts'::public.interaction_type,
        jsonb_build_object(
          'prompts',
          jsonb_build_array(
            'What time would you wake up on your ideal day, and what would you do in the first hour?',
            'How would you spend your most focused hours? What kind of work or activity would fill that time?',
            'What would the evening look like? When would you stop working, and how would you wind down?'
          )
        )
      ),
      (
        15,
        'journal'::public.interaction_type,
        jsonb_build_object(
          'prompt', 'Think about a day in the last month where things just clicked. What happened? What did you do or not do? What conditions were present? Write about it so you can find patterns to repeat on purpose.',
          'minCharacters', 100
        )
      ),
      (
        16,
        'checklist'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Check off each sleep practice you will commit to starting tonight.',
          'items', jsonb_build_array(
            jsonb_build_object('label', 'Set a consistent bedtime and wake time (even on weekends)'),
            jsonb_build_object('label', 'No screens 30 minutes before bed (or use night mode)'),
            jsonb_build_object('label', 'Keep the bedroom cool, dark, and quiet'),
            jsonb_build_object('label', 'No caffeine after 2 PM'),
            jsonb_build_object('label', 'Do a short breathing exercise or body scan before sleep'),
            jsonb_build_object('label', 'Put your phone outside the bedroom or across the room')
          ),
          'minChecked', 3
        )
      ),
      (
        17,
        'guided_steps'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Walk through the "play the tape forward" technique for a pattern you want to change.',
          'steps', jsonb_build_array(
            jsonb_build_object(
              'prompt', 'What is one addictive or compulsive pattern you keep falling into? (scrolling, binge eating, impulse buying, substances, etc.)',
              'inputType', 'text',
              'placeholder', 'Name the pattern...'
            ),
            jsonb_build_object(
              'prompt', 'Play the tape forward 10 minutes: What happens right after you give in? How do you feel?',
              'inputType', 'textarea',
              'placeholder', '10 minutes after...'
            ),
            jsonb_build_object(
              'prompt', 'Play the tape forward 2 hours: How do you feel now? What has the rest of your day looked like?',
              'inputType', 'textarea',
              'placeholder', '2 hours after...'
            ),
            jsonb_build_object(
              'prompt', 'Play the tape forward to tomorrow morning: How do you feel about yesterday? What would you tell yourself?',
              'inputType', 'textarea',
              'placeholder', 'The next morning...'
            ),
            jsonb_build_object(
              'prompt', 'Now rewind. What is one thing you could do RIGHT NOW instead of giving in? Something that is easy, available, and gives you even a small sense of accomplishment.',
              'inputType', 'textarea',
              'placeholder', 'The alternative action...'
            )
          )
        )
      ),
      (
        18,
        'checklist'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Check off the phone barriers you will put in place today.',
          'items', jsonb_build_array(
            jsonb_build_object('label', 'Turned off all non-essential notifications'),
            jsonb_build_object('label', 'Moved social media apps off the home screen (or deleted them)'),
            jsonb_build_object('label', 'Set a screen time limit for my top 3 time-sink apps'),
            jsonb_build_object('label', 'Enabled grayscale mode for at least 1 hour today'),
            jsonb_build_object('label', 'Charged my phone outside the bedroom tonight'),
            jsonb_build_object('label', 'Left my phone in another room for at least 30 minutes of focused work')
          ),
          'minChecked', 3
        )
      ),
      (
        19,
        'reflection_prompts'::public.interaction_type,
        jsonb_build_object(
          'prompts',
          jsonb_build_array(
            'Do you tend to seek more stimulation (need background noise, fidget, crave intensity) or avoid it (get overwhelmed by noise, crowds, bright lights)?',
            'What sensory conditions help you focus best? Think about sound, light, temperature, texture, and movement.',
            'Design your ideal focus environment. What would you add, remove, or change in your current workspace to match your sensory needs?'
          )
        )
      ),
      (
        20,
        'checklist'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Check off the eating awareness practices you will try today. This is about noticing, not restricting.',
          'items', jsonb_build_array(
            jsonb_build_object('label', 'Before eating, I asked: "Am I hungry, or am I bored/stressed/understimulated?"'),
            jsonb_build_object('label', 'I ate one meal sitting down, without screens, paying attention to taste and texture'),
            jsonb_build_object('label', 'I noticed one moment of impulsive reaching for food and paused for 30 seconds'),
            jsonb_build_object('label', 'I included protein in at least one meal today'),
            jsonb_build_object('label', 'I drank water when I felt a craving, then waited 10 minutes to see if it passed')
          ),
          'minChecked', 3
        )
      ),
      (
        21,
        'markdown'::public.interaction_type,
        jsonb_build_object()
      ),
      (
        22,
        'checklist'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Check off each Ayurvedic swap you will try this week.',
          'items', jsonb_build_array(
            jsonb_build_object('label', 'Replace one cold drink with warm water or herbal tea'),
            jsonb_build_object('label', 'Add ghee or olive oil to one meal (grounding fats)'),
            jsonb_build_object('label', 'Eat one warm, cooked meal instead of raw or cold food'),
            jsonb_build_object('label', 'Add grounding spices: turmeric, ginger, or cinnamon to one dish'),
            jsonb_build_object('label', 'Eat meals at consistent times (not skipping or grazing all day)'),
            jsonb_build_object('label', 'Reduce or eliminate caffeine after noon')
          ),
          'minChecked', 3
        )
      ),
      (
        23,
        'guided_steps'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Walk through a structured apology for something you have been putting off.',
          'steps', jsonb_build_array(
            jsonb_build_object(
              'prompt', 'Who do you owe an apology to, and what happened?',
              'inputType', 'textarea',
              'placeholder', 'Describe the situation briefly...'
            ),
            jsonb_build_object(
              'prompt', 'Name the specific impact your action (or inaction) had on them. Do not explain or justify. Just name the impact.',
              'inputType', 'textarea',
              'placeholder', 'The impact was...'
            ),
            jsonb_build_object(
              'prompt', 'What will you do differently going forward? Be specific and realistic.',
              'inputType', 'textarea',
              'placeholder', 'Going forward, I will...'
            ),
            jsonb_build_object(
              'prompt', 'Write out the apology as you would say it. Keep it short: acknowledge, take responsibility, state what changes.',
              'inputType', 'textarea',
              'placeholder', 'Write the apology here...'
            )
          )
        )
      ),
      (
        24,
        'guided_steps'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Plan a difficult conversation step by step.',
          'steps', jsonb_build_array(
            jsonb_build_object(
              'prompt', 'Who do you need to talk to, and what is the conversation about?',
              'inputType', 'text',
              'placeholder', 'Name the person and topic...'
            ),
            jsonb_build_object(
              'prompt', 'What is the ONE thing you want them to understand? (Keep it to one sentence.)',
              'inputType', 'text',
              'placeholder', 'The main point...'
            ),
            jsonb_build_object(
              'prompt', 'What might they feel or think when they hear this? How can you acknowledge their perspective?',
              'inputType', 'textarea',
              'placeholder', 'Their likely perspective...'
            ),
            jsonb_build_object(
              'prompt', 'What is your opening line? Write the first thing you will actually say.',
              'inputType', 'textarea',
              'placeholder', 'I would start by saying...'
            ),
            jsonb_build_object(
              'prompt', 'What will you do if the conversation goes sideways? (e.g., take a pause, say "I need a moment," reschedule)',
              'inputType', 'textarea',
              'placeholder', 'My backup plan...'
            )
          )
        )
      ),
      (
        25,
        'drag_list'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'List the 3 to 5 zones in your space that need the most attention. Start with the highest-impact area.',
          'minItems', 3,
          'maxItems', 5,
          'placeholder', 'Add a zone (desk, bedside table, closet floor...)'
        )
      ),
      (
        26,
        'reflection_prompts'::public.interaction_type,
        jsonb_build_object(
          'prompts',
          jsonb_build_array(
            'What is your biggest ADHD-related challenge at work? (e.g., missing deadlines, zoning out in meetings, forgetting details, struggling with boring tasks)',
            'What is one ADHD strength you bring to work that others might not have? (e.g., creative problem-solving, hyperfocus on interesting work, calm in a crisis, big-picture thinking)',
            'What is one specific change to your work routine or environment that would help you thrive? Be concrete.'
          )
        )
      ),
      (
        27,
        'guided_steps'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Build a personal learning strategy that works with your ADHD brain, not against it.',
          'steps', jsonb_build_array(
            jsonb_build_object(
              'prompt', 'What is one thing you want to learn or get better at right now?',
              'inputType', 'text',
              'placeholder', 'The skill or topic...'
            ),
            jsonb_build_object(
              'prompt', 'How have you tried to learn it before, and what did not work?',
              'inputType', 'textarea',
              'placeholder', 'What failed and why...'
            ),
            jsonb_build_object(
              'prompt', 'Which learning style works best for you? (watching videos, hands-on practice, teaching someone else, reading in short bursts, listening while walking)',
              'inputType', 'textarea',
              'placeholder', 'My best learning mode...'
            ),
            jsonb_build_object(
              'prompt', 'Design a 15-minute daily learning session using your preferred style. What would it look like?',
              'inputType', 'textarea',
              'placeholder', 'My 15-minute learning plan...'
            )
          )
        )
      ),
      (
        28,
        'reflection_prompts'::public.interaction_type,
        jsonb_build_object(
          'prompts',
          jsonb_build_array(
            'What is your current relationship with ADHD medication? (taking it, considering it, tried and stopped, chosen not to, or unsure)',
            'What fears or concerns do you have about medication? (side effects, dependency, stigma, "changing who I am," or other)',
            'What would help you make a more informed decision? (talking to a psychiatrist, reading research, hearing others'' experiences, trying a low dose)'
          )
        )
      ),
      (
        29,
        'checklist'::public.interaction_type,
        jsonb_build_object(
          'instruction', 'Check off the support structures you want to explore or continue.',
          'items', jsonb_build_array(
            jsonb_build_object('label', 'Find a therapist who specializes in ADHD (CBT or ADHD coaching)'),
            jsonb_build_object('label', 'Join an ADHD support group (online or in person)'),
            jsonb_build_object('label', 'Talk to a psychiatrist about medication options'),
            jsonb_build_object('label', 'Set up accountability with a friend, partner, or coach'),
            jsonb_build_object('label', 'Start a daily check-in practice (journaling, app tracking, or voice notes)'),
            jsonb_build_object('label', 'Read one ADHD book (Driven to Distraction, Taking Charge of Adult ADHD, or similar)')
          ),
          'minChecked', 2
        )
      ),
      (
        30,
        'journal'::public.interaction_type,
        jsonb_build_object(
          'prompt', 'Write about what is still hard right now, why it is hard, and what it would take to keep going. No filter, no performance. Just honesty. This is for you.',
          'minCharacters', 120
        )
      )
  )
  UPDATE public.tasks AS seeded_tasks
  SET interaction_type = task_formats.interaction_type,
      interaction_config = task_formats.interaction_config
  FROM task_formats
  WHERE seeded_tasks.journey_id = default_journey
    AND seeded_tasks."order" = task_formats."order";

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

  WITH reward_seed AS (
    SELECT *
    FROM jsonb_to_recordset($rewards$[
  {
    "title": "ADHD Focus Toolkit",
    "description": "A starter dashboard for planning your focus week.",
    "url": "https://example.com/focus-toolkit",
    "sort_order": 1
  },
  {
    "title": "30-Day Cheatsheet",
    "description": "A printable one-page recap of the 30-day journey.",
    "url": "https://example.com/30-day-cheatsheet",
    "sort_order": 2
  },
  {
    "title": "Top 10 ADHD Books",
    "description": "A curated reading list for understanding ADHD and attention.",
    "url": "https://example.com/adhd-books",
    "sort_order": 3
  },
  {
    "title": "Focus YouTube Channels",
    "description": "A few practical channels for focus-friendly learning.",
    "url": "https://example.com/focus-youtube",
    "sort_order": 4
  }
]$rewards$::jsonb) AS x(title text, description text, url text, sort_order integer)
  )
  INSERT INTO public.reward_resources (title, description, url, sort_order)
  SELECT title, description, url, sort_order
  FROM reward_seed
  ORDER BY sort_order;

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
