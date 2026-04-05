import { useLanguage } from '@/context/language-context'

export function CodeSnippetCard() {
  const { messages: m } = useLanguage()

  const lines = [
    { n: '01', parts: [{ c: 'keyword' as const, t: 'package' }, { c: 'plain' as const, t: ' main' }] },
    { n: '02', parts: [{ c: 'keyword' as const, t: 'type' }, { c: 'plain' as const, t: ' Engineer struct {' }] },
    { n: '03', parts: [{ c: 'indent' as const, t: '    ' }, { c: 'field' as const, t: 'Name string' }] },
    { n: '04', parts: [{ c: 'indent' as const, t: '    ' }, { c: 'field' as const, t: 'Role string' }] },
    { n: '05', parts: [{ c: 'plain' as const, t: '}' }] },
    {
      n: '06',
      parts: [{ c: 'comment' as const, t: m.home.codeComment }],
    },
  ] as const

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl bg-primary/15 blur-2xl dark:bg-primary/25"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-[#0f172a] shadow-xl dark:border-white/10 dark:bg-[#020617]">
        <div className="flex gap-2 border-b border-white/10 px-5 py-4">
          <span className="h-3 w-3 rounded-full bg-red-400/90" />
          <span className="h-3 w-3 rounded-full bg-amber-400/90" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-slate-300">
          {lines.map((line) => (
            <div key={line.n} className="flex gap-3">
              <span className="w-6 shrink-0 text-slate-600">{line.n}</span>
              <span>
                {line.parts.map((p, i) => (
                  <span
                    key={i}
                    className={
                      p.c === 'keyword'
                        ? 'text-sky-400'
                        : p.c === 'field'
                          ? 'text-emerald-400'
                          : p.c === 'comment'
                            ? 'text-slate-500'
                            : ''
                    }
                  >
                    {p.t}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
      <div className="absolute -left-4 bottom-2 flex flex-col gap-2 sm:-left-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink shadow-md dark:bg-night dark:text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          {m.home.chipAws}
        </span>
        <span className="ml-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink shadow-md dark:bg-night dark:text-white">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          {m.home.chipDistributed}
        </span>
      </div>
    </div>
  )
}
