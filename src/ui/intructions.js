// Instructions panel. The "Begin Exploring" button hides the panel, requests
// pointer lock on the canvas, and hands control back to main.js via onBegin.

export function setupInstructions(onBegin) {
  const panel = document.getElementById('instructions-panel')
  const beginBtn = document.getElementById('begin-exploring')

  if (!panel || !beginBtn) return

  beginBtn.addEventListener('click', () => {
    panel.classList.add('hidden')

    // Request pointer lock directly on the canvas (a user gesture is required,
    // which this click satisfies).
    const canvas = document.getElementById('three-canvas')
    if (canvas && canvas.requestPointerLock) {
      canvas.requestPointerLock()
    }

    if (typeof onBegin === 'function') onBegin()
  })
}
