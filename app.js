// ==========================================
// SIM KURIKULUM MERDEKA PRO v2.0
// Support: SD, SMP, SMA, SMK, PAUD
// ==========================================

// Data State
let dataSiswa = JSON.parse(localStorage.getItem('sim_siswa')) || [];
let dataJadwal = JSON.parse(localStorage.getItem('sim_jadwal')) || [];
let dataNilai = JSON.parse(localStorage.getItem('sim_nilai')) || {};
let dataCPTP = JSON.parse(localStorage.getItem('sim_cptp')) || { cp: "", tps: [{bab:1, judul:"Materi Pertama", jp:4}] };
let customHolidays = JSON.parse(localStorage.getItem('sim_holidays')) || [];
let premiumUsers = JSON.parse(localStorage.getItem('sim_premium_users')) || [];
let dataMapel = JSON.parse(localStorage.getItem('sim_mapel')) || [];
let activeMapelId = localStorage.getItem('sim_active_mapel') || null;

// Admin Default
const DEFAULT_ADMIN = { email: "afifaro@gmail.com", password: "admin123" };
let adminSettings = JSON.parse(localStorage.getItem('sim_admin')) || DEFAULT_ADMIN;
let pricingSettings = JSON.parse(localStorage.getItem('sim_pricing')) || {
    whatsapp: "6281234567890", harga: 99000, hargaDesc: "Akses Selamanya / Lifetime",
    bank: "BCA", rekening: "1234567890", namaRek: "Admin SIM Kurikulum"
};

// Device ID
let deviceId = localStorage.getItem('sim_device_id');
if (!deviceId) {
    deviceId = 'DEV_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('sim_device_id', deviceId);
}

// Calendar State
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// National Holidays (Fixed)
const nationalHolidays = {
    "01-01": "Tahun Baru Masehi",
    "05-01": "Hari Buruh Internasional",
    "06-01": "Hari Lahir Pancasila",
    "08-17": "Hari Kemerdekaan RI",
    "12-25": "Hari Natal"
};

// ==========================================
// INITIALIZATION
// ==========================================
window.onload = function() {
    loadProfil();
    renderTabelSiswa();
    renderJadwal();
    renderCPTP();
    renderCalendar();
    renderMapelList();
    updateStats();
    checkPremiumStatus();
    loadPricingDisplay();
    document.getElementById('showDeviceId').textContent = deviceId;
    updateActiveMapelIndicator();
};

// ==========================================
// NAVIGATION
// ==========================================
window.showTab = function(tabId) {
    const premiumTabs = ['tabCPTP', 'tabSiswa', 'tabPerangkat', 'tabPelaksanaan', 'tabPenilaian'];
    
    if (premiumTabs.includes(tabId) && !isPremiumUser()) {
        showUpgradeModal();
        return;
    }
    
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.sidebar .nav-link').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.remove('d-none');
    
    if (event && event.target) {
        let navLink = event.target.closest('.nav-link');
        if (navLink) navLink.classList.add('active');
    }
    
    updateUIProfile();
    
    if(tabId === 'tabCPTP') renderCPTP();
    if(tabId === 'tabTahunan') populateFaseRombelOptions('tFaseRombel');
    if(tabId === 'tabPerangkat' || tabId === 'tabPelaksanaan') populateDropdowns();
    if(tabId === 'tabPenilaian') renderKelasPenilaian();
    if(tabId === 'tabKalender') renderCalendar();
    if(tabId === 'tabAdmin') loadAdminPanel();
    if(tabId === 'tabMapel') renderMapelList();
    
    // Close sidebar on mobile
    if (window.innerWidth < 992) {
        document.getElementById('sidebarMenu').classList.remove('show');
        document.getElementById('sidebarOverlay').classList.remove('show');
    }
};

window.toggleSidebar = function() {
    document.getElementById('sidebarMenu').classList.toggle('show');
    document.getElementById('sidebarOverlay').classList.toggle('show');
};

// ==========================================
// MAPEL MANAGEMENT (NEW)
// ==========================================
window.showAddMapelModal = function() {
    const modal = new bootstrap.Modal(document.getElementById('addMapelModal'));
    modal.show();
};

window.simpanMapelBaru = function() {
    const jenjang = document.getElementById('newMapelJenjang').value;
    const nama = document.getElementById('newMapelNama').value.trim();
    const kelas = document.getElementById('newMapelKelas').value.trim();
    const fase = document.getElementById('newMapelFase').value;
    
    if (!nama) {
        showToast('Nama mata pelajaran wajib diisi!', 'warning');
        return;
    }
    
    const newMapel = {
        id: 'MAPEL_' + Date.now(),
        jenjang: jenjang,
        nama: nama,
        kelas: kelas,
        fase: fase,
        createdAt: new Date().toISOString()
    };
    
    dataMapel.push(newMapel);
    localStorage.setItem('sim_mapel', JSON.stringify(dataMapel));
    
    // Set as active if first mapel
    if (dataMapel.length === 1) {
        setActiveMapel(newMapel.id);
    }
    
    // Reset form
    document.getElementById('newMapelNama').value = '';
    document.getElementById('newMapelKelas').value = '';
    
    bootstrap.Modal.getInstance(document.getElementById('addMapelModal')).hide();
    renderMapelList();
    updateStats();
    showToast('Mata pelajaran berhasil ditambahkan!', 'success');
};

window.setActiveMapel = function(mapelId) {
    activeMapelId = mapelId;
    localStorage.setItem('sim_active_mapel', mapelId);
    renderMapelList();
    updateActiveMapelIndicator();
    showToast('Mata pelajaran aktif diubah!', 'success');
};

window.hapusMapel = function(mapelId) {
    if (!confirm('Hapus mata pelajaran ini?')) return;
    
    dataMapel = dataMapel.filter(m => m.id !== mapelId);
    localStorage.setItem('sim_mapel', JSON.stringify(dataMapel));
    
    if (activeMapelId === mapelId) {
        activeMapelId = dataMapel.length > 0 ? dataMapel[0].id : null;
        localStorage.setItem('sim_active_mapel', activeMapelId);
    }
    
    renderMapelList();
    updateActiveMapelIndicator();
    updateStats();
    showToast('Mata pelajaran dihapus!', 'info');
};

window.filterMapelByJenjang = function(jenjang) {
    document.querySelectorAll('#tabMapel .btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(jenjang) || (jenjang === 'ALL' && btn.textContent === 'Semua')) {
            btn.classList.add('active');
        }
    });
    renderMapelList(jenjang);
};

function renderMapelList(filterJenjang = 'ALL') {
    const container = document.getElementById('mapelList');
    let filtered = filterJenjang === 'ALL' ? dataMapel : dataMapel.filter(m => m.jenjang === filterJenjang);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="fas fa-book fa-4x mb-3 opacity-25"></i>
                <p>Belum ada mata pelajaran${filterJenjang !== 'ALL' ? ' untuk jenjang ini' : ''}.</p>
                <button class="btn btn-gradient-primary" onclick="showAddMapelModal()">
                    <i class="fas fa-plus me-2"></i>Tambah Mapel
                </button>
            </div>`;
        return;
    }
    
    let html = '';
    filtered.forEach(m => {
        const isActive = m.id === activeMapelId;
        const jenjangClass = `jenjang-${m.jenjang.toLowerCase()}`;
        html += `
            <div class="col-md-4 col-sm-6">
                <div class="mapel-card ${isActive ? 'active' : ''}" onclick="setActiveMapel('${m.id}')">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="jenjang-badge ${jenjangClass}">${m.jenjang}</span>
                        ${isActive ? '<span class="badge bg-primary"><i class="fas fa-check"></i> Aktif</span>' : ''}
                    </div>
                    <h6 class="fw-bold mb-1">${m.nama}</h6>
                    <small class="text-muted">Kelas ${m.kelas} • Fase ${m.fase}</small>
                    <div class="mt-3 d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="event.stopPropagation(); setActiveMapel('${m.id}')">
                            <i class="fas fa-check-circle"></i> Pilih
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); hapusMapel('${m.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

function updateActiveMapelIndicator() {
    const indicator = document.getElementById('activeMapelIndicator');
    const nameEl = document.getElementById('activeMapelName');
    
    if (activeMapelId && dataMapel.length > 0) {
        const mapel = dataMapel.find(m => m.id === activeMapelId);
        if (mapel) {
            nameEl.textContent = `${mapel.nama} - ${mapel.jenjang} Kelas ${mapel.kelas}`;
            indicator.style.display = 'block';
            return;
        }
    }
    indicator.style.display = 'none';
}

function getActiveMapelName() {
    if (activeMapelId) {
        const mapel = dataMapel.find(m => m.id === activeMapelId);
        if (mapel) return mapel.nama;
    }
    return localStorage.getItem('sim_prof') ? JSON.parse(localStorage.getItem('sim_prof')).mapel || 'Mata Pelajaran' : 'Mata Pelajaran';
}

// ==========================================
// PREMIUM SYSTEM
// ==========================================
function isPremiumUser() {
    return premiumUsers.includes(deviceId);
}

function checkPremiumStatus() {
    const badge = document.getElementById('userStatusBadge');
    const banner = document.getElementById('upgradeBanner');
    
    if (isPremiumUser()) {
        badge.className = 'badge';
        badge.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        badge.innerHTML = '<i class="fas fa-crown me-1"></i>Pro';
        if (banner) banner.style.display = 'none';
    } else {
        badge.className = 'badge bg-secondary';
        badge.innerHTML = 'Free';
        if (banner) banner.style.display = 'flex';
    }
}

window.showUpgradeModal = function() {
    loadPricingDisplay();
    const modal = new bootstrap.Modal(document.getElementById('upgradeModal'));
    modal.show();
};

function loadPricingDisplay() {
    document.getElementById('displayPrice').textContent = 'Rp ' + Number(pricingSettings.harga).toLocaleString('id-ID');
    document.getElementById('displayPriceDesc').textContent = pricingSettings.hargaDesc;
    document.getElementById('displayBank').textContent = pricingSettings.bank;
    document.getElementById('displayRekening').textContent = pricingSettings.rekening;
    document.getElementById('displayNamaRek').textContent = pricingSettings.namaRek;
    
    const waBtn = document.getElementById('waUpgradeBtn');
    const msg = encodeURIComponent(`Halo, saya ingin upgrade SIM Kurikulum Pro.\n\nDevice ID: ${deviceId}\n\nMohon informasi. Terima kasih!`);
    waBtn.href = `https://wa.me/${pricingSettings.whatsapp}?text=${msg}`;
}

window.checkPremiumAndPrint = function(docId, name, orientation) {
    if (!isPremiumUser()) {
        showUpgradeModal();
        return;
    }
    triggerPrint(docId, name, orientation);
};

// ==========================================
// ADMIN PANEL
// ==========================================
window.showAdminLogin = function() {
    const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    modal.show();
};

window.loginAdmin = function() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (email === adminSettings.email && password === adminSettings.password) {
        localStorage.setItem('sim_admin_logged', 'true');
        bootstrap.Modal.getInstance(document.getElementById('adminLoginModal')).hide();
        showTab('tabAdmin');
        showToast('Login berhasil!', 'success');
    } else {
        showToast('Email atau password salah!', 'danger');
    }
};

window.logoutAdmin = function() {
    localStorage.removeItem('sim_admin_logged');
    showTab('tabDashboard');
    showToast('Logout berhasil!', 'info');
};

function loadAdminPanel() {
    if (localStorage.getItem('sim_admin_logged') !== 'true') {
        showAdminLogin();
        return;
    }
    
    document.getElementById('adminEmailSetting').value = adminSettings.email;
    document.getElementById('settingWA').value = pricingSettings.whatsapp;
    document.getElementById('settingHarga').value = pricingSettings.harga;
    document.getElementById('settingHargaDesc').value = pricingSettings.hargaDesc;
    document.getElementById('settingBank').value = pricingSettings.bank;
    document.getElementById('settingRekening').value = pricingSettings.rekening;
    document.getElementById('settingNamaRek').value = pricingSettings.namaRek;
    
    renderPremiumUsers();
}

window.simpanAdminSettings = function() {
    adminSettings.email = document.getElementById('adminEmailSetting').value;
    const newPwd = document.getElementById('adminPasswordSetting').value;
    if (newPwd.trim()) adminSettings.password = newPwd;
    localStorage.setItem('sim_admin', JSON.stringify(adminSettings));
    showToast('Pengaturan admin tersimpan!', 'success');
};

window.simpanPricingSettings = function() {
    pricingSettings.whatsapp = document.getElementById('settingWA').value;
    pricingSettings.harga = document.getElementById('settingHarga').value;
    pricingSettings.hargaDesc = document.getElementById('settingHargaDesc').value;
    pricingSettings.bank = document.getElementById('settingBank').value;
    pricingSettings.rekening = document.getElementById('settingRekening').value;
    pricingSettings.namaRek = document.getElementById('settingNamaRek').value;
    localStorage.setItem('sim_pricing', JSON.stringify(pricingSettings));
    showToast('Pengaturan tersimpan!', 'success');
};

window.addPremiumUser = function() {
    const userId = document.getElementById('newPremiumUser').value.trim();
    if (!userId) return showToast('Masukkan User ID!', 'warning');
    if (!premiumUsers.includes(userId)) {
        premiumUsers.push(userId);
        localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
        document.getElementById('newPremiumUser').value = '';
        renderPremiumUsers();
        checkPremiumStatus();
        showToast('User premium ditambahkan!', 'success');
    } else {
        showToast('User sudah ada!', 'warning');
    }
};

window.activateCurrentDevice = function() {
    if (!premiumUsers.includes(deviceId)) {
        premiumUsers.push(deviceId);
        localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
        renderPremiumUsers();
        checkPremiumStatus();
        showToast('Device ini sekarang Premium!', 'success');
    } else {
        showToast('Device ini sudah Premium!', 'info');
    }
};

window.removePremiumUser = function(userId) {
    if (confirm('Hapus user premium ini?')) {
        premiumUsers = premiumUsers.filter(u => u !== userId);
        localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
        renderPremiumUsers();
        checkPremiumStatus();
    }
};

function renderPremiumUsers() {
    const tbody = document.getElementById('premiumUsersList');
    if (premiumUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada</td></tr>';
        return;
    }
    let html = '';
    premiumUsers.forEach((user, i) => {
        const isCurrent = user === deviceId ? ' <span class="badge bg-success">Ini</span>' : '';
        html += `<tr>
            <td>${i+1}</td>
            <td><small>${user}${isCurrent}</small></td>
            <td><small>${new Date().toLocaleDateString('id-ID')}</small></td>
            <td><button class="btn btn-sm btn-danger py-0 px-2" onclick="removePremiumUser('${user}')"><i class="fas fa-times"></i></button></td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ==========================================
// CALENDAR SYSTEM
// ==========================================
function renderCalendar() {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    document.getElementById('calendarTitle').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    const grid = document.getElementById('calendarGrid');
    // Keep headers, remove days
    let headerHtml = '';
    ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].forEach(d => {
        headerHtml += `<div class="calendar-day-header">${d}</div>`;
    });
    
    let daysHtml = '';
    for (let i = 0; i < firstDay; i++) {
        daysHtml += '<div class="calendar-day" style="opacity: 0.2;"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const fullDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        let classes = 'calendar-day';
        let holidayName = '';
        
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            classes += ' today';
        }
        
        if (nationalHolidays[dateStr]) {
            classes += ' holiday';
            holidayName = nationalHolidays[dateStr];
        }
        
        const customHoliday = customHolidays.find(h => h.date === fullDateStr);
        if (customHoliday) {
            classes += ' holiday-custom';
            holidayName = customHoliday.name;
        }
        
        daysHtml += `<div class="${classes}" onclick="showHolidayInfo('${fullDateStr}', '${holidayName}')" title="${holidayName}">
            ${day}${holidayName ? '<div class="holiday-dot"></div>' : ''}
        </div>`;
    }
    
    grid.innerHTML = headerHtml + daysHtml;
    renderHolidayList();
}

window.changeMonth = function(delta) {
    currentMonth += delta;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
};

window.showHolidayInfo = function(date, name) {
    if (name) showToast(`${date}: ${name}`, 'info');
};

window.addCustomHoliday = function() {
    const date = document.getElementById('customHolidayDate').value;
    const name = document.getElementById('customHolidayName').value.trim();
    if (!date || !name) return showToast('Lengkapi tanggal dan nama!', 'warning');
    if (!customHolidays.find(h => h.date === date)) {
        customHolidays.push({ date, name });
        localStorage.setItem('sim_holidays', JSON.stringify(customHolidays));
        document.getElementById('customHolidayDate').value = '';
        document.getElementById('customHolidayName').value = '';
        renderCalendar();
        showToast('Hari libur ditambahkan!', 'success');
    } else {
        showToast('Tanggal sudah ada!', 'warning');
    }
};

window.removeCustomHoliday = function(date) {
    customHolidays = customHolidays.filter(h => h.date !== date);
    localStorage.setItem('sim_holidays', JSON.stringify(customHolidays));
    renderCalendar();
};

function renderHolidayList() {
    const container = document.getElementById('holidayList');
    let html = '<h6 class="fw-bold mb-2 text-danger small"><i class="fas fa-flag me-2"></i>Libur Nasional</h6>';
    for (const [date, name] of Object.entries(nationalHolidays)) {
        html += `<div class="d-flex justify-content-between mb-1 small p-2 bg-light rounded"><span>${name}</span><small class="text-muted">${date}</small></div>`;
    }
    html += '<hr><h6 class="fw-bold mb-2 text-success small"><i class="fas fa-star me-2"></i>Libur Kustom</h6>';
    if (customHolidays.length === 0) {
        html += '<p class="text-muted small">Belum ada</p>';
    } else {
        customHolidays.forEach(h => {
            html += `<div class="d-flex justify-content-between align-items-center mb-1 small p-2 bg-light rounded">
                <span>${h.name}<br><small class="text-muted">${h.date}</small></span>
                <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="removeCustomHoliday('${h.date}')"><i class="fas fa-times"></i></button>
            </div>`;
        });
    }
    container.innerHTML = html;
}

// ==========================================
// STATISTICS
// ==========================================
function updateStats() {
    document.getElementById('statMapel').textContent = dataMapel.length;
    document.getElementById('statSiswa').textContent = dataSiswa.length;
    document.getElementById('statJadwal').textContent = dataJadwal.length;
    document.getElementById('statTP').textContent = dataCPTP.tps.length;
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================
window.simpanProfil = function() {
    const p = {
        jenjang: document.getElementById('profJenjang').value,
        npsn: document.getElementById('profNpsn').value,
        sek: document.getElementById('profSekolah').value,
        alamat: document.getElementById('profAlamat').value,
        thn: document.getElementById('profTahun').value,
        kep: document.getElementById('profKepsek').value,
        nkep: document.getElementById('profNipKepsek').value,
        gur: document.getElementById('profGuru').value,
        ngur: document.getElementById('profNipGuru').value,
        tgl: document.getElementById('profTanggal').value
    };
    localStorage.setItem('sim_prof', JSON.stringify(p));
    showToast('Profil tersimpan!', 'success');
    updateUIProfile();
};

function loadProfil() {
    const p = JSON.parse(localStorage.getItem('sim_prof'));
    if(p) {
        if(document.getElementById('profJenjang')) document.getElementById('profJenjang').value = p.jenjang || 'SD';
        document.getElementById('profNpsn').value = p.npsn || '';
        document.getElementById('profSekolah').value = p.sek || '';
        if(document.getElementById('profAlamat')) document.getElementById('profAlamat').value = p.alamat || '';
        document.getElementById('profTahun').value = p.thn || '';
        document.getElementById('profKepsek').value = p.kep || '';
        document.getElementById('profNipKepsek').value = p.nkep || '';
        document.getElementById('profGuru').value = p.gur || '';
        document.getElementById('profNipGuru').value = p.ngur || '';
        document.getElementById('profTanggal').value = p.tgl || '';
    }
    updateUIProfile();
}

function updateUIProfile() {
    const p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    const mapelName = getActiveMapelName();
    document.querySelectorAll('.vMapel').forEach(e => e.innerText = mapelName);
    document.querySelectorAll('.vSekolah').forEach(e => e.innerText = p.sek || '...');
    document.querySelectorAll('.vTahun').forEach(e => e.innerText = p.thn || '...');
    document.querySelectorAll('.vKepsek').forEach(e => e.innerText = p.kep || '...');
    document.querySelectorAll('.vNipKepsek').forEach(e => e.innerText = p.nkep || '...');
    document.querySelectorAll('.vGuru').forEach(e => e.innerText = p.gur || '...');
    document.querySelectorAll('.vNipGuru').forEach(e => e.innerText = p.ngur || '...');
    document.querySelectorAll('.vTanggal').forEach(e => e.innerText = p.tgl || '...');
}

// ==========================================
// CP & TP MANAGEMENT
// ==========================================
function renderCPTP() {
    document.getElementById('inputCP').value = dataCPTP.cp;
    let html = '';
    dataCPTP.tps.forEach((tp, idx) => {
        html += `<tr>
            <td><input type="number" class="form-control form-control-sm tp-bab" value="${tp.bab}"></td>
            <td><input type="text" class="form-control form-control-sm tp-judul" value="${tp.judul}"></td>
            <td><input type="number" class="form-control form-control-sm tp-jp" value="${tp.jp}"></td>
            <td><button class="btn btn-sm btn-outline-danger" onclick="hapusTP(${idx})"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    });
    document.getElementById('bodyInputTP').innerHTML = html;
}

window.tambahBarisTP = function() {
    dataCPTP.tps.push({ bab: dataCPTP.tps.length + 1, judul: "", jp: 4 });
    renderCPTP();
};

window.hapusTP = function(idx) {
    dataCPTP.tps.splice(idx, 1);
    renderCPTP();
};

window.simpanCPTP = function() {
    dataCPTP.cp = document.getElementById('inputCP').value;
    dataCPTP.tps = [];
    const babs = document.querySelectorAll('.tp-bab');
    const juduls = document.querySelectorAll('.tp-judul');
    const jps = document.querySelectorAll('.tp-jp');
    for(let i = 0; i < babs.length; i++) {
        if(juduls[i].value.trim()) {
            dataCPTP.tps.push({ bab: babs[i].value, judul: juduls[i].value, jp: jps[i].value });
        }
    }
    localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
    updateStats();
    showToast('CP & TP tersimpan!', 'success');
};

window.loadDefaultPAI = function() {
    if(typeof dbKurikulumPAI === 'undefined') return showToast('File data_default.js tidak ditemukan!', 'danger');
    const kls = document.getElementById('loadDefaultKls').value;
    const data = dbKurikulumPAI[kls];
    if(data) {
        dataCPTP.cp = data.cp;
        dataCPTP.tps = data.tps;
        localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
        renderCPTP();
        updateStats();
        showToast(`Data PAI Kelas ${kls} dimuat!`, 'success');
    }
};

// ==========================================
// STUDENT DATA
// ==========================================
function processCsvData(d) {
    let count = 0;
    d.forEach(s => {
        let nisn = s.nisn || s.NISN, nama = s.nama || s.Nama, jk = s.jk || s.JK, kelas = s.kelas || s.Kelas, rombel = s.rombel || s.Rombel;
        if(nama && kelas && rombel) {
            dataSiswa.push({ nisn: nisn || '-', nama, jk: jk || '-', kelas, rombel });
            count++;
        }
    });
    localStorage.setItem('sim_siswa', JSON.stringify(dataSiswa));
    renderTabelSiswa();
    updateStats();
    showToast(`${count} siswa diimport!`, 'success');
}

window.importSiswaLokal = function() {
    const file = document.getElementById('fileCsvSiswa').files[0];
    if(!file) return showToast('Pilih file CSV!', 'warning');
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => processCsvData(r.data) });
};

window.clearDataSiswa = function() {
    if(confirm("Hapus semua data siswa?")) {
        dataSiswa = [];
        localStorage.removeItem('sim_siswa');
        renderTabelSiswa();
        updateStats();
    }
};

window.renderTabelSiswa = function() {
    const filter = document.getElementById('filterKelasSiswa').value;
    let opts = '<option value="ALL">-- Semua Rombel --</option>';
    new Set(dataSiswa.map(s => s.rombel)).forEach(r => opts += `<option value="${r}" ${filter===r?'selected':''}>${r}</option>`);
    document.getElementById('filterKelasSiswa').innerHTML = opts;
    
    let html = '';
    const filtered = filter === "ALL" ? dataSiswa : dataSiswa.filter(s => s.rombel === filter);
    filtered.forEach(s => html += `<tr><td>${s.nisn}</td><td>${s.nama}</td><td>${s.jk}</td><td>${s.kelas}</td><td>${s.rombel}</td></tr>`);
    document.getElementById('tabelSiswaBody').innerHTML = html || '<tr><td colspan="5" class="text-center py-4">Belum ada data</td></tr>';
};

// ==========================================
// SCHEDULE
// ==========================================
window.tambahJadwalLokal = function() {
    const hari = document.getElementById('jadwalHari').value;
    const jam = document.getElementById('jadwalJam').value;
    const fase = document.getElementById('jadwalFase').value;
    const rombel = document.getElementById('jadwalRombel').value;
    if(!jam || !rombel) return showToast('Jam & Rombel wajib diisi!', 'warning');
    dataJadwal.push({ hari, jam, fase, rombel });
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
    renderJadwal();
    updateStats();
    showToast('Jadwal ditambahkan!', 'success');
    document.getElementById('jadwalJam').value = '';
    document.getElementById('jadwalRombel').value = '';
};

window.hapusJadwal = function(idx) {
    dataJadwal.splice(idx, 1);
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
    renderJadwal();
    updateStats();
};

function renderJadwal() {
    let html = '';
    if (dataJadwal.length === 0) {
        html = '<tr><td colspan="5" class="text-center py-4">Belum ada jadwal</td></tr>';
    } else {
        dataJadwal.forEach((d, i) => {
            html += `<tr>
                <td>${d.hari}</td>
                <td>Jam Ke-${d.jam}</td>
                <td><span class="badge bg-primary">Fase ${d.fase}</span></td>
                <td>${d.rombel}</td>
                <td><button class="btn btn-sm btn-danger py-0 px-2" onclick="hapusJadwal(${i})"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
    }
    document.getElementById('tabelJadwalBody').innerHTML = html;
}

// ==========================================
// DROPDOWNS
// ==========================================
function populateDropdowns() {
    let oj = '<option value="">-- Pilih Jadwal --</option>';
    dataJadwal.forEach(d => oj += `<option value='${JSON.stringify(d)}'>${d.hari} Jam ${d.jam} - ${d.rombel}</option>`);
    document.querySelectorAll('#pSelectJadwal, #selectJadwalAbsen').forEach(el => el.innerHTML = oj);
    
    let ot = '<option value="">-- Pilih Materi --</option>';
    dataCPTP.tps.forEach(t => ot += `<option value='${t.judul}'>Bab ${t.bab}: ${t.judul}</option>`);
    document.querySelectorAll('#pSelectTP, #selectTPAbsen').forEach(el => el.innerHTML = ot);
}

function populateFaseRombelOptions(elementId) {
    let set = new Set(dataJadwal.map(d => `Fase ${d.fase} - ${d.rombel}`));
    let o = '';
    set.forEach(fr => o += `<option value="${fr}">${fr}</option>`);
    document.getElementById(elementId).innerHTML = o || '<option>Buat Jadwal Dulu</option>';
}

// ==========================================
// DOCUMENT GENERATORS
// ==========================================
window.generateTahunan = function() {
    const fr = document.getElementById('tFaseRombel').value;
    const p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    const mapel = getActiveMapelName();
    
    // ATP Document
    let atpHtml = `
        <div class="doc-header">ALUR TUJUAN PEMBELAJARAN (ATP)<br>KURIKULUM MERDEKA</div>
        <table style="width:100%; margin-bottom:15px; font-size:11pt;">
            <tr><td width="15%">Sekolah</td><td width="2%">:</td><td>${p.sek||'...'}</td><td width="15%">Mata Pelajaran</td><td width="2%">:</td><td><b>${mapel}</b></td></tr>
            <tr><td>Fase/Rombel</td><td>:</td><td>${fr}</td><td>Tahun Ajaran</td><td>:</td><td>${p.thn||'...'}</td></tr>
        </table>
        <p><b>Capaian Pembelajaran:</b><br>${dataCPTP.cp}</p>
        <table class="doc-table">
            <thead><tr><th width="8%">Bab</th><th>Alur Tujuan Pembelajaran</th><th width="12%">JP</th></tr></thead>
            <tbody>`;
    let totalJP = 0;
    dataCPTP.tps.forEach(t => {
        totalJP += parseInt(t.jp);
        atpHtml += `<tr><td style="text-align:center;">${t.bab}</td><td>Peserta didik mampu memahami: ${t.judul}</td><td style="text-align:center;">${t.jp}</td></tr>`;
    });
    atpHtml += `<tr style="font-weight:bold;"><td colspan="2" style="text-align:right;">Total:</td><td style="text-align:center;">${totalJP} JP</td></tr>
        </tbody></table>
        <div style="display:flex; justify-content:space-between; margin-top:40px;">
            <div style="width:45%; text-align:center;">Mengetahui,<br>Kepala Sekolah<br><br><br><br><u><b>${p.kep||'...'}</b></u><br>NIP. ${p.nkep||'...'}</div>
            <div style="width:45%; text-align:center;">${p.tgl||'...'}<br>Guru ${mapel}<br><br><br><br><u><b>${p.gur||'...'}</b></u><br>NIP. ${p.ngur||'...'}</div>
        </div>`;
    document.getElementById('docATP').innerHTML = atpHtml;
    
    // PROTA Document
    let protaHtml = `
        <div class="doc-header">PROGRAM TAHUNAN (PROTA)<br>KURIKULUM MERDEKA</div>
        <table style="width:100%; margin-bottom:15px; font-size:11pt;">
            <tr><td width="15%">Mata Pelajaran</td><td width="2%">:</td><td><b>${mapel}</b></td><td width="15%">Fase/Rombel</td><td width="2%">:</td><td>${fr}</td></tr>
            <tr><td>Tahun Ajaran</td><td>:</td><td>${p.thn||'...'}</td><td>Sekolah</td><td>:</td><td>${p.sek||'...'}</td></tr>
        </table>
        <table class="doc-table">
            <thead><tr><th width="12%">Semester</th><th>Bab / Tujuan Pembelajaran</th><th width="10%">JP</th><th width="18%">Keterangan</th></tr></thead>
            <tbody>`;
    dataCPTP.tps.forEach((t, idx) => {
        const sem = idx < Math.ceil(dataCPTP.tps.length / 2) ? 'Ganjil' : 'Genap';
        protaHtml += `<tr><td style="text-align:center;">${sem}</td><td>Bab ${t.bab} - ${t.judul}</td><td style="text-align:center;">${t.jp}</td><td>Sesuai Kalender</td></tr>`;
    });
    protaHtml += `</tbody></table>
        <div style="display:flex; justify-content:space-between; margin-top:40px;">
            <div style="width:45%; text-align:center;">Mengetahui,<br>Kepala Sekolah<br><br><br><br><u><b>${p.kep||'...'}</b></u><br>NIP. ${p.nkep||'...'}</div>
            <div style="width:45%; text-align:center;">${p.tgl||'...'}<br>Guru ${mapel}<br><br><br><br><u><b>${p.gur||'...'}</b></u><br>NIP. ${p.ngur||'...'}</div>
        </div>`;
    document.getElementById('docProta').innerHTML = protaHtml;
    
    // PROMES Document
    let promesHtml = `
        <div class="doc-header">PROGRAM SEMESTER (PROMES)<br>KURIKULUM MERDEKA</div>
        <table style="width:100%; margin-bottom:10px; font-size:10pt;">
            <tr>
                <td>Sekolah: <b>${p.sek||'...'}</b></td>
                <td>Mapel: <b>${mapel}</b></td>
                <td>Fase: <b>${fr}</b></td>
                <td>TA: <b>${p.thn||'...'}</b></td>
            </tr>
        </table>
        <table class="doc-table" style="font-size:8pt;">
            <thead>
                <tr>
                    <th rowspan="2" width="22%">Tujuan Pembelajaran</th>
                    <th rowspan="2" width="5%">JP</th>
                    <th colspan="4">Juli</th>
                    <th colspan="4">Agustus</th>
                    <th colspan="4">September</th>
                    <th colspan="4">Oktober</th>
                    <th colspan="4">November</th>
                    <th colspan="4">Desember</th>
                </tr>
                <tr>
                    <th>1</th><th>2</th><th>3</th><th>4</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th>
                    <th>1</th><th>2</th><th>3</th><th>4</th>
                </tr>
            </thead>
            <tbody>`;
    
    let weekCounter = 0;
    dataCPTP.tps.forEach(t => {
        const weeksNeeded = Math.ceil(parseInt(t.jp) / 2);
        let weekCells = '';
        for (let w = 0; w < 24; w++) {
            if (w >= weekCounter && w < weekCounter + weeksNeeded) {
                weekCells += `<td style="text-align:center; background:#d4edda;">✓</td>`;
            } else {
                weekCells += `<td></td>`;
            }
        }
        weekCounter += weeksNeeded;
        promesHtml += `<tr><td style="text-align:left; font-size:8pt;">Bab ${t.bab}: ${t.judul}</td><td style="text-align:center;">${t.jp}</td>${weekCells}</tr>`;
    });
    
    promesHtml += `</tbody></table>
        <div style="display:flex; justify-content:space-between; margin-top:30px; font-size:10pt;">
            <div style="width:45%; text-align:center;">Kepala Sekolah<br><br><br><br><u><b>${p.kep||'...'}</b></u></div>
            <div style="width:45%; text-align:center;">Guru ${mapel}<br><br><br><br><u><b>${p.gur||'...'}</b></u></div>
        </div>`;
    document.getElementById('docPromes').innerHTML = promesHtml;
    
    showToast('Dokumen berhasil di-generate! Klik Cetak.', 'success');
};

// ==========================================
// MODUL GENERATOR
// ==========================================
window.generateModul = function() {
    const jadwalVal = document.getElementById('pSelectJadwal').value;
    const tp = document.getElementById('pSelectTP').value;
    
    if(!jadwalVal || !tp) return showToast('Pilih Jadwal & Materi!', 'warning');
    
    const jadwal = JSON.parse(jadwalVal);
    const p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    const mapel = getActiveMapelName();
    const faseRombel = `Fase ${jadwal.fase} / ${jadwal.rombel}`;
    
    let modulHtml = `
        <div class="doc-header">MODUL AJAR<br>KURIKULUM MERDEKA</div>
        
        <p style="margin-bottom:5px;"><b>A. INFORMASI UMUM</b></p>
        <table style="width:100%; margin-bottom:15px; font-size:11pt;">
            <tr><td width="15%">Penyusun</td><td width="2%">:</td><td><b>${p.gur||'...'}</b></td><td width="15%">Instansi</td><td width="2%">:</td><td>${p.sek||'...'}</td></tr>
            <tr><td>Mata Pelajaran</td><td>:</td><td>${mapel}</td><td>Fase / Rombel</td><td>:</td><td>${faseRombel}</td></tr>
            <tr><td>Alokasi Waktu</td><td>:</td><td>2 x 35 Menit</td><td>Hari/Tanggal</td><td>:</td><td>${jadwal.hari}, ........................</td></tr>
        </table>
        
        <p style="margin-bottom:5px;"><b>B. CAPAIAN & TUJUAN PEMBELAJARAN</b></p>
        <p style="text-align:justify; margin-bottom:15px;">
            <b>Capaian Pembelajaran:</b> ${dataCPTP.cp || '...'}<br><br>
            <b>Tujuan Pembelajaran:</b> Peserta didik mampu memahami dan menerapkan materi tentang <b>"${tp}"</b> dengan baik.
        </p>
        
        <p style="margin-bottom:5px;"><b>C. PROFIL PELAJAR PANCASILA</b></p>
        <p style="margin-bottom:15px;">Beriman dan Bertakwa kepada Tuhan YME, Berkebinekaan Global, Bergotong Royong, Mandiri, Bernalar Kritis, dan Kreatif.</p>
        
        <p style="margin-bottom:5px;"><b>D. SARANA & PRASARANA</b></p>
        <p style="margin-bottom:15px;">Buku Paket, LKPD, Papan Tulis, Spidol, Media Pembelajaran, LCD Proyektor (jika tersedia).</p>
        
        <p style="margin-bottom:5px;"><b>E. KEGIATAN PEMBELAJARAN</b></p>
        <table class="doc-table" style="margin-bottom:15px;">
            <tr><th width="18%">Tahap</th><th>Deskripsi Kegiatan</th></tr>
            <tr>
                <td style="text-align:center;"><b>Pendahuluan</b><br>(10 Menit)</td>
                <td>
                    <ol style="margin:0; padding-left:20px;">
                        <li>Guru membuka pelajaran dengan salam dan berdoa bersama <i>(Beriman, Bertakwa kepada Tuhan YME)</i></li>
                        <li>Guru mengecek kehadiran siswa dan kesiapan belajar</li>
                        <li>Guru melakukan apersepsi dengan mengaitkan materi sebelumnya</li>
                        <li>Guru menyampaikan tujuan pembelajaran dan motivasi</li>
                    </ol>
                </td>
            </tr>
            <tr>
                <td style="text-align:center;"><b>Inti</b><br>(50 Menit)</td>
                <td>
                    <ol style="margin:0; padding-left:20px;">
                        <li>Guru menjelaskan materi tentang <b>"${tp}"</b> secara sistematis</li>
                        <li>Peserta didik mengamati dan mencatat poin-poin penting <i>(Mandiri)</i></li>
                        <li>Peserta didik berdiskusi dalam kelompok kecil <i>(Gotong Royong, Berkebinekaan Global)</i></li>
                        <li>Peserta didik mengerjakan LKPD / latihan soal <i>(Bernalar Kritis, Kreatif)</i></li>
                        <li>Perwakilan kelompok mempresentasikan hasil diskusi</li>
                        <li>Guru memberikan umpan balik dan penguatan</li>
                    </ol>
                </td>
            </tr>
            <tr>
                <td style="text-align:center;"><b>Penutup</b><br>(10 Menit)</td>
                <td>
                    <ol style="margin:0; padding-left:20px;">
                        <li>Guru dan peserta didik menyimpulkan pembelajaran bersama</li>
                        <li>Guru memberikan refleksi dan tindak lanjut (PR/tugas)</li>
                        <li>Guru menyampaikan rencana pembelajaran pertemuan berikutnya</li>
                        <li>Doa penutup dan salam</li>
                    </ol>
                </td>
            </tr>
        </table>
        
        <p style="margin-bottom:5px;"><b>F. ASESMEN / PENILAIAN</b></p>
        <table class="doc-table" style="margin-bottom:15px;">
            <tr><th width="25%">Jenis Asesmen</th><th>Teknik</th><th width="30%">Instrumen</th></tr>
            <tr><td>Asesmen Diagnostik</td><td>Tanya jawab awal pembelajaran</td><td>Pertanyaan lisan</td></tr>
            <tr><td>Asesmen Formatif</td><td>Observasi aktivitas & LKPD</td><td>Lembar observasi, LKPD</td></tr>
            <tr><td>Asesmen Sumatif</td><td>Tes tertulis / Portofolio</td><td>Soal tes, rubrik penilaian</td></tr>
        </table>
        
        <p style="margin-bottom:5px;"><b>G. PENGAYAAN & REMEDIAL</b></p>
        <p style="margin-bottom:15px;">
            <b>Pengayaan:</b> Peserta didik yang sudah tuntas diberikan soal/tugas pengembangan.<br>
            <b>Remedial:</b> Peserta didik yang belum tuntas diberikan bimbingan dan ujian ulang.
        </p>
        
        <div style="display:flex; justify-content:space-between; margin-top:40px; page-break-inside:avoid;">
            <div style="width:45%; text-align:center;">
                Mengetahui,<br>Kepala Sekolah<br><br><br><br>
                <u><b>${p.kep||'...'}</b></u><br>NIP. ${p.nkep||'...'}
            </div>
            <div style="width:45%; text-align:center;">
                ${p.tgl||'...'}<br>Guru ${mapel}<br><br><br><br>
                <u><b>${p.gur||'...'}</b></u><br>NIP. ${p.ngur||'...'}
            </div>
        </div>`;
    
    document.getElementById('docModul').innerHTML = modulHtml;
    showToast('Modul berhasil dibuat! Klik Cetak.', 'success');
};

// ==========================================
// ATTENDANCE & JOURNAL
// ==========================================
window.loadAbsensi = function() {
    const jVal = document.getElementById('selectJadwalAbsen').value;
    if(!jVal) return showToast('Pilih Jadwal!', 'warning');
    
    const rombel = JSON.parse(jVal).rombel;
    const siswaKelas = dataSiswa.filter(s => s.rombel === rombel);
    
    document.getElementById('areaAbsen').classList.remove('d-none');
    
    let html = '';
    if (siswaKelas.length === 0) {
        html = '<div class="col-12 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Tidak ada siswa di rombel ini. Import data siswa terlebih dahulu.</div>';
    } else {
        siswaKelas.forEach((s, i) => {
            html += `<div class="col-md-3 col-6">
                <div class="form-check p-2 border rounded">
                    <input type="checkbox" class="form-check-input absen-check" value="${s.nama}" id="abs${i}" checked>
                    <label class="form-check-label small" for="abs${i}">${s.nama}</label>
                </div>
            </div>`;
        });
    }
    document.getElementById('listSiswaAbsen').innerHTML = html;
};

window.simpanJurnal = function() {
    const jVal = document.getElementById('selectJadwalAbsen').value;
    const materi = document.getElementById('selectTPAbsen').value;
    
    if(!jVal || !materi) return showToast('Lengkapi jadwal dan materi!', 'warning');
    
    const jadwal = JSON.parse(jVal);
    const checkboxes = document.querySelectorAll('.absen-check');
    let hadir = 0;
    let tidakHadir = [];
    
    checkboxes.forEach(cb => {
        if(cb.checked) hadir++;
        else tidakHadir.push(cb.value);
    });
    
    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const tanggalStr = `${days[today.getDay()]}, ${today.toLocaleDateString('id-ID')}`;
    const p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    const mapel = getActiveMapelName();
    
    let jurnalHtml = `
        <div class="doc-header">JURNAL PELAKSANAAN PEMBELAJARAN</div>
        <table style="width:60%; margin-bottom:15px; font-size:11pt;">
            <tr><td width="25%">Nama Sekolah</td><td width="2%">:</td><td><b>${p.sek||'...'}</b></td></tr>
            <tr><td>Mata Pelajaran</td><td>:</td><td>${mapel}</td></tr>
            <tr><td>Nama Guru</td><td>:</td><td>${p.gur||'...'}</td></tr>
        </table>
        <table class="doc-table" style="text-align:center;">
            <thead>
                <tr>
                    <th width="15%">Hari/Tanggal</th>
                    <th width="10%">Rombel</th>
                    <th width="10%">Jam Ke</th>
                    <th width="35%">Materi / Tujuan Pembelajaran</th>
                    <th width="15%">Absensi</th>
                    <th width="15%">Catatan</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${tanggalStr}</td>
                    <td>${jadwal.rombel}</td>
                    <td>${jadwal.jam}</td>
                    <td style="text-align:left;">${materi}</td>
                    <td style="text-align:left;">
                        Hadir: <b>${hadir}</b><br>
                        Tidak Hadir: <b>${tidakHadir.length}</b>
                        ${tidakHadir.length > 0 ? '<br><small class="text-danger">(' + tidakHadir.join(', ') + ')</small>' : ''}
                    </td>
                    <td>Tuntas</td>
                </tr>
            </tbody>
        </table>
        <div style="display:flex; justify-content:space-between; margin-top:50px;">
            <div style="width:45%; text-align:center;">
                Mengetahui,<br>Kepala Sekolah<br><br><br><br>
                <u><b>${p.kep||'...'}</b></u><br>NIP. ${p.nkep||'...'}
            </div>
            <div style="width:45%; text-align:center;">
                ${p.tgl||'...'}<br>Guru ${mapel}<br><br><br><br>
                <u><b>${p.gur||'...'}</b></u><br>NIP. ${p.ngur||'...'}
            </div>
        </div>`;
    
    document.getElementById('docJurnal').innerHTML = jurnalHtml;
    showToast('Jurnal tersimpan! Klik Cetak.', 'success');
};

// ==========================================
// GRADING / PENILAIAN
// ==========================================
window.renderKelasPenilaian = function() {
    let opts = '<option value="">-- Pilih Rombel --</option>';
    new Set(dataSiswa.map(s => s.rombel)).forEach(k => opts += `<option value="${k}">${k}</option>`);
    document.getElementById('selectKelasNilai').innerHTML = opts;
};

window.loadPenilaian = function() {
    const rombel = document.getElementById('selectKelasNilai').value;
    if (!rombel) return;
    
    const topik = document.getElementById('topikNilai').value;
    const p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    const mapel = getActiveMapelName();
    
    let html = `
        <div class="doc-header">DAFTAR NILAI SISWA</div>
        <table style="width:60%; margin-bottom:15px; font-size:11pt;">
            <tr><td width="25%">Mata Pelajaran</td><td width="2%">:</td><td><b>${mapel}</b></td></tr>
            <tr><td>Kelas / Rombel</td><td>:</td><td><b>${rombel}</b></td></tr>
            <tr><td>Topik Penilaian</td><td>:</td><td><b>${topik}</b></td></tr>
            <tr><td>Tahun Ajaran</td><td>:</td><td>${p.thn||'...'}</td></tr>
        </table>
        <table class="doc-table" style="text-align:center;">
            <thead>
                <tr>
                    <th width="5%">No</th>
                    <th width="15%">NISN</th>
                    <th width="45%">Nama Siswa</th>
                    <th width="10%">JK</th>
                    <th width="15%">Nilai</th>
                    <th width="10%">Ket</th>
                </tr>
            </thead>
            <tbody>`;
    
    const siswaRombel = dataSiswa.filter(s => s.rombel === rombel);
    
    if (siswaRombel.length === 0) {
        html += '<tr><td colspan="6">Tidak ada siswa</td></tr>';
    } else {
        siswaRombel.forEach((s, i) => {
            const nilai = dataNilai[`${rombel}_${s.nisn}`] || '';
            const ket = nilai >= 75 ? 'Tuntas' : (nilai ? 'Belum' : '-');
            html += `<tr>
                <td>${i + 1}</td>
                <td>${s.nisn}</td>
                <td style="text-align:left;">${s.nama}</td>
                <td>${s.jk}</td>
                <td class="no-print">
                    <input type="number" class="form-control form-control-sm input-nilai text-center" 
                           data-id="${s.nisn}" value="${nilai}" min="0" max="100" style="width:70px; margin:0 auto;">
                </td>
                <td class="d-none print-nilai">${nilai}</td>
                <td class="d-none print-ket">${ket}</td>
            </tr>`;
        });
    }
    
    html += `</tbody></table>
        <style>
            @media print { 
                .no-print { display: none !important; } 
                .print-nilai, .print-ket { display: table-cell !important; }
            }
        </style>
        <div style="display:flex; justify-content:space-between; margin-top:50px;">
            <div style="width:45%; text-align:center;">
                Mengetahui,<br>Kepala Sekolah<br><br><br><br>
                <u><b>${p.kep||'...'}</b></u><br>NIP. ${p.nkep||'...'}
            </div>
            <div style="width:45%; text-align:center;">
                ${p.tgl||'...'}<br>Guru ${mapel}<br><br><br><br>
                <u><b>${p.gur||'...'}</b></u><br>NIP. ${p.ngur||'...'}
            </div>
        </div>`;
    
    document.getElementById('docNilai').innerHTML = html;
    document.getElementById('docNilai').classList.remove('d-none');
};

window.simpanNilai = function() {
    const rombel = document.getElementById('selectKelasNilai').value;
    if(!rombel) return showToast('Pilih rombel!', 'warning');
    
    document.querySelectorAll('.input-nilai').forEach(el => {
        const id = el.getAttribute('data-id');
        dataNilai[`${rombel}_${id}`] = el.value;
    });
    
    localStorage.setItem('sim_nilai', JSON.stringify(dataNilai));
    showToast('Nilai tersimpan!', 'success');
    loadPenilaian();
};

// ==========================================
// PRINT FUNCTIONS
// ==========================================
window.triggerPrint = function(sourceId, pdfName, orientation) {
    updateUIProfile();
    document.title = `${pdfName}_${new Date().getTime()}`;
    
    // Hide all print views
    document.querySelectorAll('.print-view').forEach(el => {
        el.classList.add('d-none');
        el.classList.remove('print-active');
    });
    
    // Show only target
    const target = document.getElementById(sourceId);
    if (!target) {
        showToast('Dokumen belum di-generate!', 'warning');
        return;
    }
    
    target.classList.remove('d-none');
    target.classList.add('print-active');
    
    // Add orientation style
    let styleEl = document.getElementById('printOrientationStyle');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'printOrientationStyle';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@media print { @page { size: ${orientation}; } }`;
    
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            target.classList.remove('print-active');
        }, 500);
    }, 300);
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
window.copyToClipboard = function(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(textarea.value);
    showToast('Prompt disalin!', 'success');
};

function showToast(message, type = 'info') {
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    
    const bgColors = {
        'success': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        'danger': 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
        'warning': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'info': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };
    
    const icons = {
        'success': 'fa-check-circle',
        'danger': 'fa-times-circle',
        'warning': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas ${icons[type]} me-2"></i>${message}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${bgColors[type]};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 9999;
        font-weight: 500;
        font-size: 0.9rem;
        animation: toastSlideIn 0.3s ease;
        max-width: 300px;
    `;
    
    if (!document.getElementById('toastAnimStyle')) {
        const style = document.createElement('style');
        style.id = 'toastAnimStyle';
        style.textContent = `
            @keyframes toastSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes toastSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// BACKUP & RESTORE
// ==========================================
window.exportAllData = function() {
    const allData = {
        siswa: dataSiswa,
        jadwal: dataJadwal,
        cptp: dataCPTP,
        nilai: dataNilai,
        holidays: customHolidays,
        mapel: dataMapel,
        activeMapel: activeMapelId,
        profil: JSON.parse(localStorage.getItem('sim_prof')) || {},
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sim_kurikulum_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Data berhasil diekspor!', 'success');
};

window.importAllData = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.siswa) { dataSiswa = data.siswa; localStorage.setItem('sim_siswa', JSON.stringify(dataSiswa)); }
            if (data.jadwal) { dataJadwal = data.jadwal; localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal)); }
            if (data.cptp) { dataCPTP = data.cptp; localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP)); }
            if (data.nilai) { dataNilai = data.nilai; localStorage.setItem('sim_nilai', JSON.stringify(dataNilai)); }
            if (data.holidays) { customHolidays = data.holidays; localStorage.setItem('sim_holidays', JSON.stringify(customHolidays)); }
            if (data.mapel) { dataMapel = data.mapel; localStorage.setItem('sim_mapel', JSON.stringify(dataMapel)); }
            if (data.activeMapel) { activeMapelId = data.activeMapel; localStorage.setItem('sim_active_mapel', activeMapelId); }
            if (data.profil) { localStorage.setItem('sim_prof', JSON.stringify(data.profil)); }
            
            // Refresh
            loadProfil();
            renderTabelSiswa();
            renderJadwal();
            renderCPTP();
            renderCalendar();
            renderMapelList();
            updateStats();
            updateActiveMapelIndicator();
            
            showToast('Data berhasil diimpor!', 'success');
        } catch (err) {
            showToast('Format file tidak valid!', 'danger');
        }
    };
    reader.readAsText(file);
};

// ==========================================
// KEYBOARD & WINDOW EVENTS
// ==========================================
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        showToast('Data tersimpan otomatis di browser!', 'info');
    }
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            bootstrap.Modal.getInstance(modal)?.hide();
        });
    }
});

// Close sidebar when clicking outside on mobile
window.addEventListener('resize', function() {
    if (window.innerWidth >= 992) {
        document.getElementById('sidebarMenu').classList.remove('show');
        document.getElementById('sidebarOverlay').classList.remove('show');
    }
});

// ==========================================
// INIT LOG
// ==========================================
console.log('🎓 SIM Kurikulum Merdeka Pro v2.0');
console.log('📱 Device ID:', deviceId);
console.log('✅ Support: SD, SMP, SMA, SMK, PAUD');                                                                                                                                            
