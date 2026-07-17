/**
 * Creates a full-screen welcome overlay.
 * @param {Function} onStart - Callback function executed when "Start Tour" is clicked.
 */
export function createWelcomeScreen(onStart) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
    color: '#fff',
    transition: 'opacity 0.5s ease'
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    padding: '40px 60px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    maxWidth: '90%'
  });

  const title = document.createElement('h1');
  title.innerText = 'Sports Hall Tour';
  Object.assign(title.style, {
    margin: '0 0 10px 0',
    fontSize: '36px',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #a0b0ff, #e0a0ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  });

  const subtitle = document.createElement('p');
  subtitle.innerText = 'Interactive 3D Campus Tour';
  Object.assign(subtitle.style, {
    margin: '0 0 30px 0',
    fontSize: '18px',
    color: '#aaa'
  });

  const startBtn = document.createElement('button');
  startBtn.innerText = 'Start Tour';
  Object.assign(startBtn.style, {
    padding: '12px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#aa3bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, background-color 0.2s',
    boxShadow: '0 4px 15px rgba(170, 59, 255, 0.4)'
  });

  startBtn.addEventListener('mouseover', () => {
    startBtn.style.backgroundColor = '#b854ff';
    startBtn.style.transform = 'translateY(-2px)';
  });
  startBtn.addEventListener('mouseout', () => {
    startBtn.style.backgroundColor = '#aa3bff';
    startBtn.style.transform = 'translateY(0)';
  });

  startBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (onStart) onStart();
    }, 500); // Wait for fade out
  });

  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(startBtn);
  overlay.appendChild(card);
  
  document.body.appendChild(overlay);
}
