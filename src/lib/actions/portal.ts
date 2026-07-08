// Renders a node as a direct child of <body> so it escapes a routed page's
// clip-path stacking context (otherwise the sticky header paints over it on
// pages that use one, breaking full-screen overlays like lightboxes/dialogs).
export const portal = (node: HTMLElement) => {
  document.body.appendChild(node)
  return {
    destroy() {
      node.remove()
    },
  }
}
