/**
 * Creates a dismissible instructions panel listing controls.
 */
export function createInstructionsPanel() {
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'absolute',
    bottom: '30px',
    left: '30px',
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    zIndex: '50',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    transform: 'translateY(20px)',
    opacity: '0',
    pointerEvents: 'none'
  });

  const title = document.createElement('h3');
  title.innerText = 'Controls';
  Object.assign(title.style, {
    margin: '0 0 15px 0',
    fontSize: '18px',
    color: '#e0a0ff'
  });

  const list = document.createElement('ul');
  Object.assign(list.style, {
    margin: '0',
    padding: '0',
    listStyleType: 'none',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#ccc'
  });

  const controls = [
    '<b>W A S D</b> = Move',
    '<b>Mouse</b> = Look Around',
    '<b>Click hotspots</b> for info'
  ];

  controls.forEach(htmlText => {
    const li = document.createElement('li');
    li.innerHTML = htmlText;
    li.style.marginBottom = '8px';
    list.appendChild(li);
  });

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1'
  });

  closeBtn.addEventListener('hover', () => closeBtn.style.color = '#fff');
  closeBtn.addEventListener('click', () => {
    panel.style.opacity = '0';
    panel.style.pointerEvents = 'none';
  });

  panel.appendChild(closeBtn);
  panel.appendChild(title);
  panel.appendChild(list);
  document.body.appendChild(panel);

  // Trigger entrance animation slightly after creation
  setTimeout(() => {
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
    panel.style.pointerEvents = 'auto';
  }, 100);
}
