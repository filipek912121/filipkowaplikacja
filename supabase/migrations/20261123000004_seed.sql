-- ════════════════════════════════════════════════════════════════
-- PROOFIT — seed data: achievements + official challenges
-- (generated from src/lib/config/achievements.ts and src/lib/data/demo/seed.ts)
-- ════════════════════════════════════════════════════════════════

insert into public.achievements (id, name, description, icon, tier, xp_bonus, premium_only) values
  ('first_challenge', 'First Challenge', 'Log your very first check-in.', 'Rocket', 'bronze', 2, false),
  ('streak_7', '7-Day Streak', 'Stay active 7 days in a row.', 'Flame', 'silver', 5, false),
  ('streak_30', '30-Day Streak', 'Stay active 30 days in a row.', 'Flame', 'gold', 15, false),
  ('challenge_master', 'Challenge Master', 'Fully complete 10 challenges.', 'Crown', 'gold', 15, false),
  ('duel_winner', 'Duel Winner', 'Win your first duel.', 'Swords', 'silver', 5, false),
  ('extreme_finisher', 'Extreme Finisher', 'Fully complete an Extreme challenge.', 'Mountain', 'legend', 20, false),
  ('squad_up', 'Squad Up', 'Join or create a squad.', 'Users', 'bronze', 2, false),
  ('creator', 'Architect', 'Create your first challenge.', 'Sparkles', 'bronze', 2, false),
  ('level_10', 'Double Digits', 'Reach level 10.', 'Star', 'silver', 5, false),
  ('proof_pro', 'Proof Pro', 'Get 5 proofs approved.', 'ShieldCheck', 'silver', 5, false)
on conflict (id) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, tier = excluded.tier, xp_bonus = excluded.xp_bonus;

insert into public.challenges (title, description, difficulty, category, duration_days, xp_reward, tasks, visibility, requires_proof, is_official) values
  ('Walk for 10 minutes', 'A short, easy walk to get your body moving. Any pace counts — outdoors is a bonus.', 'easy', 'fitness', 1, 2, array['Walk for at least 10 minutes'], 'public', false, true),
  ('Read for 30 minutes', 'Pick any book and read for 30 focused minutes. No phone in reach.', 'medium', 'learning', 7, 6, array['Read 30 minutes', 'Write one sentence about what you read'], 'public', false, true),
  ('Complete a 5 km walk', 'Walk 5 kilometres in one session. Track it with any app and upload a screenshot as proof.', 'hard', 'fitness', 1, 10, array['Walk 5 km in one session', 'Stretch for 5 minutes afterwards'], 'public', true, true),
  ('7-day digital detox', 'No social media for seven days. Messaging friends and work tools are fine. Fill the gap with something offline.', 'extreme', 'discipline', 7, 17, array['No social media apps today', 'Spend 30 minutes on an offline hobby'], 'public', true, true),
  ('Hydration habit', 'Drink 8 glasses of water spread across the day.', 'easy', 'lifestyle', 7, 2, array['Drink 8 glasses of water'], 'public', false, true),
  ('Make your bed', 'Start every morning with one small win.', 'easy', 'discipline', 7, 2, array['Make your bed within 15 minutes of waking up'], 'public', false, true),
  ('Deep work sprint', 'One 90-minute block of distraction-free work every day. Phone in another room.', 'hard', 'productivity', 7, 10, array['90 minutes of deep work', 'Write down what you shipped'], 'public', false, true),
  ('4 Pomodoros', 'Four 25-minute focused sessions with short breaks.', 'medium', 'productivity', 1, 6, array['Complete 4 × 25-minute focus sessions'], 'public', false, true),
  ('No-spend weekend', 'Spend nothing on non-essentials for a whole weekend. Groceries and bills are fine.', 'medium', 'money', 3, 6, array['No non-essential purchases today', 'Log every expense'], 'public', false, true),
  ('30-day budget tracker', 'Track every expense for a month and review your categories each Sunday.', 'hard', 'money', 30, 10, array['Log all of today''s expenses'], 'public', false, true),
  ('Save 5 PLN a day', 'Move 5 PLN into savings every day. Small amounts, big habit.', 'easy', 'money', 14, 2, array['Transfer 5 PLN to savings'], 'public', false, true),
  ('Call a friend', 'Reach out to someone you haven''t spoken to in a while.', 'easy', 'social', 1, 2, array['Call or video-chat a friend for 10+ minutes'], 'public', false, true),
  ('Kindness streak', 'Give one genuine compliment every day.', 'medium', 'social', 7, 6, array['Give a genuine compliment', 'Note how they reacted'], 'public', false, true),
  ('Morning mobility', '15 minutes of gentle stretching or yoga every morning.', 'medium', 'fitness', 14, 6, array['15 minutes of stretching or yoga'], 'public', false, true),
  ('10k steps', 'Hit 10,000 steps today. Upload a screenshot of your step counter.', 'medium', 'fitness', 1, 6, array['Reach 10,000 steps'], 'public', true, true),
  ('Language learning', 'Practice a new language for 20 minutes daily.', 'medium', 'learning', 30, 6, array['20 minutes of practice', 'Learn 5 new words'], 'public', false, true),
  ('Finish a course module', 'Complete one module of an online course and summarize it.', 'hard', 'learning', 7, 10, array['Finish one module', 'Write a 3-bullet summary'], 'public', false, true),
  ('Evening journal', 'Write three things you''re grateful for and one lesson from the day.', 'easy', 'lifestyle', 7, 2, array['Write 3 gratitudes', 'Write 1 lesson'], 'public', false, true),
  ('Cool shower finish', 'End your shower with 30 seconds of cool (not ice-cold) water. Skip it if you feel unwell.', 'medium', 'discipline', 7, 6, array['30 seconds of cool water at the end of your shower'], 'public', false, true),
  ('Screens off by 22:00', 'No screens after 22:00 to protect your sleep.', 'hard', 'lifestyle', 14, 10, array['All screens off by 22:00', 'Get at least 7 hours of sleep'], 'public', false, true),
  ('Run 30 days', 'Go for a comfortable run every day for a month — distance doesn''t matter, consistency does. Rest if you feel pain.', 'extreme', 'fitness', 30, 17, array['Run for at least 15 minutes at a comfortable pace'], 'public', true, true),
  ('Ship a side project', 'Work on your side project every day for two weeks and ship a first version.', 'extreme', 'productivity', 14, 17, array['Work 45 minutes on the project', 'Commit or document progress'], 'public', false, true),
  ('Meal prep Sunday', 'Prepare balanced meals for the next three days.', 'medium', 'lifestyle', 1, 6, array['Prep 3 days of balanced meals'], 'public', false, true),
  ('Volunteer an hour', 'Give one hour of your time to a cause you care about.', 'hard', 'social', 1, 10, array['Volunteer for 1 hour'], 'public', true, true);
