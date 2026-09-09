import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TomiAiPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Tomi AI
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Coming soon — interview and screening Q&amp;A assistant about Tomi
          (babjatom). Ask about experience, stack, or approach.
        </p>
      </header>

      <section className="animate-rise-delay flex flex-col gap-3">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Label htmlFor="tomi-ai-question">Question</Label>
            <Input
              id="tomi-ai-question"
              name="question"
              type="text"
              placeholder="Ask about Tomi’s experience, stack, or approach…"
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled>
            Ask
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Answers are not available yet. This input is a placeholder for the
          upcoming assistant.
        </p>
      </section>
    </div>
  )
}
