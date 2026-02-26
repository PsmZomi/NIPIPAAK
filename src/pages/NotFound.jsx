import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="pt-[105px] lg:pt-[89px] min-h-screen flex items-center justify-center">
      <div className="text-center px-5">
        <p className="text-8xl mb-6">📰</p>
        <h1 className="text-7xl font-bold mb-4"
          style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.04em' }}>
          404
        </h1>
        <p className="text-muted text-base mb-8 max-w-sm mx-auto">
          This page seems to have gone to print. Let's get you back to a story.
        </p>
        <Link to="/" className="btn-red">← Back to Inkwell</Link>
      </div>
    </main>
  )
}
