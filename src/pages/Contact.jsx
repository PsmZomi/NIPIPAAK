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
   <main className="pt-[130px] lg:pt-[115px]">

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


      {/* FAQ */}
      {/* <section className="border-t border-border bg-warm py-14">
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
      </section> */}
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
