---
name: write-public-cv
description: >-
  Write or revise Tomas Babjak public CVs from persona facts. Use when editing
  cv HTML or CV PDFs, adding a role-specific CV, or tailoring a CV from a
  pasted job description. Covers the full-stack, frontend, and backend base
  CVs and later job-description tailoring.
---

# Write a public CV

Facts come from `tomi-interview-bot/persona.md` only. The public files live in `tomi-playground/cv/` and `tomi-playground/public/`.

Three base CVs exist. They share employers, dates, and facts. The title, the summary, the skill order, and the leading bullets change by role.

| Role | Title | HTML | PDF |
| --- | --- | --- | --- |
| Full-stack | Senior Full-Stack Engineer | `cv/cv.html` | `public/tomi-babjak-cv.pdf` |
| Frontend | Senior Frontend Engineer | `cv/cv-frontend.html` | `public/tomi-babjak-cv-frontend.pdf` |
| Backend | Senior Backend Engineer | `cv/cv-backend.html` | `public/tomi-babjak-cv-backend.pdf` |

Product Engineer stays off every CV title.

## Facts

1. Copy employers, dates, tools, and numbers from the persona.
2. If the persona has no number, describe the mechanism. Do not invent a percentage, a user count, or a latency figure.
3. If a tool is not in the persona, leave it out.
4. Do not add a company description that the persona does not contain.

## Bullet

Each bullet has two parts. The first part is the action. The second part is the result or the constraint.

1. Start with a past-tense engineering verb: Built, Developed, Migrated, Implemented, Extracted, Deployed, or Led.
2. Put a concrete tool or system in the first five words.
3. Do not open a bullet with Documented, Supported, Participated, or Collaborated.
4. Put the strongest bullet for that role first.
5. Do not explain the company. Name the personal contribution.

Read [examples.md](examples.md) before you rewrite bullets.

## Page order

1. Name, one role title, city, and contact.
2. Summary of about three sentences. Lead with the role, the years, and the tools for that CV.
3. Skills. Put the role's tools first. Keep real tools from the other slices, lower on the list.
4. Experience, newest first. Keep every employer so the dates stay continuous.
5. Projects, with a link when the persona has one.
6. Education, at the bottom, with no faculty (the persona lists none).
7. Interests. Use plane spotting. Do not list computers, reading, or travel.

The first half page must scan as engineering work. End with a project and the interest, not with a hobby-only close before the work.

## Role focus

- Full-stack: balance UI and services. Lead with pages plus the API or data store on the same bullet when both are true.
- Frontend: lead with React, Next.js, TypeScript, Storybook, and the browser extensions. Keep one service or data bullet per job so the career stays honest. Put GKE, SQL cutovers, and schema work after the UI bullets.
- Backend: lead with Go, Node.js, Postgres, AWS, GCP, and GKE. Put UI work after the service bullets. Keep CLEEVIO as one short bullet so the timeline stays complete.

## Job description match

Ask Tomi Match to your JD is visitor-facing. Specs live in `tomi-playground/specs/ask-tomi.feature`. The Worker contract lives in `tomi-interview-bot/specs/cv-match.feature`.

1. The browser parses PDF or DOCX and sends `jd_text` to `POST /cv-match`.
2. The Worker picks the closest base CV (frontend, backend, or full-stack).
3. It rewrites the summary and reorders canned skills and bullets so the first words match the job.
4. Use only persona facts. If the job names a tool that is not in the persona, leave it out.
5. Do not change employers or dates. Do not add a fourth title.
6. The visitor sees a chat preview, then Print CV. Do not add a sidebar route.

## After an edit

1. Update the matching HTML file. Keep `cv/cv.css` shared.
2. Print each changed HTML file to its PDF under `tomi-playground/public/`.
3. If the visitor-facing download changes, update `specs/ask-tomi.feature` first.
