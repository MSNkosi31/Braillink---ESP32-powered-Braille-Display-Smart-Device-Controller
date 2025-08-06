// ======== Page Routing ========
const pages = document.querySelectorAll('.page');
const links = document.querySelectorAll('.sidebar__link');

function showPage(id) {
  pages.forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
}

// Always show dashboard first
document.addEventListener('DOMContentLoaded', () => {
  location.hash = '#dashboard';
  showPage('dashboard');
});
window.addEventListener('hashchange', () => showPage(location.hash.substring(1) || 'dashboard'));

// ======== Toast Notifications ========
function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => container.removeChild(toast), 3000);
}

// ======== Modal Handling ========
['deviceModal', 'routineModal', 'userModal'].forEach(modalId => {
  const modal = document.getElementById(modalId);
  modal.querySelector('.close').addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

document.getElementById('addDeviceBtn').addEventListener('click', () => document.getElementById('deviceModal').classList.remove('hidden'));
document.getElementById('addRoutineBtn').addEventListener('click', () => document.getElementById('routineModal').classList.remove('hidden'));
document.getElementById('addUserBtn').addEventListener('click', () => document.getElementById('userModal').classList.remove('hidden'));

// ======== Form Validation & Submission ========
function validateAndSubmit(formId, rules, onSuccess) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    // clear errors
    Object.keys(rules).forEach(fid => {
      const f = document.getElementById(fid);
      f.classList.remove('error');
      document.getElementById(fid + 'Error').textContent = '';
    });

    // validation
    Object.entries(rules).forEach(([fid, fn]) => {
      const val = document.getElementById(fid).value;
      const err = fn(val);
      if (err) {
        valid = false;
        const fld = document.getElementById(fid);
        fld.classList.add('error');
        document.getElementById(fid + 'Error').textContent = err;
      }
    });

    if (!valid) return;
    onSuccess();
    form.reset();
    const modal = form.closest('.modal');
    if (modal) modal.classList.add('hidden');
    showToast('Saved successfully');
  });
}

validateAndSubmit('loginForm', {
  email: v => /^\S+@\S+\.\S+$/.test(v) ? '' : 'Enter a valid email',
  password: v => v.length >= 6 ? '' : 'Min 6 chars'
}, () => {});

validateAndSubmit('passwordForm', {
  newPassword: v => v.length >= 6 ? '' : 'Min 6 chars',
  confirmPassword: v => v === document.getElementById('newPassword').value ? '' : 'Passwords mismatch'
}, () => showToast('Password changed'));

validateAndSubmit('deviceForm', {
  deviceName: v => v.trim() ? '' : 'Required',
  deviceType: v => v ? '' : 'Required',
  deviceLocation: v => v.trim() ? '' : 'Required'
}, () => {
  const card = document.createElement('div'); card.className = 'card'; card.textContent = document.getElementById('deviceName').value;
  document.getElementById('deviceList').appendChild(card);
});

validateAndSubmit('routineForm', {
  routineName: v => v.trim() ? '' : 'Required',
  routineDevice: v => v ? '' : 'Required',
  routineAction: v => v ? '' : 'Required',
  scheduleTime: v => v ? '' : 'Required'
}, () => {
  const li = document.createElement('li');
  li.textContent = `${document.getElementById('routineName').value} @ ${document.getElementById('scheduleTime').value}`;
  document.getElementById('routineList').appendChild(li);
});

validateAndSubmit('userForm', {
  userName: v => v.trim() ? '' : 'Required',
  userEmail: v => /^\S+@\S+\.\S+$/.test(v) ? '' : 'Enter valid email',
  userRole: v => v ? '' : 'Required'
}, () => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${document.getElementById('userName').value}</td>
    <td>${document.getElementById('userEmail').value}</td>
    <td>${document.getElementById('userRole').value}</td>
    <td>Edit | Delete</td>`;
  document.querySelector('#userTable tbody').appendChild(row);
  location.hash = '#dashboard';
});

