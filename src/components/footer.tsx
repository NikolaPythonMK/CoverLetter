export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-white/5 backdrop-blur-md">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-white/70 sm:flex-row">
        <p>© {new Date().getFullYear()} CoverlyAI</p>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:text-white">
            Privacy
          </a>
          <a href="/terms" className="hover:text-white">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
