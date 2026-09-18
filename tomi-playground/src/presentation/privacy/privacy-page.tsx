export function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 animate-rise">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Short note for this personal portfolio — not a product privacy program.
        </p>
      </header>

      <div className="space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          This site does not use advertising cookies or product analytics
          trackers. Optional Mixpanel tracking is left off in the public GitHub
          Pages build.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Hosting</h2>
          <p>
            The playground is hosted on GitHub Pages. GitHub (and any CDN in
            front of it) may process request metadata such as IP address, user
            agent, and referrer in access logs in order to serve the site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Local storage</h2>
          <p>
            Theme, font, and background preferences are stored only in your
            browser (
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              localStorage
            </code>
            ). That data does not leave your device for theming, typefaces, or
            ambient background choices and maze settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Ask Tomi</h2>
          <p>
            If you use Ask Tomi, the question text and a short-lived session id
            are sent to a Cloudflare Worker (
            <code className="break-all rounded bg-muted px-1 py-0.5 text-xs">
              tomi-interview-bot.tomibabjak.workers.dev
            </code>
            ) to generate a reply. Do not send secrets, passwords, or other
            sensitive information. Chat history stays in this browser tab until
            you clear it or leave; the session id rotates after about 30 minutes
            of inactivity.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            GitHub profile pixel
          </h2>
          <p>
            The GitHub profile README may load a visitor-counter image from a
            Cloudflare Worker (
            <code className="break-all rounded bg-muted px-1 py-0.5 text-xs">
              github-visitors-tracking.tomibabjak.workers.dev
            </code>
            ). That request can include typical image-request metadata when the
            README is viewed on GitHub.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Contact</h2>
          <p>
            Questions about this page:{' '}
            <a
              href="https://github.com/babjatom"
              className="underline underline-offset-4 hover:text-foreground"
              rel="noreferrer"
              target="_blank"
            >
              github.com/babjatom
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
