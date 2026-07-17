/**
 * Displays a clean card-style info popup for hotspots.
 * @param {Object} options - Popup configuration.
 * @param {string} options.title - The title of the popup.
 * @param {string} options.description - The description text.
 * @param {Object} [options.position] - Optional screen coordinates {x, y} to position the popup.
 */
export function showInfoPopup({ title, description, position }) {
  // Check if a popup already exists and remove it to prevent duplicates
  const existingPopup = document.getElementById('hotspot-info-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'hotspot-info-popup';
  Object.assign(popup.style, {
    position: 'absolute',
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    width: '250px',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    zIndex: '200',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    opacity: '0',
    transform: 'scale(0.95)'
  });

  // Default to center if position is not provided
  if (position && position.x !== undefined && position.y !== undefined) {
    // Add offset so it's not directly under the cursor
    popup.style.left = `${position.x + 15}px`;
    popup.style.top = `${position.y + 15}px`;
  } else {
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%) scale(0.95)';
  }

  const titleEl = document.createElement('h3');
  titleEl.innerText = title;
  Object.assign(titleEl.style, {
    margin: '0 0 10px 0',
    fontSize: '18px',
    color: '#a0b0ff'
  });

  const descEl = document.createElement('p');
  descEl.innerText = description;
  Object.assign(descEl.style, {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#ccc'
  });

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = 'Close';
  Object.assign(closeBtn.style, {
    marginTop: '15px',
    width: '100%',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  });

  closeBtn.addEventListener('mouseover', () => closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)');
  closeBtn.addEventListener('mouseout', () => closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)');
  
  closeBtn.addEventListener('click', () => {
    popup.style.opacity = '0';
    setTimeout(() => popup.remove(), 200);
  });

  popup.appendChild(titleEl);
  popup.appendChild(descEl);
  popup.appendChild(closeBtn);
  document.body.appendChild(popup);

  // Trigger entrance animation
  setTimeout(() => {
    popup.style.opacity = '1';
    if (!position) {
      popup.style.transform = 'translate(-50%, -50%) scale(1)';
    } else {
      popup.style.transform = 'scale(1)';
    }
  }, 10);
}
