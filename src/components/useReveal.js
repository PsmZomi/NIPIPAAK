import { useEffect } from 'react'

/**
 * Fade/slide in .reveal blocks when they enter the viewport.
 * Watches the DOM so items rendered after async data (e.g. Firestore) still get observed.
 */
export function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        }),
      { threshold: 0.1 }
    )

    const observed = new WeakSet()

    const observeRevealNodes = (root) => {
      if (!root || root.nodeType !== Node.ELEMENT_NODE) return

      if (root.matches?.('.reveal') && !observed.has(root)) {
        observed.add(root)
        observer.observe(root)
      }

      root.querySelectorAll?.('.reveal').forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el)
          observer.observe(el)
        }
      })
    }

    observeRevealNodes(document.body)

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) observeRevealNodes(node)
        })
      }
    })

    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      observer.disconnect()
    }
  }, [])
}
