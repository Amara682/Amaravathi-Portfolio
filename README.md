# Amaravathi A Blue Neon Portfolio

## Run
Best: open a terminal in this folder and run `python -m http.server 8000`, then open http://localhost:8000 (needed for the contact form to reach FormSubmit; music also works by double-clicking index.html).

## 1. Music (required file)
Save the Pixabay MP3 as `assets/epic-violin.mp3` (see `assets/ADD_EPIC_VIOLIN_MP3_HERE.txt`).
Source: https://pixabay.com/music/main-title-epic-violin-cinematic-instrumental-music-283511/
It starts from the ENTER IF YOU DARE click, loops, and has play/pause, mute and volume in the bottom-left dock. If the file is missing the dock says so.

## 2. Contact form (FormSubmit, no key or backend)
Messages go to amara2004@gmail.com (change the `action` URL in `index.html` and the fallback text in `script.js` to use another address).
One-time activation: host the site (or use localhost), submit the form once, then open the activation email from FormSubmit in that inbox (check Spam) and click Activate Form. Then submit again and check the inbox.
The page shows success only when FormSubmit confirms; otherwise it shows a clear error or activation notice.
