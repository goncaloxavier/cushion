import {prefersReducedMotion} from '$lib/motion'

type LineRevealOptions = {base?: number}

const sanityStegaMetadataPattern = /[\u200B-\u200D\uFEFF]/

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// Splits a heading's text into its visually-wrapped lines and reveals each line
// from behind a mask with a small stagger. Re-measures on resize (debounced) and
// only runs after webfonts are ready so the line breaks are correct.
export function lineReveal(node: HTMLElement, options: LineRevealOptions = {}) {
  const base = options.base ?? 0

  if (prefersReducedMotion()) {
    return {}
  }

  const rawText = node.textContent ?? ''
  if (sanityStegaMetadataPattern.test(rawText)) {
    return {}
  }

  const text = rawText.replace(/\s+/g, ' ').trim()
  if (!text) return {}

  const originalHTML = node.innerHTML
  let observer: IntersectionObserver | undefined
  let resizeTimer = 0
  let revealTimer = 0
  let revealed = false
  let lineWidth = window.innerWidth

  const reveal = () => {
    revealed = true
    node.classList.add('is-revealed')
    observer?.disconnect()
  }

  const isInView = () => {
    const rect = node.getBoundingClientRect()
    return rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * -0.12
  }

  const measureLines = (): string[] => {
    const words = text.split(' ')
    node.textContent = ''
    const spans = words.map((word) => {
      const span = document.createElement('span')
      span.textContent = word
      return span
    })
    spans.forEach((span, index) => {
      node.appendChild(span)
      if (index < spans.length - 1) node.appendChild(document.createTextNode(' '))
    })

    const lines: string[] = []
    let lastTop: number | null = null
    spans.forEach((span, index) => {
      const top = span.offsetTop
      if (lastTop === null || top !== lastTop) {
        lines.push(words[index])
        lastTop = top
      } else {
        lines[lines.length - 1] += ` ${words[index]}`
      }
    })
    return lines
  }

  const render = (lines: string[]) => {
    node.classList.add('line-reveal')
    node.innerHTML = lines
      .map(
        (line, index) =>
          `<span class="line-mask"><span class="line-inner" style="--line-index:${index}; --line-base:${base}ms">${escapeHtml(
            line,
          )}</span></span>`,
      )
      .join('')
  }

  const build = () => {
    try {
      const lines = measureLines()
      if (!lines.length) {
        node.innerHTML = originalHTML
        return
      }
      render(lines)
      if (revealed) node.classList.add('is-revealed')
    } catch {
      node.innerHTML = originalHTML
      node.classList.add('is-revealed')
    }
  }

  const start = () => {
    build()
    if (isInView()) {
      requestAnimationFrame(reveal)
      return
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
        }
      },
      {rootMargin: '0px 0px -12% 0px', threshold: 0},
    )
    observer.observe(node)
    revealTimer = window.setTimeout(() => {
      if (!revealed && isInView()) reveal()
    }, 360)
  }

  const onResize = () => {
    if (Math.abs(window.innerWidth - lineWidth) < 1) return
    lineWidth = window.innerWidth
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(build, 180)
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(start)
  } else {
    start()
  }
  window.addEventListener('resize', onResize)

  return {
    destroy() {
      observer?.disconnect()
      window.clearTimeout(resizeTimer)
      window.clearTimeout(revealTimer)
      window.removeEventListener('resize', onResize)
    },
  }
}
