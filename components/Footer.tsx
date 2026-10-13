export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mx-auto max-w-6xl px-6 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <span className="font-semibold text-slate-500 dark:text-slate-400">TallyWeb</span>
        {" · double-entry accounting · built with Next.js + better-sqlite3 · "}
        <a
          href="https://github.com/Vaskoor/ai-accounting"
          className="underline-offset-2 hover:text-slate-600 hover:underline dark:hover:text-slate-300"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
