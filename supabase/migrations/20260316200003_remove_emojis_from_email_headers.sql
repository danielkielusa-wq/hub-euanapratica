-- Remove amateur emoji icons from all email template headers

-- 1. Remove standalone emoji paragraphs (the big 48px emoji used in some headers like mentoria)
UPDATE public.email_templates
SET body_html = regexp_replace(
  body_html,
  E'\\s*<p style="font-size: 48px[^"]*">[^<]+</p>\\s*',
  E'\n              ',
  'g'
)
WHERE body_html LIKE '%font-size: 48px%';

-- 2. Remove leading emojis from h1 headings
UPDATE public.email_templates
SET body_html = regexp_replace(
  body_html,
  E'(<h1[^>]*>)\\s*[✅⏰🔔🔄❌😕🎉⚠️😢🏢👥📊🚀💡🔥⚡📋🎯🤝📅💰💬📢📌🎓💪🏆⭐📈🔑💼🌟🛡⏳🆘❗🚨💳🔐📧👋📩🎁👀🤔💎🔒]+\\s*',
  E'\\1',
  'g'
)
WHERE body_html ~ '<h1[^>]*>\s*[^\w\s<]';

-- 3. Remove leading emojis from h2 headings (some templates use h2 in header)
UPDATE public.email_templates
SET body_html = regexp_replace(
  body_html,
  E'(<h2[^>]*>)\\s*[✅⏰🔔🔄❌😕🎉⚠️😢🏢👥📊🚀💡🔥⚡📋🎯🤝📅💰💬📢📌🎓💪🏆⭐📈🔑💼🌟🛡⏳🆘❗🚨💳🔐📧👋📩🎁👀🤔💎🔒]+\\s*',
  E'\\1',
  'g'
)
WHERE body_html ~ '<h2[^>]*>\s*[^\w\s<]';
