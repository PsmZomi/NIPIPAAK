import { useState, useEffect } from 'react'
import { useReveal } from '../components/useReveal'

const reasons = [
  'General enquiry',
  'Pitch a story',
  'Press & media',
  'Advertising (we don\'t)',
  'Newsletter help',
  'Something else',
]

const faqs = [
  { q: 'How do I pitch a story?', a: 'Use the form below and select "Pitch a story". Include your headline, a 2–3 sentence summary, and a link to previous work. We respond within 5 business days.' },
  { q: 'Do you accept unsolicited work?', a: 'Yes — but please pitch first. We rarely accept fully written pieces without prior contact, as we prefer to work with writers from the outline stage.' },
  { q: 'How much do you pay?', a: 'We pay £400–£1,200 per published piece depending on length and research involved. We believe fair pay is non-negotiable.' },
  { q: 'How do I cancel my newsletter subscription?', a: 'Every newsletter email has an unsubscribe link at the bottom. Click it and you\'ll be removed within 24 hours.' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', reason: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => { window.scrollTo(0, 0) }, [])
  useReveal()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = e => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="pt-[105px] lg:pt-[89px]">

      {/* Header */}
      <div className="border-b border-border py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <p className="section-label mb-3">Get in Touch</p>
          <h1 className="text-4xl lg:text-6xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.03em' }}>
            Say hello.
          </h1>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-14">
        <div className="grid lg:grid-cols-12 gap-14">

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="reveal">
              {submitted ? (
                <div className="bg-warm border border-border p-10 text-center">
                  <span className="text-5xl block mb-4">✉️</span>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Message received.
                  </h2>
                  <p className="text-muted text-sm">
                    We'll get back to you within 3–5 business days. Thank you for reaching out.
                  </p>
                  <button onClick={() => { setSubmitted(false); setForm({ name:'', email:'', reason:'', message:'' }) }}
                    className="btn-ghost mt-6">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="section-label mb-2 block">Your name *</label>
                      <input required name="name" value={form.name} onChange={handleChange}
                        placeholder="Full name" className="form-input" />
                    </div>
                    <div>
                      <label className="section-label mb-2 block">Email address *</label>
                      <input required type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="you@example.com" className="form-input" />
                    </div>
                  </div>
                  <div>
                    <label className="section-label mb-2 block">Reason for contact *</label>
                    <select required name="reason" value={form.reason} onChange={handleChange} className="form-input">
                      <option value="">Select a reason…</option>
                      {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="section-label mb-2 block">Message *</label>
                    <textarea required name="message" value={form.message} onChange={handleChange}
                      rows={6} placeholder="Tell us what's on your mind…" className="form-input resize-none" />
                  </div>
                  <button type="submit" className="btn-red w-full sm:w-auto px-10 py-3.5">
                    Send Message →
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-5 space-y-8">
            {/* Contact cards */}
            <div className="reveal">
              <p className="section-label mb-5">Our Channels</p>
              <div className="space-y-4">
                {[
                  { icon: '✉️', label: 'General', value: 'hello@inkwell.pub' },
                  { icon: '📝', label: 'Editorial', value: 'edit@inkwell.pub' },
                  { icon: '🐦', label: 'Twitter', value: '@inkwellmag' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 py-3 border-b border-border">
                    <span className="text-xl w-8">{item.icon}</span>
                    <div>
                      <p className="section-label">{item.label}</p>
                      <p className="text-sm font-medium text-ink">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="reveal bg-ink p-7">
              <p className="section-label text-white/40 mb-2">Stay in the loop</p>
              <h3 className="text-white text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Weekly newsletter
              </h3>
              <p className="text-white/60 text-sm mb-4">Our best stories every Sunday morning. Free forever.</p>
              <input type="email" placeholder="your@email.com"
                className="form-input bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-accent mb-3" />
              <button className="btn-red w-full">Subscribe</button>
            </div>

            {/* Response time */}
            <div className="reveal border border-border p-5 flex gap-4 items-start">
              <span className="text-2xl">⏱</span>
              <div>
                <h4 className="font-bold text-sm mb-1">Response time</h4>
                <p className="text-muted text-xs leading-relaxed">
                  We typically respond to all enquiries within 3–5 business days. Story pitches may take a little longer as we read everything carefully.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-warm py-14">
        <div className="max-w-3xl mx-auto px-5 lg:px-10">
          <div className="reveal text-center mb-10">
            <p className="section-label mb-3">FAQ</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Common questions
            </h2>
          </div>
          <div className="space-y-5">
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function FAQItem({ faq, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`reveal d${index+1} border border-border bg-paper`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-medium text-sm">{faq.q}</span>
        <span className={`text-accent transition-transform duration-200 font-mono text-lg ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40' : 'max-h-0'}`}>
        <p className="px-6 pb-5 text-sm text-muted leading-relaxed border-t border-border pt-4">{faq.a}</p>
      </div>
    </div>
  )
}
