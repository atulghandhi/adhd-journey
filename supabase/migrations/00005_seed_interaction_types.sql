WITH task_formats("order", interaction_type, interaction_config) AS (
  VALUES
    (
      1,
      'drag_list'::public.interaction_type,
      jsonb_build_object(
        'instruction', 'Capture at least 4 activity switches from today.',
        'minItems', 4,
        'maxItems', 10,
        'placeholder', 'e.g. Email, lunch, scrolling, reset'
      )
    ),
    (
      2,
      'reflection_prompts'::public.interaction_type,
      jsonb_build_object(
        'prompts',
        jsonb_build_array(
          'What is one trigger that reliably pulls you off track?',
          'When does it usually show up?',
          'What do you tend to reach for when it hits?'
        )
      )
    ),
    (
      3,
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
      4,
      'journal'::public.interaction_type,
      jsonb_build_object(
        'prompt', 'Write about where your focus peaked, where it dipped, and one pattern you notice in the day.',
        'minCharacters', 80
      )
    ),
    (5, 'markdown'::public.interaction_type, '{}'::jsonb),
    (
      6,
      'reflection_prompts'::public.interaction_type,
      jsonb_build_object(
        'prompts',
        jsonb_build_array(
          'What gives you a quick dopamine squeeze most often?',
          'What important work would you rather protect first?',
          'What difference do you notice when the reward waits until later?'
        )
      )
    ),
    (7, 'markdown'::public.interaction_type, '{}'::jsonb),
    (
      8,
      'breathing_exercise'::public.interaction_type,
      jsonb_build_object(
        'durationSeconds', 64,
        'label', 'Box breathing reset',
        'inhaleSeconds', 4,
        'holdSeconds', 4,
        'exhaleSeconds', 4
      )
    ),
    (
      9,
      'timed_challenge'::public.interaction_type,
      jsonb_build_object(
        'durationSeconds', 300,
        'label', 'Settle into coherence',
        'breathingCadence',
        jsonb_build_object(
          'inhaleSeconds', 6,
          'holdSeconds', 0,
          'exhaleSeconds', 5
        )
      )
    ),
    (10, 'markdown'::public.interaction_type, '{}'::jsonb),
    (
      11,
      'journal'::public.interaction_type,
      jsonb_build_object(
        'prompt', 'Write what you ate, where the protein, fat, and carbs came from, and how your energy felt 2 hours later.',
        'minCharacters', 70
      )
    ),
    (12, 'markdown'::public.interaction_type, '{}'::jsonb),
    (
      13,
      'timed_challenge'::public.interaction_type,
      jsonb_build_object(
        'durationSeconds', 180,
        'label', 'Notice without fixing'
      )
    ),
    (14, 'markdown'::public.interaction_type, '{}'::jsonb),
    (
      15,
      'drag_list'::public.interaction_type,
      jsonb_build_object(
        'instruction', 'List the projects or tasks that still feel alive for you right now.',
        'minItems', 3,
        'maxItems', 5,
        'placeholder', 'Add a project or task...'
      )
    ),
    (
      16,
      'journal'::public.interaction_type,
      jsonb_build_object(
        'prompt', 'Write which project you started with, why it felt exciting, and what will tell you it is time to rotate.',
        'minCharacters', 80
      )
    ),
    (17, 'markdown'::public.interaction_type, '{}'::jsonb),
    (
      18,
      'reflection_prompts'::public.interaction_type,
      jsonb_build_object(
        'prompts',
        jsonb_build_array(
          'What emotion have you labeled most today?',
          'What happened right before it showed up?',
          'What changed, even slightly, after you named it?'
        )
      )
    ),
    (19, 'markdown'::public.interaction_type, '{}'::jsonb),
    (
      20,
      'reflection_prompts'::public.interaction_type,
      jsonb_build_object(
        'prompts',
        jsonb_build_array(
          'What story showed up yesterday?',
          'How would you rewrite it in a kinder, more accurate way?',
          'What evidence supports the new version?'
        )
      )
    ),
    (
      21,
      'community_prompt'::public.interaction_type,
      jsonb_build_object(
        'navigateTo', '/community',
        'prompt', 'Share the most useful thing from the first half of the journey, or one struggle you want help with.'
      )
    ),
    (
      22,
      'timed_challenge'::public.interaction_type,
      jsonb_build_object(
        'durationSeconds', 300,
        'label', 'Surf the anxiety wave',
        'breathingCadence',
        jsonb_build_object(
          'inhaleSeconds', 4,
          'holdSeconds', 0,
          'exhaleSeconds', 6
        )
      )
    ),
    (
      23,
      'reflection_prompts'::public.interaction_type,
      jsonb_build_object(
        'prompts',
        jsonb_build_array(
          'What is one noise change that would help your focus space?',
          'What is one lighting or screen change you want to try?',
          'What will you remove or adjust in your workspace first?'
        )
      )
    ),
    (
      24,
      'journal'::public.interaction_type,
      jsonb_build_object(
        'prompt', 'Write your big squeezes, your small sips, and how tomorrow changes when the hardest work comes first.',
        'minCharacters', 120
      )
    ),
    (
      25,
      'drag_list'::public.interaction_type,
      jsonb_build_object(
        'instruction', 'Draft tomorrow''s blocks with built-in buffers and recovery time.',
        'minItems', 4,
        'maxItems', 8,
        'placeholder', 'Add a block, buffer, or recovery window...'
      )
    ),
    (26, 'markdown'::public.interaction_type, '{}'::jsonb),
    (
      27,
      'breathing_exercise'::public.interaction_type,
      jsonb_build_object(
        'durationSeconds', 120,
        'label', 'Start the wind-down',
        'inhaleSeconds', 4,
        'holdSeconds', 4,
        'exhaleSeconds', 6
      )
    ),
    (
      28,
      'reflection_prompts'::public.interaction_type,
      jsonb_build_object(
        'prompts',
        jsonb_build_array(
          'What no longer feels alive on your rotation list?',
          'What new task or project has your attention now?',
          'How would you reorder the list based on your current energy?'
        )
      )
    ),
    (
      29,
      'community_prompt'::public.interaction_type,
      jsonb_build_object(
        'navigateTo', '/community',
        'prompt', 'Share one part of your daily default with the community so it feels more real.'
      )
    ),
    (
      30,
      'journal'::public.interaction_type,
      jsonb_build_object(
        'prompt', 'Journal what feels hard right now, why it feels hard, and what would help you move anyway.',
        'minCharacters', 120
      )
    )
)
UPDATE public.tasks AS seeded_tasks
SET interaction_type = task_formats.interaction_type,
    interaction_config = task_formats.interaction_config
FROM task_formats
WHERE seeded_tasks.journey_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND seeded_tasks."order" = task_formats."order";
