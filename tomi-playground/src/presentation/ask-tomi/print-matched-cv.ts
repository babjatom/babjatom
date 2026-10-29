import exo400 from '@fontsource/exo-2/files/exo-2-latin-400-normal.woff2?url'
import exo500 from '@fontsource/exo-2/files/exo-2-latin-500-normal.woff2?url'
import exo600 from '@fontsource/exo-2/files/exo-2-latin-600-normal.woff2?url'
import type { MatchedCv } from '@/infrastructure/tomi-cv-match-api'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function absoluteAsset(path: string, origin = window.location.origin): string {
  return new URL(path, origin).href
}

function printCss(origin = window.location.origin): string {
  const font400 = absoluteAsset(exo400, origin)
  const font500 = absoluteAsset(exo500, origin)
  const font600 = absoluteAsset(exo600, origin)
  return `
@font-face {
  font-family: "Exo 2";
  font-style: normal;
  font-weight: 400;
  src: url("${font400}") format("woff2");
}
@font-face {
  font-family: "Exo 2";
  font-style: normal;
  font-weight: 500;
  src: url("${font500}") format("woff2");
}
@font-face {
  font-family: "Exo 2";
  font-style: normal;
  font-weight: 600;
  src: url("${font600}") format("woff2");
}
@page { size: A4; margin: 12mm 14mm 12mm 14mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  color: #1c1917;
  font-family: "Exo 2", sans-serif;
  font-size: 10pt;
  font-weight: 400;
  line-height: 1.4;
}
a { color: inherit; text-decoration: none; }
h1, h2, p { margin: 0; }
header { border-bottom: 1.25pt solid #1c1917; padding-bottom: 8px; }
.opening { font-size: 10.5pt; line-height: 1.48; }
.opening h1 { font-size: 26pt; line-height: 1.05; }
.opening .headline { margin-top: 6px; font-size: 12pt; line-height: 1.3; }
.opening .contact { margin-top: 5px; font-size: 9.5pt; line-height: 1.35; }
.opening .summary { margin-top: 16px; line-height: 1.5; }
.opening h2 { margin-top: 18px; margin-bottom: 8px; }
.opening .skills div { margin-top: 5px; }
.opening .job { margin-top: 16px; }
.opening .stack { font-size: 9.3pt; }
.opening li + li { margin-top: 5px; }
h1 {
  font-family: "Exo 2", sans-serif;
  font-size: 22pt;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.05;
}
.aka { font-weight: 600; }
.headline { margin-top: 3px; font-size: 11pt; font-weight: 500; }
.contact { margin-top: 3px; font-size: 9pt; line-height: 1.4; }
h2 {
  margin: 12px 0 5px;
  border-bottom: 0.6pt solid #1c1917;
  padding-bottom: 1px;
  font-size: 9.5pt;
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
}
.summary { margin-top: 9px; }
.skills { margin: 0; }
.skills div {
  display: grid;
  grid-template-columns: 7.6em 1fr;
  column-gap: 8px;
  margin-top: 1px;
}
.skills dt { font-weight: 600; }
.skills dd { margin: 0; }
.job, .project { break-inside: avoid; margin-top: 9px; }
.page-break { break-before: page; margin-top: 0; }
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}
.role { font-weight: 600; }
.when { flex: none; font-variant-numeric: tabular-nums; font-weight: 500; }
.meta, .stack { color: #292524; }
.stack { font-size: 8.8pt; }
ul { margin: 2px 0 0; padding-left: 1.05em; }
li { margin: 0; padding: 0; }
li + li { margin-top: 2px; }
`.trim()
}

function bulletsHtml(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

export function matchedCvHtml(
  cv: MatchedCv,
  origin = typeof window === 'undefined' ? 'https://tomibabjak.dev' : window.location.origin,
): string {
  const skills = cv.skills
    .map(
      (skill) =>
        `<div><dt>${escapeHtml(skill.group)}</dt><dd>${escapeHtml(skill.items)}</dd></div>`,
    )
    .join('')
  const projects = cv.projects
    .map((project) => {
      const name = project.href
        ? `${escapeHtml(project.name)} · <a href="${escapeHtml(project.href)}">${escapeHtml(project.href.replace(/^https:\/\//, ''))}</a>`
        : escapeHtml(project.name)
      return `<article class="project">
      <div class="row">
        <p class="role">${name}</p>
        <p class="when">${escapeHtml(project.when)}</p>
      </div>
      ${bulletsHtml(project.bullets)}
    </article>`
    })
    .join('\n')
  const openingJobs = cv.jobs.slice(0, 2)
  const restJobs = cv.jobs.slice(2)
  const openingJobsHtml = jobsFor(openingJobs)
  const restJobsHtml = jobsFor(restJobs)

  function jobsFor(list: MatchedCv['jobs']): string {
    return list
      .map((job) => {
        const pageBreak = job.pageBreak ? ' page-break' : ''
        return `<article class="job${pageBreak}">
      <div class="row">
        <p class="role">${escapeHtml(job.title)}</p>
        <p class="when">${escapeHtml(job.when)}</p>
      </div>
      <p class="meta">${escapeHtml(job.location)}</p>
      <p class="stack">${escapeHtml(job.stack)}</p>
      ${bulletsHtml(job.bullets)}
    </article>`
      })
      .join('\n')
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Tomas Babjak (Tomi), ${escapeHtml(cv.headline.split(' · ')[0] ?? cv.headline)}</title>
    <style>${printCss(origin)}</style>
  </head>
  <body>
    <div class="opening">
    <header>
      <h1>Tomas Babjak <span class="aka">(Tomi)</span></h1>
      <p class="headline">${escapeHtml(cv.headline)}</p>
      <p class="contact">
        <a href="mailto:babjatom@gmail.com">babjatom@gmail.com</a>
        ·
        <a href="tel:+66827829578">+66 82 782 9578</a>
        ·
        <a href="https://www.linkedin.com/in/babyak">linkedin.com/in/babyak</a>
        ·
        <a href="https://github.com/babjatom">github.com/babjatom</a>
        ·
        <a href="https://tomibabjak.dev">tomibabjak.dev</a>
      </p>
    </header>
    <p class="summary">${escapeHtml(cv.summary)}</p>
    <h2>Skills</h2>
    <dl class="skills">${skills}</dl>
    <h2>Experience</h2>
    ${openingJobsHtml}
    </div>
    ${restJobsHtml}
    <h2>Projects</h2>
    ${projects}
    <h2>Education</h2>
    <div class="row">
      <p class="role">${escapeHtml(cv.education.school)}</p>
      <p class="when">${escapeHtml(cv.education.when)}</p>
    </div>
    <h2>Interests</h2>
    <p>${escapeHtml(cv.interests)}</p>
  </body>
</html>`
}

export function printMatchedCv(
  cv: MatchedCv,
  openWindow: typeof window.open = window.open.bind(window),
): boolean {
  const html = matchedCvHtml(cv)
  const popup = openWindow('', '_blank', 'noopener,noreferrer')
  if (!popup) return false
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.onload = () => {
    popup.print()
  }
  if (popup.document.readyState === 'complete') {
    popup.print()
  }
  return true
}
