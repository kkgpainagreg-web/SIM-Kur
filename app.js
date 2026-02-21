// ==========================================
// SIM KURIKULUM MERDEKA PRO v2.1
// Dengan Validasi Jadwal Anti Bentrok
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

// Admin & Pricing
const DEFAULT_ADMIN = { email: "afifaro@gmail.com", password: "admin123" };
let adminSettings = JSON.parse(localStorage.getItem('sim_admin')) || DEFAULT_ADMIN;
let pricingSettings = JSON.parse(localStorage.getItem('sim_pricing')) || {
    whatsapp: "6281234567890", harga: 99000, hargaDesc: "Lifetime",
    bank: "BCA", rekening: "1234567890", namaRek: "Admin"
};

// Device ID
let deviceId = localStorage.getItem('sim_device_id');
if (!deviceId) {
    deviceId = 'DEV_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('sim_device_id', deviceId);
}

// Calendar
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// National Holidays
const nationalHolidays = {
    "01-01": "Tahun Baru Masehi",
    "05-01": "Hari Buruh",
    "06-01": "Hari Lahir Pancasila",
    "08-17": "Hari Kemerdekaan RI",
    "12-25": "Hari Natal"
};

// ==========================================
// JENJANG CONFIGURATION
// ==========================================
const JENJANG_CONFIG = {
    PAUD: {
        fases: [{ value: 'Fondasi', label: 'Fase Fondasi' }],
        kelas: [
            { value: 'Kelompok A', label: 'Kelompok A' },
            { value: 'Kelompok B', label: 'Kelompok B' },
            { value: 'TK A', label: 'TK A' },
            { value: 'TK B', label: 'TK B' }
        ]
    },
    SD: {
        fases: [
            { value: 'A', label: 'Fase A (Kelas 1-2)' },
            { value: 'B', label: 'Fase B (Kelas 3-4)' },
            { value: 'C', label: 'Fase C (Kelas 5-6)' }
        ],
        kelas: [
            { value: '1', label: 'Kelas 1' },
            { value: '2', label: 'Kelas 2' },
            { value: '3', label: 'Kelas 3' },
            { value: '4', label: 'Kelas 4' },
            { value: '5', label: 'Kelas 5' },
            { value: '6', label: 'Kelas 6' }
        ]
    },
    SMP: {
        fases: [{ value: 'D', label: 'Fase D (Kelas 7-9)' }],
        kelas: [
            { value: '7', label: 'Kelas 7' },
            { value: '8', label: 'Kelas 8' },
            { value: '9', label: 'Kelas 9' }
        ]
    },
    SMA: {
        fases: [
            { value: 'E', label: 'Fase E (Kelas 10)' },
            { value: 'F', label: 'Fase F (Kelas 11-12)' }
        ],
        kelas: [
            { value: '10', label: 'Kelas 10' },
            { value: '11', label: 'Kelas 11' },
            { value: '12', label: 'Kelas 12' }
        ]
    },
    SMK: {
        fases: [
            { value: 'E', label: 'Fase E (Kelas 10)' },
            { value: 'F', label: 'Fase F (Kelas 11-12)' }
        ],
        kelas: [
            { value: '10', label: 'Kelas 10' },
            { value: '11', label: 'Kelas 11' },
            { value: '12', label: 'Kelas 12' },
            { value: '13', label: 'Kelas 13 (4 Tahun)' }
        ]
    }
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
    document.getElementById('showDeviceId').textContent = deviceId.substring(0, 15) + '...';
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
    if(tabId === 'tabJadwal') renderJadwal();
    
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
// DYNAMIC FORM UPDATES BY JENJANG
// ==========================================
window.updateMapelFormByJenjang = function() {
    const jenjang = document.getElementById('newMapelJenjang').value;
    const faseSelect = document.getElementById('newMapelFase');
    const kelasSelect = document.getElementById('newMapelKelas');
    
    if (!jenjang || !JENJANG_CONFIG[jenjang]) {
        faseSelect.innerHTML = '<option value="">Pilih Jenjang Dulu</option>';
        kelasSelect.innerHTML = '<option value="">Pilih Jenjang Dulu</option>';
        faseSelect.disabled = true;
        kelasSelect.disabled = true;
        return;
    }
    
    const config = JENJANG_CONFIG[jenjang];
    
    // Update Fase
    let faseOpts = '<option value="">-- Pilih Fase --</option>';
    config.fases.forEach(f => faseOpts += `<option value="${f.value}">${f.label}</option>`);
    faseSelect.innerHTML = faseOpts;
    faseSelect.disabled = false;
    
    // Update Kelas
    let kelasOpts = '<option value="">-- Pilih Kelas --</option>';
    config.kelas.forEach(k => kelasOpts += `<option value="${k.value}">${k.label}</option>`);
    kelasSelect.innerHTML = kelasOpts;
    kelasSelect.disabled = false;
};

window.updateJadwalDropdowns = function() {
    const jenjang = document.getElementById('jadwalJenjang').value;
    const faseSelect = document.getElementById('jadwalFase');
    const kelasSelect = document.getElementById('jadwalKelas');
    
    if (!jenjang || !JENJANG_CONFIG[jenjang]) {
        faseSelect.innerHTML = '<option value="">Pilih Jenjang</option>';
        kelasSelect.innerHTML = '<option value="">Pilih Jenjang</option>';
        faseSelect.disabled = true;
        kelasSelect.disabled = true;
        return;
    }
    
    const config = JENJANG_CONFIG[jenjang];
    
    let faseOpts = '';
    config.fases.forEach(f => faseOpts += `<option value="${f.value}">${f.label}</option>`);
    faseSelect.innerHTML = faseOpts;
    faseSelect.disabled = false;
    
    let kelasOpts = '';
    config.kelas.forEach(k => kelasOpts += `<option value="${k.value}">${k.label}</option>`);
    kelasSelect.innerHTML = kelasOpts;
    kelasSelect.disabled = false;
};

window.updateProfilByJenjang = function() {
    // Could be used for additional profile-based updates
};

// ==========================================
// JADWAL VALIDATION (ANTI BENTROK)
// ==========================================
function validateJadwal(newJadwal) {
    const conflicts = [];
    const MAX_ROMBEL_PER_JAM = 2;
    
    // Check 1: Exact duplicate (same day, hour, class, rombel)
    const exactDuplicate = dataJadwal.find(j => 
        j.hari === newJadwal.hari && 
        j.jam === newJadwal.jam && 
        j.kelas === newJadwal.kelas && 
        j.rombel === newJadwal.rombel
    );
    
    if (exactDuplicate) {
        conflicts.push({
            type: 'duplicate',
            message: `Jadwal persis sama sudah ada: ${newJadwal.hari} Jam ${newJadwal.jam} untuk Kelas ${newJadwal.kelas}${newJadwal.rombel}`
        });
    }
    
    // Check 2: Same day and hour - count how many rombels already scheduled
    const sameTimeSlot = dataJadwal.filter(j => 
        j.hari === newJadwal.hari && 
        j.jam === newJadwal.jam
    );
    
    if (sameTimeSlot.length >= MAX_ROMBEL_PER_JAM) {
        conflicts.push({
            type: 'max_rombel',
            message: `Sudah ada ${sameTimeSlot.length} rombel di ${newJadwal.hari} Jam ${newJadwal.jam}. Maksimal ${MAX_ROMBEL_PER_JAM} rombel per jam.`,
            existing: sameTimeSlot.map(j => `${j.jenjang} ${j.kelas}${j.rombel}`)
        });
    }
    
    // Check 3: Same class-rombel at the same time slot (even different day?)
    // This ensures a specific class can't be in two places at once
    const classConflict = dataJadwal.find(j =>
        j.hari === newJadwal.hari &&
        j.jam === newJadwal.jam &&
        j.jenjang === newJadwal.jenjang &&
        j.kelas === newJadwal.kelas &&
        j.rombel === newJadwal.rombel
    );
    
    if (classConflict && !exactDuplicate) {
        conflicts.push({
            type: 'class_conflict',
            message: `Kelas ${newJadwal.jenjang} ${newJadwal.kelas}${newJadwal.rombel} sudah dijadwalkan di waktu yang sama`
        });
    }
    
    return conflicts;
}

window.tambahJadwal = function() {
    const hari = document.getElementById('jadwalHari').value;
    const jam = document.getElementById('jadwalJam').value;
    const jenjang = document.getElementById('jadwalJenjang').value;
    const fase = document.getElementById('jadwalFase').value;
    const kelas = document.getElementById('jadwalKelas').value;
    const rombel = document.getElementById('jadwalRombel').value.trim().toUpperCase() || 'A';
    
    // Validation: Required fields
    if (!jenjang) return showToast('Pilih Jenjang!', 'warning');
    if (!fase) return showToast('Pilih Fase!', 'warning');
    if (!kelas) return showToast('Pilih Kelas!', 'warning');
    
    const newJadwal = { hari, jam, jenjang, fase, kelas, rombel };
    
    // Validate conflicts
    const conflicts = validateJadwal(newJadwal);
    
    if (conflicts.length > 0) {
        showJadwalConflict(conflicts);
        return;
    }
    
    // Add jadwal
    dataJadwal.push(newJadwal);
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
    renderJadwal();
    updateStats();
    
    // Reset form
    document.getElementById('jadwalRombel').value = '';
    
    showToast('Jadwal berhasil ditambahkan!', 'success');
};

function showJadwalConflict(conflicts) {
    let html = '<div class="info-box danger mb-3"><i class="fas fa-exclamation-triangle me-2"></i>Jadwal tidak dapat ditambahkan karena:</div>';
    html += '<ul class="mb-0">';
    conflicts.forEach(c => {
        html += `<li class="mb-2"><strong>${c.type === 'duplicate' ? 'Duplikat' : c.type === 'max_rombel' ? 'Melebihi Batas' : 'Bentrok'}:</strong><br>${c.message}`;
        if (c.existing) {
            html += `<br><small class="text-muted">Sudah ada: ${c.existing.join(', ')}</small>`;
        }
        html += '</li>';
    });
    html += '</ul>';
    
    document.getElementById('conflictDetails').innerHTML = html;
    const modal = new bootstrap.Modal(document.getElementById('jadwalConflictModal'));
    modal.show();
}

window.hapusJadwal = function(idx) {
    if (!confirm('Hapus jadwal ini?')) return;
    dataJadwal.splice(idx, 1);
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
    renderJadwal();
    updateStats();
    showToast('Jadwal dihapus!', 'info');
};

function renderJadwal() {
    let html = '';
    if (dataJadwal.length === 0) {
        html = '<tr><td colspan="7" class="text-center py-4">Belum ada jadwal</td></tr>';
    } else {
        // Sort by day and hour
        const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const sorted = [...dataJadwal].sort((a, b) => {
            const dayDiff = dayOrder.indexOf(a.hari) - dayOrder.indexOf(b.hari);
            if (dayDiff !== 0) return dayDiff;
            return parseInt(a.jam) - parseInt(b.jam);
        });
        
        sorted.forEach((d, i) => {
            const origIdx = dataJadwal.findIndex(j => 
                j.hari === d.hari && j.jam === d.jam && j.kelas === d.kelas && j.rombel === d.rombel
            );
            html += `<tr>
                <td>${d.hari}</td>
                <td>Jam ${d.jam}</td>
                <td><span class="jenjang-badge jenjang-${d.jenjang.toLowerCase()}">${d.jenjang}</span></td>
                <td>Fase ${d.fase}</td>
                <td>${d.kelas}</td>
                <td>${d.rombel}</td>
                <td><button class="btn btn-sm btn-danger py-0 px-2" onclick="hapusJadwal(${origIdx})"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
    }
    document.getElementById('tabelJadwalBody').innerHTML = html;
}

window.showJadwalMatrix = function() {
    const matrixView = document.getElementById('jadwalMatrixView');
    matrixView.classList.toggle('d-none');
    
    if (!matrixView.classList.contains('d-none')) {
        renderJadwalMatrix();
    }
};

function renderJadwalMatrix() {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    let html = '<thead class="table-dark"><tr><th>Jam</th>';
    days.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody>';
    
    hours.forEach(h => {
        html += `<tr><td class="fw-bold">Jam ${h}</td>`;
        days.forEach(d => {
            const jadwalAtSlot = dataJadwal.filter(j => j.hari === d && parseInt(j.jam) === h);
            html += '<td class="jadwal-cell">';
            jadwalAtSlot.forEach(j => {
                html += `<div class="jadwal-item">${j.jenjang} ${j.kelas}${j.rombel}</div>`;
            });
            if (jadwalAtSlot.length >= 2) {
                html += '<span class="conflict-badge">PENUH</span>';
            }
            html += '</td>';
        });
        html += '</tr>';
    });
    
    html += '</tbody>';
    document.getElementById('jadwalMatrixTable').innerHTML = html;
}

// ==========================================
// MAPEL MANAGEMENT
// ==========================================
window.showAddMapelModal = function() {
    // Reset form
    document.getElementById('newMapelJenjang').value = '';
    document.getElementById('newMapelNama').value = '';
    document.getElementById('newMapelFase').innerHTML = '<option value="">Pilih Jenjang Dulu</option>';
    document.getElementById('newMapelKelas').innerHTML = '<option value="">Pilih Jenjang Dulu</option>';
    document.getElementById('newMapelFase').disabled = true;
    document.getElementById('newMapelKelas').disabled = true;
    
    const modal = new bootstrap.Modal(document.getElementById('addMapelModal'));
    modal.show();
};

window.simpanMapelBaru = function() {
    const jenjang = document.getElementById('newMapelJenjang').value;
    const nama = document.getElementById('newMapelNama').value.trim();
    const kelas = document.getElementById('newMapelKelas').value;
    const fase = document.getElementById('newMapelFase').value;
    
    if (!jenjang) return showToast('Pilih Jenjang!', 'warning');
    if (!nama) return showToast('Isi Nama Mapel!', 'warning');
    if (!kelas) return showToast('Pilih Kelas!', 'warning');
    if (!fase) return showToast('Pilih Fase!', 'warning');
    
    const newMapel = {
        id: 'MAPEL_' + Date.now(),
        jenjang, nama, kelas, fase,
        createdAt: new Date().toISOString()
    };
    
    dataMapel.push(newMapel);
    localStorage.setItem('sim_mapel', JSON.stringify(dataMapel));
    
    if (dataMapel.length === 1) setActiveMapel(newMapel.id);
    
    bootstrap.Modal.getInstance(document.getElementById('addMapelModal')).hide();
    renderMapelList();
    updateStats();
    showToast('Mapel ditambahkan!', 'success');
};

window.setActiveMapel = function(mapelId) {
    activeMapelId = mapelId;
    localStorage.setItem('sim_active_mapel', mapelId);
    renderMapelList();
    updateActiveMapelIndicator();
    showToast('Mapel aktif diubah!', 'success');
};

window.hapusMapel = function(mapelId) {
    if (!confirm('Hapus mapel ini?')) return;
    dataMapel = dataMapel.filter(m => m.id !== mapelId);
    localStorage.setItem('sim_mapel', JSON.stringify(dataMapel));
    if (activeMapelId === mapelId) {
        activeMapelId = dataMapel.length > 0 ? dataMapel[0].id : null;
        localStorage.setItem('sim_active_mapel', activeMapelId);
    }
    renderMapelList();
    updateActiveMapelIndicator();
    updateStats();
};

window.filterMapelByJenjang = function(jenjang) {
    document.querySelectorAll('#filterJenjangBtns .btn').forEach(btn => {
        btn.classList.remove('active');
        if ((jenjang === 'ALL' && btn.textContent === 'Semua') || btn.textContent === jenjang) {
            btn.classList.add('active');
        }
    });
    renderMapelList(jenjang);
};

function renderMapelList(filter = 'ALL') {
    const container = document.getElementById('mapelList');
    let filtered = filter === 'ALL' ? dataMapel : dataMapel.filter(m => m.jenjang === filter);
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">
            <i class="fas fa-book fa-4x mb-3 opacity-25"></i>
            <p>Belum ada mapel${filter !== 'ALL' ? ' untuk ' + filter : ''}.</p>
            <button class="btn btn-gradient-primary" onclick="showAddMapelModal()"><i class="fas fa-plus me-2"></i>Tambah</button>
        </div>`;
        return;
    }
    
    let html = '';
    filtered.forEach(m => {
        const isActive = m.id === activeMapelId;
        html += `<div class="col-md-4 col-sm-6">
            <div class="mapel-card ${isActive ? 'active' : ''}" onclick="setActiveMapel('${m.id}')">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="jenjang-badge jenjang-${m.jenjang.toLowerCase()}">${m.jenjang}</span>
                    ${isActive ? '<span class="badge bg-primary"><i class="fas fa-check"></i></span>' : ''}
                </div>
                <h6 class="fw-bold mb-1">${m.nama}</h6>
                <small class="text-muted">Kelas ${m.kelas} • Fase ${m.fase}</small>
                <div class="mt-3 d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="event.stopPropagation(); setActiveMapel('${m.id}')"><i class="fas fa-check-circle"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); hapusMapel('${m.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function updateActiveMapelIndicator() {
    const indicator = document.getElementById('activeMapelIndicator');
    const nameEl = document.getElementById('activeMapelName');
    if (activeMapelId) {
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
    return 'Mata Pelajaran';
}

// ==========================================
// PREMIUM SYSTEM
// ==========================================
function isPremiumUser() { return premiumUsers.includes(deviceId); }

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
    new bootstrap.Modal(document.getElementById('upgradeModal')).show();
};

function loadPricingDisplay() {
    document.getElementById('displayPrice').textContent = 'Rp ' + Number(pricingSettings.harga).toLocaleString('id-ID');
    document.getElementById('displayPriceDesc').textContent = pricingSettings.hargaDesc;
    document.getElementById('displayBank').textContent = pricingSettings.bank;
    document.getElementById('displayRekening').textContent = pricingSettings.rekening;
    document.getElementById('displayNamaRek').textContent = pricingSettings.namaRek;
    document.getElementById('waUpgradeBtn').href = `https://wa.me/${pricingSettings.whatsapp}?text=${encodeURIComponent('Halo, saya mau upgrade SIM Kurikulum Pro. Device ID: ' + deviceId)}`;
}

window.checkPremiumAndPrint = function(docId, name, orientation) {
    if (!isPremiumUser()) { showUpgradeModal(); return; }
    triggerPrint(docId, name, orientation);
};

// ==========================================
// ADMIN PANEL
// ==========================================
window.showAdminLogin = function() { new bootstrap.Modal(document.getElementById('adminLoginModal')).show(); };

window.loginAdmin = function() {
    if (document.getElementById('adminEmail').value === adminSettings.email && 
        document.getElementById('adminPassword').value === adminSettings.password) {
        localStorage.setItem('sim_admin_logged', 'true');
        bootstrap.Modal.getInstance(document.getElementById('adminLoginModal')).hide();
        showTab('tabAdmin');
        showToast('Login berhasil!', 'success');
    } else {
        showToast('Login gagal!', 'danger');
    }
};

window.logoutAdmin = function() {
    localStorage.removeItem('sim_admin_logged');
    showTab('tabDashboard');
};

function loadAdminPanel() {
    if (localStorage.getItem('sim_admin_logged') !== 'true') { showAdminLogin(); return; }
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
    const pwd = document.getElementById('adminPasswordSetting').value;
    if (pwd.trim()) adminSettings.password = pwd;
    localStorage.setItem('sim_admin', JSON.stringify(adminSettings));
    showToast('Tersimpan!', 'success');
};

window.simpanPricingSettings = function() {
    pricingSettings = {
        whatsapp: document.getElementById('settingWA').value,
        harga: document.getElementById('settingHarga').value,
        hargaDesc: document.getElementById('settingHargaDesc').value,
        bank: document.getElementById('settingBank').value,
        rekening: document.getElementById('settingRekening').value,
        namaRek: document.getElementById('settingNamaRek').value
    };
    localStorage.setItem('sim_pricing', JSON.stringify(pricingSettings));
    showToast('Tersimpan!', 'success');
};

window.addPremiumUser = function() {
    const id = document.getElementById('newPremiumUser').value.trim();
    if (!id) return;
    if (!premiumUsers.includes(id)) {
        premiumUsers.push(id);
        localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
        document.getElementById('newPremiumUser').value = '';
        renderPremiumUsers();
        checkPremiumStatus();
        showToast('Ditambahkan!', 'success');
    }
};

window.activateCurrentDevice = function() {
    if (!premiumUsers.includes(deviceId)) {
        premiumUsers.push(deviceId);
        localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
        renderPremiumUsers();
        checkPremiumStatus();
        showToast('Device ini Premium!', 'success');
    }
};

window.removePremiumUser = function(id) {
    premiumUsers = premiumUsers.filter(u => u !== id);
    localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
    renderPremiumUsers();
    checkPremiumStatus();
};

function renderPremiumUsers() {
    const tbody = document.getElementById('premiumUsersList');
    if (premiumUsers.length === 0) { tbody.innerHTML = '<tr><td colspan="3">Belum ada</td></tr>'; return; }
    tbody.innerHTML = premiumUsers.map((u, i) => 
        `<tr><td>${i+1}</td><td><small>${u}${u === deviceId ? ' <span class="badge bg-success">Ini</span>' : ''}</small></td>
        <td><button class="btn btn-sm btn-danger py-0" onclick="removePremiumUser('${u}')"><i class="fas fa-times"></i></button></td></tr>`
    ).join('');
}

// ==========================================
// CALENDAR
// ==========================================
function renderCalendar() {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    document.getElementById('calendarTitle').textContent = `${months[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    let html = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => `<div class="calendar-day-header">${d}</div>`).join('');
    for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day" style="opacity:0.2;"></div>';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let cls = 'calendar-day', name = '';
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) cls += ' today';
        if (nationalHolidays[dateStr]) { cls += ' holiday'; name = nationalHolidays[dateStr]; }
        const custom = customHolidays.find(h => h.date === fullDate);
        if (custom) { cls += ' holiday-custom'; name = custom.name; }
        html += `<div class="${cls}" onclick="showHolidayInfo('${fullDate}','${name}')" title="${name}">${day}${name ? '<div class="holiday-dot"></div>' : ''}</div>`;
    }
    document.getElementById('calendarGrid').innerHTML = html;
    renderHolidayList();
}

window.changeMonth = function(d) {
    currentMonth += d;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
};

window.showHolidayInfo = function(date, name) { if (name) showToast(`${date}: ${name}`, 'info'); };

window.addCustomHoliday = function() {
    const date = document.getElementById('customHolidayDate').value;
    const name = document.getElementById('customHolidayName').value.trim();
    if (!date || !name) return showToast('Lengkapi data!', 'warning');
    if (!customHolidays.find(h => h.date === date)) {
        customHolidays.push({ date, name });
        localStorage.setItem('sim_holidays', JSON.stringify(customHolidays));
        document.getElementById('customHolidayDate').value = '';
        document.getElementById('customHolidayName').value = '';
        renderCalendar();
        showToast('Ditambahkan!', 'success');
    }
};

window.removeCustomHoliday = function(date) {
    customHolidays = customHolidays.filter(h => h.date !== date);
    localStorage.setItem('sim_holidays', JSON.stringify(customHolidays));
    renderCalendar();
};

function renderHolidayList() {
    let html = '<h6 class="fw-bold mb-2 text-danger small">Libur Nasional</h6>';
    Object.entries(nationalHolidays).forEach(([d, n]) => html += `<div class="small p-2 bg-light rounded mb-1">${n} <span class="text-muted">(${d})</span></div>`);
    html += '<hr><h6 class="fw-bold mb-2 text-success small">Libur Kustom</h6>';
    if (customHolidays.length === 0) html += '<p class="text-muted small">Belum ada</p>';
    else customHolidays.forEach(h => html += `<div class="d-flex justify-content-between small p-2 bg-light rounded mb-1"><span>${h.name}<br><small class="text-muted">${h.date}</small></span><button class="btn btn-sm btn-outline-danger py-0" onclick="removeCustomHoliday('${h.date}')"><i class="fas fa-times"></i></button></div>`);
    document.getElementById('holidayList').innerHTML = html;
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
// PROFILE
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
    showToast('Tersimpan!', 'success');
    updateUIProfile();
};

function loadProfil() {
    const p = JSON.parse(localStorage.getItem('sim_prof'));
    if (p) {
        if (document.getElementById('profJenjang')) document.getElementById('profJenjang').value = p.jenjang || 'SD';
        document.getElementById('profNpsn').value = p.npsn || '';
        document.getElementById('profSekolah').value = p.sek || '';
        if (document.getElementById('profAlamat')) document.getElementById('profAlamat').value = p.alamat || '';
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
    document.querySelectorAll('.vMapel').forEach(e => e.innerText = getActiveMapelName());
    document.querySelectorAll('.vSekolah').forEach(e => e.innerText = p.sek || '...');
    document.querySelectorAll('.vTahun').forEach(e => e.innerText = p.thn || '...');
    document.querySelectorAll('.vKepsek').forEach(e => e.innerText = p.kep || '...');
    document.querySelectorAll('.vNipKepsek').forEach(e => e.innerText = p.nkep || '...');
    document.querySelectorAll('.vGuru').forEach(e => e.innerText = p.gur || '...');
    document.querySelectorAll('.vNipGuru').forEach(e => e.innerText = p.ngur || '...');
    document.querySelectorAll('.vTanggal').forEach(e => e.innerText = p.tgl || '...');
}

// ==========================================
// CP & TP
// ==========================================
function renderCPTP() {
    document.getElementById('inputCP').value = dataCPTP.cp;
    document.getElementById('bodyInputTP').innerHTML = dataCPTP.tps.map((tp, i) => 
        `<tr><td><input type="number" class="form-control form-control-sm tp-bab" value="${tp.bab}"></td>
        <td><input type="text" class="form-control form-control-sm tp-judul" value="${tp.judul}"></td>
        <td><input type="number" class="form-control form-control-sm tp-jp" value="${tp.jp}"></td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="hapusTP(${i})"><i class="fas fa-trash"></i></button></td></tr>`
    ).join('');
}

window.tambahBarisTP = function() { dataCPTP.tps.push({ bab: dataCPTP.tps.length + 1, judul: "", jp: 4 }); renderCPTP(); };
window.hapusTP = function(i) { dataCPTP.tps.splice(i, 1); renderCPTP(); };

window.simpanCPTP = function() {
    dataCPTP.cp = document.getElementById('inputCP').value;
    dataCPTP.tps = [];
    document.querySelectorAll('.tp-bab').forEach((el, i) => {
        const judul = document.querySelectorAll('.tp-judul')[i].value;
        if (judul.trim()) dataCPTP.tps.push({ bab: el.value, judul, jp: document.querySelectorAll('.tp-jp')[i].value });
    });
    localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
    updateStats();
    showToast('Tersimpan!', 'success');
};

window.loadDefaultPAI = function() {
    if (typeof dbKurikulumPAI === 'undefined') return showToast('File data_default.js tidak ditemukan!', 'danger');
    const d = dbKurikulumPAI[document.getElementById('loadDefaultKls').value];
    if (d) { dataCPTP = { cp: d.cp, tps: d.tps }; localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP)); renderCPTP(); updateStats(); showToast('Dimuat!', 'success'); }
};

// ==========================================
// STUDENTS
// ==========================================
window.importSiswaLokal = function() {
    const file = document.getElementById('fileCsvSiswa').files[0];
    if (!file) return showToast('Pilih file!', 'warning');
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => {
        r.data.forEach(s => {
            const nama = s.nama || s.Nama;
            const kelas = s.kelas || s.Kelas;
            const rombel = s.rombel || s.Rombel;
            if (nama && kelas && rombel) dataSiswa.push({ nisn: s.nisn || s.NISN || '-', nama, jk: s.jk || s.JK || '-', kelas, rombel });
        });
        localStorage.setItem('sim_siswa', JSON.stringify(dataSiswa));
        renderTabelSiswa();
        updateStats();
        showToast(`${r.data.length} siswa diimport!`, 'success');
    }});
};

window.clearDataSiswa = function() { if (confirm('Hapus semua?')) { dataSiswa = []; localStorage.removeItem('sim_siswa'); renderTabelSiswa(); updateStats(); } };

window.renderTabelSiswa = function() {
    const filter = document.getElementById('filterKelasSiswa').value;
    let opts = '<option value="ALL">Semua</option>';
    new Set(dataSiswa.map(s => s.rombel)).forEach(r => opts += `<option value="${r}" ${filter===r?'selected':''}>${r}</option>`);
    document.getElementById('filterKelasSiswa').innerHTML = opts;
    const filtered = filter === 'ALL' ? dataSiswa : dataSiswa.filter(s => s.rombel === filter);
    document.getElementById('tabelSiswaBody').innerHTML = filtered.length ? filtered.map(s => `<tr><td>${s.nisn}</td><td>${s.nama}</td><td>${s.jk}</td><td>${s.kelas}</td><td>${s.rombel}</td></tr>`).join('') : '<tr><td colspan="5" class="text-center py-4">Tidak ada data</td></tr>';
};

// ==========================================
// DROPDOWNS
// ==========================================
function populateDropdowns() {
    let oj = '<option value="">Pilih</option>';
    dataJadwal.forEach(d => oj += `<option value='${JSON.stringify(d)}'>${d.hari} J${d.jam} - ${d.jenjang} ${d.kelas}${d.rombel}</option>`);
    document.querySelectorAll('#pSelectJadwal, #selectJadwalAbsen').forEach(el => el.innerHTML = oj);
    let ot = '<option value="">Pilih</option>';
    dataCPTP.tps.forEach(t => ot += `<option value="${t.judul}">Bab ${t.bab}: ${t.judul}</option>`);
    document.querySelectorAll('#pSelectTP, #selectTPAbsen').forEach(el => el.innerHTML = ot);
}

function populateFaseRombelOptions(id) {
    let set = new Set(dataJadwal.map(d => `Fase 
