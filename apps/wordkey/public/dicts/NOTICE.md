# Dictionary source and license

The dictionary datasets distributed in this directory were compared against
https://github.com/RealKai42/qwerty-learner/tree/master/public/dicts on 2026-10-12.
All seven are identical after JSON parsing and serialization:

- Oxford5000.json, CET4_T.json, CET6_T.json, KaoYan_2024.json, TOEFL_3_T.json,
  IELTS_3_T.json retain their upstream filenames.
- coder.json corresponds to upstream it-words.json (filename changed, data unchanged).

Copyright remains with the respective upstream authors and contributors.
Qwerty Learner distributes its repository under GNU GPL version 3; the license
is reproduced in COPYING.txt. This attribution does not imply endorsement by
Oxford, examination providers, or Qwerty Learner, or independently establish
rights to any third-party source material included upstream.

Machine-readable dictionary source is served here as JSON; this application's
source is available at https://github.com/datashowme-me/doggydad/tree/main/apps/wordkey.

Pronunciation and online dictionary lookup use third-party Youdao services;
their availability and terms are independent of the bundled datasets.
