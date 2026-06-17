// Welcome screen overlay. Shown on load; the "Start Tour" button fades it out
// and reveals the instructions panel.

export function setupWelcomeScreen(onStart) {
  const welcome = document.getElementById('welcome-screen')
  const instructions = document.getElementById('instructions-panel')
  const startBtn = document.getElementById('start-tour')

  if (!welcome || !startBtn) return

  // Make sure it's visible on load.
  welcome.classList.remove('hidden')

  startBtn.addEventListener('click', () => {
    // Fade out, then remove from layout once the transition finishes.
    welcome.classList.add('fade-out')
    setTimeout(() => {
      welcome.classList.add('hidden')
      welcome.classList.remove('fade-out')
      if (instructions) instructions.classList.remove('hidden')
      if (typeof onStart === 'function') onStart()
    }, 500)
  })
}
