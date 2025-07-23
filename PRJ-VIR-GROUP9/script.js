document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginSection = document.getElementById('login');
  const dashboardSection = document.getElementById('dashboard');
  const devicesSection = document.getElementById('devices');
  const pages = document.querySelectorAll('.page');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const header = document.getElementById('mainHeader');
  const sidebar = document.getElementById('mainSidebar');

  // Devices modal and list elements
  const addDeviceBtn = document.getElementById('addDeviceBtn');
  const addDeviceModal = document.getElementById('addDeviceModal');
  const closeModalBtn = document.getElementById('closeModal');
  const addDeviceForm = document.getElementById('addDeviceForm');
  const deviceList = document.getElementById('deviceList');

  // Sidebar links for navigation
  const sidebarLinks = document.querySelectorAll('.sidebar__link');

  // MQTT Setup
  const brokerUrl = 'ws://192.168.x.x:9001'; // replace with your MQTT broker IP
  const mqttOptions = {
    clientId: 'webClient_' + Math.random().toString(16).substr(2, 8),
    keepalive: 60,
    clean: true,
    reconnectPeriod: 1000,
  };

  // Store device states by name
  const deviceStates = {};

  // Show only login page and hide header/sidebar on load
  function showLogin() {
    pages.forEach(p => p.classList.add('hidden'));
    loginSection.classList.remove('hidden');
    header.classList.add('hidden');
    sidebar.classList.add('hidden');
  }

  // Show dashboard, header, sidebar, and highlight sidebar link
  function showDashboard() {
    pages.forEach(p => p.classList.add('hidden'));
    dashboardSection.classList.remove('hidden');
    header.classList.remove('hidden');
    sidebar.classList.remove('hidden');
    highlightSidebarLink('dashboard');
  }

  // Highlight sidebar link by href id
  function highlightSidebarLink(id) {
    sidebarLinks.forEach(l => l.classList.remove('active'));
    const link = document.querySelector(`.sidebar__link[href="#${id}"]`);
    if (link) link.classList.add('active');
  }

  // Sidebar navigation click event
  sidebarLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      pages.forEach(p => p.classList.add('hidden'));
      const targetPage = document.getElementById(targetId);
      if (targetPage) targetPage.classList.remove('hidden');
      highlightSidebarLink(targetId);
    });
  });

  // Start on login page
  showLogin();

  // Login form submit validation and page switch
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    if (!email) {
      document.getElementById('emailError').textContent = 'Email required';
      return;
    }
    if (password.length < 6) {
      document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
      return;
    }
    showDashboard();
  });

  // Logout button handler
  logoutBtn.addEventListener('click', () => {
    showLogin();
  });

  // Open Add Device modal
  if (addDeviceBtn && addDeviceModal) {
    addDeviceBtn.addEventListener('click', () => {
      addDeviceModal.classList.remove('hidden');
    });
  }

  // Close modal with X button
  if (closeModalBtn && addDeviceModal) {
    closeModalBtn.addEventListener('click', () => {
      addDeviceModal.classList.add('hidden');
      addDeviceForm.reset();
    });
  }

  // Close modal on clicking outside modal content
  if (addDeviceModal) {
    addDeviceModal.addEventListener('click', e => {
      if (e.target === addDeviceModal) {
        addDeviceModal.classList.add('hidden');
        addDeviceForm.reset();
      }
    });
  }

  // Helper: Create device card HTML with MQTT toggle (for Lights)
  function createDeviceCard(name, type, description) {
    const card = document.createElement('div');
    card.classList.add('device-card');
    card.dataset.deviceName = name;

    let innerHTML = `
      <div class="device-type">${type}</div>
      <div class="device-name">${name}</div>
      ${description ? `<div class="device-description">${description}</div>` : ''}
    `;

    if (type.toLowerCase() === 'light') {
      innerHTML += `
        <button class="btn btn-primary toggle-led-btn">Turn ON</button>
        <div>Status: <span class="device-status">Unknown</span></div>
      `;
    }

    card.innerHTML = innerHTML;

    // Attach event listener to toggle button if it exists
    const toggleBtn = card.querySelector('.toggle-led-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentState = deviceStates[name] || 'OFF';
        const newState = currentState === 'ON' ? 'OFF' : 'ON';
        client.publish(`home/${name}/set`, newState);
      });
    }

    return card;
  }

  // Add device form submission
  if (addDeviceForm && deviceList) {
    addDeviceForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('deviceName').value.trim();
      const type = document.getElementById('deviceType').value;
      const description = document.getElementById('deviceDescription').value.trim();

      if (!name || !type) {
        alert('Please fill in device name and type.');
        return;
      }

      // Avoid duplicate device names
      if (deviceList.querySelector(`[data-device-name="${name}"]`)) {
        alert('Device name already exists.');
        return;
      }

      // Create and add device card
      const card = createDeviceCard(name, type, description);
      deviceList.appendChild(card);

      // Close modal and reset form
      addDeviceModal.classList.add('hidden');
      addDeviceForm.reset();

      // Subscribe to status topic for this device (if light)
      if (type.toLowerCase() === 'light') {
        client.subscribe(`home/${name}/status`, (err) => {
          if (!err) {
            console.log(`Subscribed to home/${name}/status`);
          }
        });
      }
    });
  }

  // MQTT client setup
  const client = mqtt.connect(brokerUrl, mqttOptions);

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    // Could subscribe to any global topics here
  });

  client.on('message', (topic, message) => {
    const msg = message.toString();
    // Expecting topic: home/{deviceName}/status
    const match = topic.match(/^home\/(.+)\/status$/);
    if (match) {
      const deviceName = match[1];
      deviceStates[deviceName] = msg;

      // Update device card status and button text
      const card = deviceList.querySelector(`[data-device-name="${deviceName}"]`);
      if (card) {
        const statusSpan = card.querySelector('.device-status');
        const toggleBtn = card.querySelector('.toggle-led-btn');
        if (statusSpan) statusSpan.textContent = msg;
        if (toggleBtn) toggleBtn.textContent = msg === 'ON' ? 'Turn OFF' : 'Turn ON';
      }
    }
  });

  client.on('error', err => {
    console.error('MQTT error:', err);
  });

  client.on('offline', () => {
    console.log('MQTT client offline');
  });

  client.on('reconnect', () => {
    console.log('MQTT client reconnecting...');
  });
});
