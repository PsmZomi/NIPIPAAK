import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useReveal } from '../components/useReveal'

const values = [
  // { icon: '📖', title: 'Depth over virality', desc: 'We publish long-form writing designed to be read slowly and remembered — not shared reflexively.' },

]

const milestones = [
  // { year: '2021', event: ell founded in Milan with four writers and a shared Google Doc.' },
  // { year: '2022', event: 'First 1,000 subscribers. Launched paid newsletter tier.' },
  // { year: '2023', event: 'Won the BSME Digital Magazine of the Year award.' },
  // { year: '2024', event: 'Reached 40,000 monthly readers across 60 countries.' },
  // { year: '2025', event: 'Launched theell Fellowship for emerging writers.' },
  ,,,
]

export default function About() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  useReveal()

  return (
    <main className="pt-[50px] lg:pt-[115px]">

      {/* Hero */}
      <div className="bg-paper py-4 lg:py-10">
        <div className="max-w-3xl mx-auto px-5 lg:px-10 text-center">
          <p className="section-label text-gray-400 mb-1"> NIPIPAAK</p>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-5"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.03em' }}>
            An independent newsletter of the <br /> 
            <em className="italic text-accent">for the curious.</em>
          </h1>
          <p className="text-ink text-base lg:text-lg leading-relaxed max-w-xl mx-auto">
            We believe the world has enough hot takes. We're here for the slow burn — considered, carefully reported, and for the curious.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-5 lg:px-20 py-10">
        <div className="reveal grid lg:grid-cols-2 gap-12 items-center text-center">
          <div>
            <p className="section-label mb-3">Our Mission</p>
            <h2 className="text-4xl font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              GAM LEH NAM ADING IN
            </h2>
            
            {/* <p className="text-muted leading-relaxed text-sm">
              We're here for the long haul. We're not here to make a quick buck. We're here to make a difference.
            </p> */}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border bg-warm py-10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="reveal text-center mb-12">
            <p className="section-label mb-3">What We Stand For</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Our values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={v.title} className={`reveal d${i+1} bg-paper border border-border p-7`}>
                <span className="text-3xl block mb-4">{v.icon}</span>
                <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{v.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-8">
        <div className="reveal text-center lg:text-end mb-12">
          <p className="section-label mb-3">Our Story</p>
          <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>The milestones</h2>
        </div>
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border hidden sm:block" />
          <div className="space-y-8">
            {milestones.map((m, i) => (
              <div key={m.year} className={`reveal d${i+1} flex gap-6 items-start`}>
                <div className="flex-shrink-0 w-16 text-right">
                  <span className="text-xs font-mono font-bold text-accent">{m.year}</span>
                </div>
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-accent mt-0.5 hidden sm:block z-10" />
                <p className="text-sm text-muted leading-relaxed">{m.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="border-t border-border bg-ink py-14 text-center">
        <div className="reveal max-w-xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Want to write for us?
          </h2>
          <p className="text-white/60 text-sm mb-6">We're always looking for writers with something original to say. We pay fairly and edit carefully.</p>
          <Link to="/contact" className="btn-red">Get in Touch</Link>
        </div>
      </div>
    </main>
  )
}
