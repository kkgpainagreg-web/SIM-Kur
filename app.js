// ==========================================
// SIM KURIKULUM MERDEKA PRO v2.1
// FIXED - AUTO FASE BY KELAS
// ==========================================

// ============ DATA STATE ============
var dataSiswa = JSON.parse(localStorage.getItem('sim_siswa')) || [];
var dataJadwal = JSON.parse(localStorage.getItem('sim_jadwal')) || [];
var dataNilai = JSON.parse(localStorage.getItem('sim_nilai')) || {};
var dataCPTP = JSON.parse(localStorage.getItem('sim_cptp')) || { cp: "", tps: [{bab:1, judul:"Materi Pertama", jp:4}] };
var customHolidays = JSON.parse(localStorage.getItem('sim_holidays')) || [];
var premiumUsers = JSON.parse(localStorage.getItem('sim_premium_users')) || [];
var dataMapel = JSON.parse(localStorage.getItem('sim_mapel')) || [];
var activeMapelId = localStorage.getItem('sim_active_mapel') || null;

// ============ ADMIN & PRICING ============
var DEFAULT_ADMIN = { email: "afifaro@gmail.com", password: "admin123" };
var adminSettings = JSON.parse(localStorage.getItem('sim_admin')) || DEFAULT_ADMIN;
var pricingSettings = JSON.parse(localStorage.getItem('sim_pricing')) || {
    whatsapp: "6281234567890",
    harga: 99000,
    hargaDesc: "Lifetime",
    bank: "BCA",
    rekening: "1234567890",
    namaRek: "Admin"
};

// ============ DEVICE ID ============
var deviceId = localStorage.getItem('sim_device_id');
if (!deviceId) {
    deviceId = 'DEV_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('sim_device_id', deviceId);
}

// ============ CALENDAR STATE ============
var currentMonth = new Date().getMonth();
var currentYear = new Date().getFullYear();

// ============ NATIONAL HOLIDAYS ============
var nationalHolidays = {
    "01-01": "Tahun Baru Masehi",
    "05-01": "Hari Buruh",
    "06-01": "Hari Lahir Pancasila",
    "08-17": "Hari Kemerdekaan RI",
    "12-25": "Hari Natal"
};

// ============ JENJANG CONFIG WITH AUTO FASE ============
var JENJANG_CONFIG = {
    PAUD: {
        kelas: [
            { value: 'Kelompok A', label: 'Kelompok A', fase: 'Fondasi' },
            { value: 'Kelompok B', label: 'Kelompok B', fase: 'Fondasi' },
            { value: 'TK A', label: 'TK A', fase: 'Fondasi' },
            { value: 'TK B', label: 'TK B', fase: 'Fondasi' }
        ]
    },
    SD: {
        kelas: [
            { value: '1', label: 'Kelas 1', fase: 'A' },
            { value: '2', label: 'Kelas 2', fase: 'A' },
            { value: '3', label: 'Kelas 3', fase: 'B' },
            { value: '4', label: 'Kelas 4', fase: 'B' },
            { value: '5', label: 'Kelas 5', fase: 'C' },
            { value: '6', label: 'Kelas 6', fase: 'C' }
        ]
    },
    SMP: {
        kelas: [
            { value: '7', label: 'Kelas 7', fase: 'D' },
            { value: '8', label: 'Kelas 8', fase: 'D' },
            { value: '9', label: 'Kelas 9', fase: 'D' }
        ]
    },
    SMA: {
        kelas: [
            { value: '10', label: 'Kelas 10', fase: 'E' },
            { value: '11', label: 'Kelas 11', fase: 'F' },
            { value: '12', label: 'Kelas 12', fase: 'F' }
        ]
    },
    SMK: {
        kelas: [
            { value: '10', label: 'Kelas 10', fase: 'E' },
            { value: '11', label: 'Kelas 11', fase: 'F' },
            { value: '12', label: 'Kelas 12', fase: 'F' },
            { value: '13', label: 'Kelas 13', fase: 'F' }
        ]
    }
};

// Helper: Get Fase by Jenjang and Kelas
function getFaseByKelas(jenjang, kelas) {
    if (!jenjang || !kelas || !JENJANG_CONFIG[jenjang]) return '-';
    var config = JENJANG_CONFIG[jenjang];
    for (var i = 0; i < config.kelas.length; i++) {
        if (config.kelas[i].value === kelas) {
            return config.kelas[i].fase;
        }
    }
    return '-';
}

// Helper: Get Fase Label
function getFaseLabel(jenjang, fase) {
    var labels = {
        'Fondasi': 'Fase Fondasi (PAUD)',
        'A': 'Fase A (Kelas 1-2)',
        'B': 'Fase B (Kelas 3-4)',
        'C': 'Fase C (Kelas 5-6)',
        'D': 'Fase D (Kelas 7-9)',
        'E': 'Fase E (Kelas 10)',
        'F': 'Fase F (Kelas 11-12)'
    };
    return labels[fase] || 'Fase ' + fase;
}

// ============ INITIALIZATION ============
window.onload = function() {
    // Clean old jadwal data that might have undefined jenjang
    cleanOldJadwalData();
    
    loadProfil();
    renderTabelSiswa();
    renderJadwal();
    renderCPTP();
    renderCalendar();
    renderMapelList();
    updateStats();
    checkPremiumStatus();
    loadPricingDisplay();
    
    var deviceEl = document.getElementById('showDeviceId');
    if (deviceEl) {
        deviceEl.textContent = deviceId.substring(0, 15) + '...';
    }
    updateActiveMapelIndicator();
    console.log('App loaded successfully!');
};

// Clean old jadwal data
function cleanOldJadwalData() {
    var cleaned = [];
    for (var i = 0; i < dataJadwal.length; i++) {
        var j = dataJadwal[i];
        if (j && j.jenjang && j.kelas) {
            // Ensure fase exists
            if (!j.fase) {
                j.fase = getFaseByKelas(j.jenjang, j.kelas);
            }
            cleaned.push(j);
        }
    }
    dataJadwal = cleaned;
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
}

// ============ NAVIGATION ============
function showTab(tabId) {
    var premiumTabs = ['tabCPTP', 'tabSiswa', 'tabPerangkat', 'tabPelaksanaan', 'tabPenilaian'];
    
    if (premiumTabs.indexOf(tabId) !== -1 && !isPremiumUser()) {
        showUpgradeModal();
        return;
    }
    
    var allTabs = document.querySelectorAll('.tab-content');
    for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.add('d-none');
    }
    
    var allNavs = document.querySelectorAll('.sidebar .nav-link');
    for (var j = 0; j < allNavs.length; j++) {
        allNavs[j].classList.remove('active');
    }
    
    var targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.remove('d-none');
    }
    
    if (event && event.target) {
        var navLink = event.target.closest('.nav-link');
        if (navLink) {
            navLink.classList.add('active');
        }
    }
    
    updateUIProfile();
    
    if (tabId === 'tabCPTP') renderCPTP();
    if (tabId === 'tabTahunan') populateFaseRombelOptions('tFaseRombel');
    if (tabId === 'tabPerangkat' || tabId === 'tabPelaksanaan') populateDropdowns();
    if (tabId === 'tabPenilaian') renderKelasPenilaian();
    if (tabId === 'tabKalender') renderCalendar();
    if (tabId === 'tabAdmin') loadAdminPanel();
    if (tabId === 'tabMapel') renderMapelList();
    if (tabId === 'tabJadwal') renderJadwal();
    
    if (window.innerWidth < 992) {
        var sidebar = document.getElementById('sidebarMenu');
        var overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
    }
}
window.showTab = showTab;

function toggleSidebar() {
    var sidebar = document.getElementById('sidebarMenu');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('show');
    if (overlay) overlay.classList.toggle('show');
}
window.toggleSidebar = toggleSidebar;

// ============ JENJANG FORM UPDATES - AUTO FASE ============
function updateMapelFormByJenjang() {
    var jenjang = document.getElementById('newMapelJenjang').value;
    var kelasSelect = document.getElementById('newMapelKelas');
    var faseDisplay = document.getElementById('newMapelFaseDisplay');
    var faseInput = document.getElementById('newMapelFase');
    
    if (!jenjang || !JENJANG_CONFIG[jenjang]) {
        kelasSelect.innerHTML = '<option value="">Pilih Jenjang Dulu</option>';
        kelasSelect.disabled = true;
        if (faseDisplay) faseDisplay.textContent = '-';
        if (faseInput) faseInput.value = '';
        return;
    }
    
    var config = JENJANG_CONFIG[jenjang];
    
    var kelasOpts = '<option value="">-- Pilih Kelas --</option>';
    for (var j = 0; j < config.kelas.length; j++) {
        kelasOpts += '<option value="' + config.kelas[j].value + '" data-fase="' + config.kelas[j].fase + '">' + config.kelas[j].label + '</option>';
    }
    kelasSelect.innerHTML = kelasOpts;
    kelasSelect.disabled = false;
    
    if (faseDisplay) faseDisplay.textContent = '-';
    if (faseInput) faseInput.value = '';
}
window.updateMapelFormByJenjang = updateMapelFormByJenjang;

function updateMapelFaseByKelas() {
    var jenjang = document.getElementById('newMapelJenjang').value;
    var kelas = document.getElementById('newMapelKelas').value;
    var faseDisplay = document.getElementById('newMapelFaseDisplay');
    var faseInput = document.getElementById('newMapelFase');
    
    var fase = getFaseByKelas(jenjang, kelas);
    
    if (faseDisplay) faseDisplay.textContent = fase ? getFaseLabel(jenjang, fase) : '-';
    if (faseInput) faseInput.value = fase;
}
window.updateMapelFaseByKelas = updateMapelFaseByKelas;

function updateJadwalDropdowns() {
    var jenjang = document.getElementById('jadwalJenjang').value;
    var kelasSelect = document.getElementById('jadwalKelas');
    var faseDisplay = document.getElementById('jadwalFaseDisplay');
    var faseInput = document.getElementById('jadwalFase');
    
    if (!jenjang || !JENJANG_CONFIG[jenjang]) {
        kelasSelect.innerHTML = '<option value="">Pilih Jenjang</option>';
        kelasSelect.disabled = true;
        if (faseDisplay) faseDisplay.textContent = '-';
        if (faseInput) faseInput.value = '';
        return;
    }
    
    var config = JENJANG_CONFIG[jenjang];
    
    var kelasOpts = '<option value="">-- Pilih Kelas --</option>';
    for (var j = 0; j < config.kelas.length; j++) {
        kelasOpts += '<option value="' + config.kelas[j].value + '" data-fase="' + config.kelas[j].fase + '">' + config.kelas[j].label + '</option>';
    }
    kelasSelect.innerHTML = kelasOpts;
    kelasSelect.disabled = false;
    
    if (faseDisplay) faseDisplay.textContent = '-';
    if (faseInput) faseInput.value = '';
}
window.updateJadwalDropdowns = updateJadwalDropdowns;

function updateJadwalFaseByKelas() {
    var jenjang = document.getElementById('jadwalJenjang').value;
    var kelas = document.getElementById('jadwalKelas').value;
    var faseDisplay = document.getElementById('jadwalFaseDisplay');
    var faseInput = document.getElementById('jadwalFase');
    
    var fase = getFaseByKelas(jenjang, kelas);
    
    if (faseDisplay) faseDisplay.textContent = fase ? 'Fase ' + fase : '-';
    if (faseInput) faseInput.value = fase;
}
window.updateJadwalFaseByKelas = updateJadwalFaseByKelas;

// ============ JADWAL VALIDATION ============
function validateJadwal(newJadwal) {
    var conflicts = [];
    var MAX_ROMBEL = 2;
    
    for (var i = 0; i < dataJadwal.length; i++) {
        var j = dataJadwal[i];
        if (j.hari === newJadwal.hari && j.jam === newJadwal.jam && j.kelas === newJadwal.kelas && j.rombel === newJadwal.rombel && j.jenjang === newJadwal.jenjang) {
            conflicts.push({ type: 'duplicate', message: 'Jadwal sama sudah ada' });
            break;
        }
    }
    
    var count = 0;
    for (var k = 0; k < dataJadwal.length; k++) {
        if (dataJadwal[k].hari === newJadwal.hari && dataJadwal[k].jam === newJadwal.jam) {
            count++;
        }
    }
    if (count >= MAX_ROMBEL) {
        conflicts.push({ type: 'max', message: 'Maksimal ' + MAX_ROMBEL + ' rombel per jam' });
    }
    
    return conflicts;
}

function tambahJadwal() {
    var hari = document.getElementById('jadwalHari').value;
    var jam = document.getElementById('jadwalJam').value;
    var jenjang = document.getElementById('jadwalJenjang').value;
    var kelas = document.getElementById('jadwalKelas').value;
    var rombel = document.getElementById('jadwalRombel').value.trim().toUpperCase() || 'A';
    
    if (!jenjang) { showToast('Pilih Jenjang!', 'warning'); return; }
    if (!kelas) { showToast('Pilih Kelas!', 'warning'); return; }
    
    // Auto get fase from kelas
    var fase = getFaseByKelas(jenjang, kelas);
    
    var newJadwal = { 
        hari: hari, 
        jam: jam, 
        jenjang: jenjang, 
        fase: fase, 
        kelas: kelas, 
        rombel: rombel 
    };
    
    var conflicts = validateJadwal(newJadwal);
    
    if (conflicts.length > 0) {
        var msg = '';
        for (var i = 0; i < conflicts.length; i++) {
            msg += conflicts[i].message + '. ';
        }
        showToast('Bentrok: ' + msg, 'danger');
        return;
    }
    
    dataJadwal.push(newJadwal);
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
    renderJadwal();
    updateStats();
    document.getElementById('jadwalRombel').value = '';
    
    // Reset form
    document.getElementById('jadwalJenjang').value = '';
    document.getElementById('jadwalKelas').innerHTML = '<option value="">Pilih Jenjang</option>';
    document.getElementById('jadwalKelas').disabled = true;
    var faseDisplay = document.getElementById('jadwalFaseDisplay');
    if (faseDisplay) faseDisplay.textContent = '-';
    
    showToast('Jadwal ditambahkan!', 'success');
}
window.tambahJadwal = tambahJadwal;

function hapusJadwal(idx) {
    if (!confirm('Hapus jadwal ini?')) return;
    dataJadwal.splice(idx, 1);
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
    renderJadwal();
    updateStats();
}
window.hapusJadwal = hapusJadwal;

function renderJadwal() {
    var html = '';
    if (dataJadwal.length === 0) {
        html = '<tr><td colspan="6" class="text-center py-4">Belum ada jadwal</td></tr>';
    } else {
        for (var i = 0; i < dataJadwal.length; i++) {
            var d = dataJadwal[i];
            // Safe check for undefined values
            var jenjang = d.jenjang || '-';
            var fase = d.fase || '-';
            var kelas = d.kelas || '-';
            var rombel = d.rombel || '-';
            var hari = d.hari || '-';
            var jam = d.jam || '-';
            
            var jenjangClass = jenjang !== '-' ? 'jenjang-' + jenjang.toLowerCase() : '';
            
            html += '<tr>';
            html += '<td>' + hari + '</td>';
            html += '<td>Jam ' + jam + '</td>';
            html += '<td><span class="jenjang-badge ' + jenjangClass + '">' + jenjang + '</span></td>';
            html += '<td>' + kelas + rombel + '</td>';
            html += '<td><span class="badge bg-info">Fase ' + fase + '</span></td>';
            html += '<td><button class="btn btn-sm btn-danger py-0 px-2" onclick="hapusJadwal(' + i + ')"><i class="fas fa-trash"></i></button></td>';
            html += '</tr>';
        }
    }
    document.getElementById('tabelJadwalBody').innerHTML = html;
}

function showJadwalMatrix() {
    var view = document.getElementById('jadwalMatrixView');
    view.classList.toggle('d-none');
    if (!view.classList.contains('d-none')) {
        renderJadwalMatrix();
    }
}
window.showJadwalMatrix = showJadwalMatrix;

function renderJadwalMatrix() {
    var days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var html = '<thead class="table-dark"><tr><th>Jam</th>';
    for (var d = 0; d < days.length; d++) {
        html += '<th>' + days[d] + '</th>';
    }
    html += '</tr></thead><tbody>';
    
    for (var h = 1; h <= 10; h++) {
        html += '<tr><td class="fw-bold">Jam ' + h + '</td>';
        for (var dd = 0; dd < days.length; dd++) {
            var cellContent = '';
            var count = 0;
            for (var jj = 0; jj < dataJadwal.length; jj++) {
                var jadwal = dataJadwal[jj];
                if (jadwal.hari === days[dd] && parseInt(jadwal.jam) === h) {
                    var jenjang = jadwal.jenjang || '-';
                    var kelas = jadwal.kelas || '';
                    var rombel = jadwal.rombel || '';
                    cellContent += '<div class="jadwal-item">' + jenjang + ' ' + kelas + rombel + '</div>';
                    count++;
                }
            }
            html += '<td class="jadwal-cell">' + cellContent;
            if (count >= 2) {
                html += '<span class="badge bg-danger" style="font-size:0.6rem;">PENUH</span>';
            }
            html += '</td>';
        }
        html += '</tr>';
    }
    html += '</tbody>';
    document.getElementById('jadwalMatrixTable').innerHTML = html;
}

// ============ MAPEL MANAGEMENT ============
function showAddMapelModal() {
    document.getElementById('newMapelJenjang').value = '';
    document.getElementById('newMapelNama').value = '';
    document.getElementById('newMapelKelas').innerHTML = '<option value="">Pilih Jenjang Dulu</option>';
    document.getElementById('newMapelKelas').disabled = true;
    var faseDisplay = document.getElementById('newMapelFaseDisplay');
    if (faseDisplay) faseDisplay.textContent = '-';
    var faseInput = document.getElementById('newMapelFase');
    if (faseInput) faseInput.value = '';
    
    var modal = new bootstrap.Modal(document.getElementById('addMapelModal'));
    modal.show();
}
window.showAddMapelModal = showAddMapelModal;

function simpanMapelBaru() {
    var jenjang = document.getElementById('newMapelJenjang').value;
    var nama = document.getElementById('newMapelNama').value.trim();
    var kelas = document.getElementById('newMapelKelas').value;
    
    if (!jenjang) { showToast('Pilih Jenjang!', 'warning'); return; }
    if (!nama) { showToast('Isi Nama Mapel!', 'warning'); return; }
    if (!kelas) { showToast('Pilih Kelas!', 'warning'); return; }
    
    // Auto get fase
    var fase = getFaseByKelas(jenjang, kelas);
    
    var newMapel = {
        id: 'MAPEL_' + Date.now(),
        jenjang: jenjang,
        nama: nama,
        kelas: kelas,
        fase: fase
    };
    
    dataMapel.push(newMapel);
    localStorage.setItem('sim_mapel', JSON.stringify(dataMapel));
    
    if (dataMapel.length === 1) {
        activeMapelId = newMapel.id;
        localStorage.setItem('sim_active_mapel', activeMapelId);
    }
    
    bootstrap.Modal.getInstance(document.getElementById('addMapelModal')).hide();
    renderMapelList();
    updateStats();
    showToast('Mapel ditambahkan!', 'success');
}
window.simpanMapelBaru = simpanMapelBaru;

function setActiveMapel(id) {
    activeMapelId = id;
    localStorage.setItem('sim_active_mapel', id);
    renderMapelList();
    updateActiveMapelIndicator();
    showToast('Mapel aktif diubah!', 'success');
}
window.setActiveMapel = setActiveMapel;

function hapusMapel(id) {
    if (!confirm('Hapus mapel ini?')) return;
    dataMapel = dataMapel.filter(function(m) { return m.id !== id; });
    localStorage.setItem('sim_mapel', JSON.stringify(dataMapel));
    if (activeMapelId === id) {
        activeMapelId = dataMapel.length > 0 ? dataMapel[0].id : null;
        localStorage.setItem('sim_active_mapel', activeMapelId);
    }
    renderMapelList();
    updateActiveMapelIndicator();
    updateStats();
}
window.hapusMapel = hapusMapel;

function filterMapelByJenjang(jenjang) {
    var btns = document.querySelectorAll('#filterJenjangBtns .btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        if ((jenjang === 'ALL' && btns[i].textContent === 'Semua') || btns[i].textContent === jenjang) {
            btns[i].classList.add('active');
        }
    }
    renderMapelList(jenjang);
}
window.filterMapelByJenjang = filterMapelByJenjang;

function renderMapelList(filter) {
    filter = filter || 'ALL';
    var container = document.getElementById('mapelList');
    var filtered = filter === 'ALL' ? dataMapel : dataMapel.filter(function(m) { return m.jenjang === filter; });
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="fas fa-book fa-4x mb-3 opacity-25"></i><p>Belum ada mapel.</p><button class="btn btn-gradient-primary" onclick="showAddMapelModal()"><i class="fas fa-plus me-2"></i>Tambah</button></div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var m = filtered[i];
        var isActive = m.id === activeMapelId;
        var jenjangClass = m.jenjang ? 'jenjang-' + m.jenjang.toLowerCase() : '';
        
        html += '<div class="col-md-4 col-sm-6">';
        html += '<div class="mapel-card ' + (isActive ? 'active' : '') + '" onclick="setActiveMapel(\'' + m.id + '\')">';
        html += '<div class="d-flex justify-content-between mb-2">';
        html += '<span class="jenjang-badge ' + jenjangClass + '">' + (m.jenjang || '-') + '</span>';
        if (isActive) html += '<span class="badge bg-primary"><i class="fas fa-check"></i></span>';
        html += '</div>';
        html += '<h6 class="fw-bold mb-1">' + m.nama + '</h6>';
        html += '<small class="text-muted">Kelas ' + (m.kelas || '-') + ' • Fase ' + (m.fase || '-') + '</small>';
        html += '<div class="mt-3 d-flex gap-2">';
        html += '<button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); hapusMapel(\'' + m.id + '\')"><i class="fas fa-trash"></i></button>';
        html += '</div></div></div>';
    }
    container.innerHTML = html;
}

function updateActiveMapelIndicator() {
    var indicator = document.getElementById('activeMapelIndicator');
    var nameEl = document.getElementById('activeMapelName');
    if (activeMapelId) {
        var mapel = dataMapel.find(function(m) { return m.id === activeMapelId; });
        if (mapel) {
            nameEl.textContent = mapel.nama + ' - ' + (mapel.jenjang || '') + ' Kelas ' + (mapel.kelas || '');
            indicator.style.display = 'block';
            return;
        }
    }
    indicator.style.display = 'none';
}

function getActiveMapelName() {
    if (activeMapelId) {
        var mapel = dataMapel.find(function(m) { return m.id === activeMapelId; });
        if (mapel) return mapel.nama;
    }
    return 'Mata Pelajaran';
}

// ============ PREMIUM SYSTEM ============
function isPremiumUser() {
    return premiumUsers.indexOf(deviceId) !== -1;
}

function checkPremiumStatus() {
    var badge = document.getElementById('userStatusBadge');
    var banner = document.getElementById('upgradeBanner');
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

function showUpgradeModal() {
    loadPricingDisplay();
    var modal = new bootstrap.Modal(document.getElementById('upgradeModal'));
    modal.show();
}
window.showUpgradeModal = showUpgradeModal;

function loadPricingDisplay() {
    document.getElementById('displayPrice').textContent = 'Rp ' + Number(pricingSettings.harga).toLocaleString('id-ID');
    document.getElementById('displayPriceDesc').textContent = pricingSettings.hargaDesc;
    document.getElementById('displayBank').textContent = pricingSettings.bank;
    document.getElementById('displayRekening').textContent = pricingSettings.rekening;
    document.getElementById('displayNamaRek').textContent = pricingSettings.namaRek;
    document.getElementById('waUpgradeBtn').href = 'https://wa.me/' + pricingSettings.whatsapp + '?text=' + encodeURIComponent('Halo, saya mau upgrade SIM Kurikulum. Device ID: ' + deviceId);
}

function checkPremiumAndPrint(docId, name, orientation) {
    if (!isPremiumUser()) {
        showUpgradeModal();
        return;
    }
    triggerPrint(docId, name, orientation);
}
window.checkPremiumAndPrint = checkPremiumAndPrint;

// ============ ADMIN PANEL ============
function showAdminLogin() {
    var modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    modal.show();
}
window.showAdminLogin = showAdminLogin;

function loginAdmin() {
    var email = document.getElementById('adminEmail').value;
    var password = document.getElementById('adminPassword').value;
    if (email === adminSettings.email && password === adminSettings.password) {
        localStorage.setItem('sim_admin_logged', 'true');
        bootstrap.Modal.getInstance(document.getElementById('adminLoginModal')).hide();
        showTab('tabAdmin');
        showToast('Login berhasil!', 'success');
    } else {
        showToast('Login gagal!', 'danger');
    }
}
window.loginAdmin = loginAdmin;

function logoutAdmin() {
    localStorage.removeItem('sim_admin_logged');
    showTab('tabDashboard');
    showToast('Logout berhasil!', 'info');
}
window.logoutAdmin = logoutAdmin;

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

function simpanAdminSettings() {
    adminSettings.email = document.getElementById('adminEmailSetting').value;
    var pwd = document.getElementById('adminPasswordSetting').value;
    if (pwd.trim()) adminSettings.password = pwd;
    localStorage.setItem('sim_admin', JSON.stringify(adminSettings));
    showToast('Tersimpan!', 'success');
}
window.simpanAdminSettings = simpanAdminSettings;

function simpanPricingSettings() {
    pricingSettings.whatsapp = document.getElementById('settingWA').value;
    pricingSettings.harga = document.getElementById('settingHarga').value;
    pricingSettings.hargaDesc = document.getElementById('settingHargaDesc').value;
    pricingSettings.bank = document.getElementById('settingBank').value;
    pricingSettings.rekening = document.getElementById('settingRekening').value;
    pricingSettings.namaRek = document.getElementById('settingNamaRek').value;
    localStorage.setItem('sim_pricing', JSON.stringify(pricingSettings));
    showToast('Tersimpan!', 'success');
}
window.simpanPricingSettings = simpanPricingSettings;

function addPremiumUser() {
    var id = document.getElementById('newPremiumUser').value.trim();
    if (!id) { showToast('Masukkan ID!', 'warning'); return; }
    if (premiumUsers.indexOf(id) === -1) {
        premiumUsers.push(id);
        localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
        document.getElementById('newPremiumUser').value = '';
        renderPremiumUsers();
        checkPremiumStatus();
        showToast('Ditambahkan!', 'success');
    }
}
window.addPremiumUser = addPremiumUser;

function activateCurrentDevice() {
    if (premiumUsers.indexOf(deviceId) === -1) {
        premiumUsers.push(deviceId);
        localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
        renderPremiumUsers();
        checkPremiumStatus();
        showToast('Device Premium!', 'success');
    }
}
window.activateCurrentDevice = activateCurrentDevice;

function removePremiumUser(id) {
    premiumUsers = premiumUsers.filter(function(u) { return u !== id; });
    localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
    renderPremiumUsers();
    checkPremiumStatus();
}
window.removePremiumUser = removePremiumUser;

function renderPremiumUsers() {
    var tbody = document.getElementById('premiumUsersList');
    if (premiumUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Belum ada</td></tr>';
        return;
    }
    var html = '';
    for (var i = 0; i < premiumUsers.length; i++) {
        var u = premiumUsers[i];
        var isCurrent = u === deviceId ? ' <span class="badge bg-success">Ini</span>' : '';
        html += '<tr><td>' + (i+1) + '</td><td><small>' + u + isCurrent + '</small></td>';
        html += '<td><button class="btn btn-sm btn-danger py-0" onclick="removePremiumUser(\'' + u + '\')"><i class="fas fa-times"></i></button></td></tr>';
    }
    tbody.innerHTML = html;
}

// ============ CALENDAR ============
function renderCalendar() {
    var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    document.getElementById('calendarTitle').textContent = months[currentMonth] + ' ' + currentYear;
    
    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var today = new Date();
    
    var html = '';
    var dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (var dh = 0; dh < dayHeaders.length; dh++) {
        html += '<div class="calendar-day-header">' + dayHeaders[dh] + '</div>';
    }
    
    for (var e = 0; e < firstDay; e++) {
        html += '<div class="calendar-day" style="opacity:0.2;"></div>';
    }
    
    for (var day = 1; day <= daysInMonth; day++) {
        var dateStr = String(currentMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        var fullDate = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        var cls = 'calendar-day';
        var name = '';
        
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            cls += ' today';
        }
        if (nationalHolidays[dateStr]) {
            cls += ' holiday';
            name = nationalHolidays[dateStr];
        }
        for (var ch = 0; ch < customHolidays.length; ch++) {
            if (customHolidays[ch].date === fullDate) {
                cls += ' holiday-custom';
                name = customHolidays[ch].name;
            }
        }
        
        html += '<div class="' + cls + '" onclick="showHolidayInfo(\'' + fullDate + '\',\'' + (name || '') + '\')" title="' + (name || '') + '">' + day;
        if (name) html += '<div class="holiday-dot"></div>';
        html += '</div>';
    }
    
    document.getElementById('calendarGrid').innerHTML = html;
    renderHolidayList();
}

function changeMonth(d) {
    currentMonth += d;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}
window.changeMonth = changeMonth;

function showHolidayInfo(date, name) {
    if (name) showToast(date + ': ' + name, 'info');
}
window.showHolidayInfo = showHolidayInfo;

function addCustomHoliday() {
    var date = document.getElementById('customHolidayDate').value;
    var name = document.getElementById('customHolidayName').value.trim();
    if (!date || !name) { showToast('Lengkapi data!', 'warning'); return; }
    
    var exists = false;
    for (var i = 0; i < customHolidays.length; i++) {
        if (customHolidays[i].date === date) { exists = true; break; }
    }
    
    if (!exists) {
        customHolidays.push({ date: date, name: name });
        localStorage.setItem('sim_holidays', JSON.stringify(customHolidays));
        document.getElementById('customHolidayDate').value = '';
        document.getElementById('customHolidayName').value = '';
        renderCalendar();
        showToast('Ditambahkan!', 'success');
    } else {
        showToast('Sudah ada!', 'warning');
    }
}
window.addCustomHoliday = addCustomHoliday;

function removeCustomHoliday(date) {
    customHolidays = customHolidays.filter(function(h) { return h.date !== date; });
    localStorage.setItem('sim_holidays', JSON.stringify(customHolidays));
    renderCalendar();
}
window.removeCustomHoliday = removeCustomHoliday;

function renderHolidayList() {
    var html = '<h6 class="fw-bold mb-2 text-danger small">Libur Nasional</h6>';
    for (var key in nationalHolidays) {
        html += '<div class="small p-2 bg-light rounded mb-1">' + nationalHolidays[key] + ' (' + key + ')</div>';
    }
    html += '<hr><h6 class="fw-bold mb-2 text-success small">Libur Kustom</h6>';
    if (customHolidays.length === 0) {
        html += '<p class="text-muted small">Belum ada</p>';
    } else {
        for (var i = 0; i < customHolidays.length; i++) {
            var h = customHolidays[i];
            html += '<div class="d-flex justify-content-between small p-2 bg-light rounded mb-1">';
            html += '<span>' + h.name + '<br><small class="text-muted">' + h.date + '</small></span>';
            html += '<button class="btn btn-sm btn-outline-danger py-0" onclick="removeCustomHoliday(\'' + h.date + '\')"><i class="fas fa-times"></i></button></div>';
        }
    }
    document.getElementById('holidayList').innerHTML = html;
}

// ============ STATISTICS ============
function updateStats() {
    document.getElementById('statMapel').textContent = dataMapel.length;
    document.getElementById('statSiswa').textContent = dataSiswa.length;
    document.getElementById('statJadwal').textContent = dataJadwal.length;
    document.getElementById('statTP').textContent = dataCPTP.tps.length;
}

// ============ PROFILE ============
function simpanProfil() {
    var p = {
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
}
window.simpanProfil = simpanProfil;

function loadProfil() {
    var p = JSON.parse(localStorage.getItem('sim_prof'));
    if (p) {
        var el = document.getElementById('profJenjang');
        if (el) el.value = p.jenjang || 'SD';
        document.getElementById('profNpsn').value = p.npsn || '';
        document.getElementById('profSekolah').value = p.sek || '';
        el = document.getElementById('profAlamat');
        if (el) el.value = p.alamat || '';
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
    var p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    var mapelName = getActiveMapelName();
    var els;
    
    els = document.querySelectorAll('.vMapel');
    for (var i = 0; i < els.length; i++) els[i].innerText = mapelName;
    
    els = document.querySelectorAll('.vSekolah');
    for (i = 0; i < els.length; i++) els[i].innerText = p.sek || '...';
    
    els = document.querySelectorAll('.vTahun');
    for (i = 0; i < els.length; i++) els[i].innerText = p.thn || '...';
    
    els = document.querySelectorAll('.vKepsek');
    for (i = 0; i < els.length; i++) els[i].innerText = p.kep || '...';
    
    els = document.querySelectorAll('.vNipKepsek');
    for (i = 0; i < els.length; i++) els[i].innerText = p.nkep || '...';
    
    els = document.querySelectorAll('.vGuru');
    for (i = 0; i < els.length; i++) els[i].innerText = p.gur || '...';
    
    els = document.querySelectorAll('.vNipGuru');
    for (i = 0; i < els.length; i++) els[i].innerText = p.ngur || '...';
    
    els = document.querySelectorAll('.vTanggal');
    for (i = 0; i < els.length; i++) els[i].innerText = p.tgl || '...';
}

// ============ CP & TP ============
function renderCPTP() {
    document.getElementById('inputCP').value = dataCPTP.cp;
    var html = '';
    for (var i = 0; i < dataCPTP.tps.length; i++) {
        var tp = dataCPTP.tps[i];
        html += '<tr>';
        html += '<td><input type="number" class="form-control form-control-sm tp-bab" value="' + tp.bab + '"></td>';
        html += '<td><input type="text" class="form-control form-control-sm tp-judul" value="' + tp.judul + '"></td>';
        html += '<td><input type="number" class="form-control form-control-sm tp-jp" value="' + tp.jp + '"></td>';
        html += '<td><button class="btn btn-sm btn-outline-danger" onclick="hapusTP(' + i + ')"><i class="fas fa-trash"></i></button></td>';
        html += '</tr>';
    }
    document.getElementById('bodyInputTP').innerHTML = html;
}

function tambahBarisTP() {
    dataCPTP.tps.push({ bab: dataCPTP.tps.length + 1, judul: "", jp: 4 });
    renderCPTP();
}
window.tambahBarisTP = tambahBarisTP;

function hapusTP(i) {
    dataCPTP.tps.splice(i, 1);
    renderCPTP();
}
window.hapusTP = hapusTP;

function simpanCPTP() {
    dataCPTP.cp = document.getElementById('inputCP').value;
    dataCPTP.tps = [];
    var babs = document.querySelectorAll('.tp-bab');
    var juduls = document.querySelectorAll('.tp-judul');
    var jps = document.querySelectorAll('.tp-jp');
    for (var i = 0; i < babs.length; i++) {
        if (juduls[i].value.trim()) {
            dataCPTP.tps.push({ bab: babs[i].value, judul: juduls[i].value, jp: jps[i].value });
        }
    }
    localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
    updateStats();
    showToast('Tersimpan!', 'success');
}
window.simpanCPTP = simpanCPTP;

function loadDefaultPAI() {
    if (typeof dbKurikulumPAI === 'undefined') {
        showToast('File data_default.js tidak ditemukan!', 'danger');
        return;
    }
    var kls = document.getElementById('loadDefaultKls').value;
    var d = dbKurikulumPAI[kls];
    if (d) {
        dataCPTP = { cp: d.cp, tps: d.tps };
        localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
        renderCPTP();
        updateStats();
        showToast('Dimuat!', 'success');
    }
}
window.loadDefaultPAI = loadDefaultPAI;

// ============ STUDENTS ============
function importSiswaLokal() {
    var file = document.getElementById('fileCsvSiswa').files[0];
    if (!file) { showToast('Pilih file!', 'warning'); return; }
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            var count = 0;
            for (var i = 0; i < results.data.length; i++) {
                var s = results.data[i];
                var nama = s.nama || s.Nama;
                var kelas = s.kelas || s.Kelas;
                var rombel = s.rombel || s.Rombel;
                if (nama && kelas && rombel) {
                    dataSiswa.push({
                        nisn: s.nisn || s.NISN || '-',
                        nama: nama,
                        jk: s.jk || s.JK || '-',
                        kelas: kelas,
                        rombel: rombel
                    });
                    count++;
                }
            }
            localStorage.setItem('sim_siswa', JSON.stringify(dataSiswa));
            renderTabelSiswa();
            updateStats();
            showToast(count + ' siswa diimport!', 'success');
        }
    });
}
window.importSiswaLokal = importSiswaLokal;

function clearDataSiswa() {
    if (confirm('Hapus semua?')) {
        dataSiswa = [];
        localStorage.removeItem('sim_siswa');
        renderTabelSiswa();
        updateStats();
    }
}
window.clearDataSiswa = clearDataSiswa;

function renderTabelSiswa() {
    var filterEl = document.getElementById('filterKelasSiswa');
    var filter = filterEl ? filterEl.value : 'ALL';
    
    var rombelSet = {};
    for (var i = 0; i < dataSiswa.length; i++) {
        rombelSet[dataSiswa[i].rombel] = true;
    }
    
    var opts = '<option value="ALL">Semua</option>';
    for (var r in rombelSet) {
        opts += '<option value="' + r + '"' + (filter === r ? ' selected' : '') + '>' + r + '</option>';
    }
    if (filterEl) filterEl.innerHTML = opts;
    
    var filtered = [];
    for (var j = 0; j < dataSiswa.length; j++) {
        if (filter === 'ALL' || dataSiswa[j].rombel === filter) {
            filtered.push(dataSiswa[j]);
        }
    }
    
    var html = '';
    if (filtered.length === 0) {
        html = '<tr><td colspan="5" class="text-center py-4">Tidak ada data</td></tr>';
    } else {
        for (var k = 0; k < filtered.length; k++) {
            var s = filtered[k];
            html += '<tr><td>' + s.nisn + '</td><td>' + s.nama + '</td><td>' + s.jk + '</td><td>' + s.kelas + '</td><td>' + s.rombel + '</td></tr>';
        }
    }
    document.getElementById('tabelSiswaBody').innerHTML = html;
}
window.renderTabelSiswa = renderTabelSiswa;

// ============ DROPDOWNS ============
function populateDropdowns() {
    var oj = '<option value="">Pilih</option>';
    for (var i = 0; i < dataJadwal.length; i++) {
        var d = dataJadwal[i];
        var label = (d.hari || '') + ' J' + (d.jam || '') + ' - ' + (d.jenjang || '') + ' ' + (d.kelas || '') + (d.rombel || '');
        oj += '<option value=\'' + JSON.stringify(d) + '\'>' + label + '</option>';
    }
    var els = document.querySelectorAll('#pSelectJadwal, #selectJadwalAbsen');
    for (var j = 0; j < els.length; j++) els[j].innerHTML = oj;
    
    var ot = '<option value="">Pilih</option>';
    for (var k = 0; k < dataCPTP.tps.length; k++) {
        var t = dataCPTP.tps[k];
        ot += '<option value="' + t.judul + '">Bab ' + t.bab + ': ' + t.judul + '</option>';
    }
    els = document.querySelectorAll('#pSelectTP, #selectTPAbsen');
    for (var l = 0; l < els.length; l++) els[l].innerHTML = ot;
}

function populateFaseRombelOptions(id) {
    var setFr = {};
    for (var i = 0; i < dataJadwal.length; i++) {
        var d = dataJadwal[i];
        var key = 'Fase ' + (d.fase || '-') + ' - ' + (d.jenjang || '') + ' ' + (d.kelas || '') + (d.rombel || '');
        setFr[key] = true;
    }
    var keys = Object.keys(setFr);
    var html = keys.length === 0 ? '<option>Buat jadwal dulu</option>' : '';
    for (var j = 0; j < keys.length; j++) {
        html += '<option value="' + keys[j] + '">' + keys[j] + '</option>';
    }
    document.getElementById(id).innerHTML = html;
}

// ============ DOCUMENT GENERATORS ============
function generateTahunan() {
    var fr = document.getElementById('tFaseRombel').value;
    var p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    var mapel = getActiveMapelName();
    var totalJP = 0;
    
    var atpBody = '';
    for (var i = 0; i < dataCPTP.tps.length; i++) {
        var t = dataCPTP.tps[i];
        totalJP += parseInt(t.jp) || 0;
        atpBody += '<tr><td style="text-align:center;">' + t.bab + '</td><td>' + t.judul + '</td><td style="text-align:center;">' + t.jp + '</td></tr>';
    }
    atpBody += '<tr style="font-weight:bold;"><td colspan="2" style="text-align:right;">Total:</td><td style="text-align:center;">' + totalJP + ' JP</td></tr>';
    
    document.getElementById('docATP').innerHTML = '<div class="doc-header">ALUR TUJUAN PEMBELAJARAN (ATP)</div><table style="width:100%; margin-bottom:15px;"><tr><td>Sekolah: ' + (p.sek||'...') + '</td><td>Mapel: <b>' + mapel + '</b></td></tr><tr><td>Fase: ' + fr + '</td><td>TA: ' + (p.thn||'...') + '</td></tr></table><p><b>CP:</b> ' + dataCPTP.cp + '</p><table class="doc-table"><thead><tr><th>Bab</th><th>Tujuan Pembelajaran</th><th>JP</th></tr></thead><tbody>' + atpBody + '</tbody></table><div style="display:flex;justify-content:space-between;margin-top:40px;"><div style="width:45%;text-align:center;">Kepala Sekolah<br><br><br><br><u><b>' + (p.kep||'...') + '</b></u><br>NIP. ' + (p.nkep||'...') + '</div><div style="width:45%;text-align:center;">' + (p.tgl||'...') + '<br>Guru ' + mapel + '<br><br><br><br><u><b>' + (p.gur||'...') + '</b></u><br>NIP. ' + (p.ngur||'...') + '</div></div>';
    
    var protaBody = '';
    for (var j = 0; j < dataCPTP.tps.length; j++) {
        var sem = j < dataCPTP.tps.length / 2 ? 'Ganjil' : 'Genap';
        protaBody += '<tr><td style="text-align:center;">' + sem + '</td><td>Bab ' + dataCPTP.tps[j].bab + ' - ' + dataCPTP.tps[j].judul + '</td><td style="text-align:center;">' + dataCPTP.tps[j].jp + '</td><td>Sesuai Kalender</td></tr>';
    }
    
    document.getElementById('docProta').innerHTML = '<div class="doc-header">PROGRAM TAHUNAN (PROTA)</div><table style="width:100%; margin-bottom:15px;"><tr><td>Mapel: <b>' + mapel + '</b></td><td>Fase: ' + fr + '</td></tr></table><table class="doc-table"><thead><tr><th>Semester</th><th>Tujuan Pembelajaran</th><th>JP</th><th>Ket</th></tr></thead><tbody>' + protaBody + '</tbody></table><div style="display:flex;justify-content:space-between;margin-top:40px;"><div style="width:45%;text-align:center;">Kepala Sekolah<br><br><br><br><u><b>' + (p.kep||'...') + '</b></u></div><div style="width:45%;text-align:center;">Guru ' + mapel + '<br><br><br><br><u><b>' + (p.gur||'...') + '</b></u></div></div>';
    
    var weekCounter = 0;
    var promesBody = '';
    for (var k = 0; k < dataCPTP.tps.length; k++) {
        var weeks = Math.ceil((parseInt(dataCPTP.tps[k].jp) || 0) / 2);
        var cells = '';
        for (var w = 0; w < 24; w++) {
            cells += (w >= weekCounter && w < weekCounter + weeks) ? '<td style="text-align:center;background:#d4edda;">✓</td>' : '<td></td>';
        }
        weekCounter += weeks;
        promesBody += '<tr><td style="text-align:left;font-size:8pt;">Bab ' + dataCPTP.tps[k].bab + ': ' + dataCPTP.tps[k].judul + '</td><td style="text-align:center;">' + dataCPTP.tps[k].jp + '</td>' + cells + '</tr>';
    }
    
    document.getElementById('docPromes').innerHTML = '<div class="doc-header">PROGRAM SEMESTER (PROMES)</div><table style="width:100%;margin-bottom:10px;font-size:10pt;"><tr><td>Sekolah: ' + (p.sek||'...') + '</td><td>Mapel: ' + mapel + '</td><td>Fase: ' + fr + '</td></tr></table><table class="doc-table" style="font-size:8pt;"><thead><tr><th rowspan="2">Materi</th><th rowspan="2">JP</th><th colspan="4">Jul</th><th colspan="4">Ags</th><th colspan="4">Sep</th><th colspan="4">Okt</th><th colspan="4">Nov</th><th colspan="4">Des</th></tr><tr><th>1</th><th>2</th><th>3</th><th>4</th><th>1</th><th>2</th><th>3</th><th>4</th><th>1</th><th>2</th><th>3</th><th>4</th><th>1</th><th>2</th><th>3</th><th>4</th><th>1</th><th>2</th><th>3</th><th>4</th><th>1</th><th>2</th><th>3</th><th>4</th></tr></thead><tbody>' + promesBody + '</tbody></table>';
    
    showToast('Dokumen siap! Klik Cetak.', 'success');
}
window.generateTahunan = generateTahunan;

function generateModul() {
    var jadwalVal = document.getElementById('pSelectJadwal').value;
    var tp = document.getElementById('pSelectTP').value;
    if (!jadwalVal || !tp) { showToast('Pilih Jadwal & Materi!', 'warning'); return; }
    
    var j = JSON.parse(jadwalVal);
    var p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    var mapel = getActiveMapelName();
    
    document.getElementById('docModul').innerHTML = '<div class="doc-header">MODUL AJAR</div><p><b>A. INFORMASI UMUM</b></p><table style="width:100%;margin-bottom:15px;"><tr><td>Penyusun: <b>' + (p.gur||'...') + '</b></td><td>Instansi: ' + (p.sek||'...') + '</td></tr><tr><td>Mapel: ' + mapel + '</td><td>Kelas: ' + (j.jenjang||'') + ' ' + (j.kelas||'') + (j.rombel||'') + ' (Fase ' + (j.fase||'') + ')</td></tr></table><p><b>B. TUJUAN PEMBELAJARAN</b></p><p>Peserta didik mampu memahami <b>"' + tp + '"</b></p><p><b>C. KEGIATAN PEMBELAJARAN</b></p><table class="doc-table"><tr><th>Tahap</th><th>Kegiatan</th></tr><tr><td><b>Pendahuluan</b><br>(10 menit)</td><td>Salam, doa, apersepsi</td></tr><tr><td><b>Inti</b><br>(50 menit)</td><td>Penjelasan materi, diskusi, LKPD</td></tr><tr><td><b>Penutup</b><br>(10 menit)</td><td>Kesimpulan, refleksi, doa</td></tr></table><div style="display:flex;justify-content:space-between;margin-top:40px;"><div style="width:45%;text-align:center;">Kepala Sekolah<br><br><br><br><u><b>' + (p.kep||'...') + '</b></u></div><div style="width:45%;text-align:center;">Guru ' + mapel + '<br><br><br><br><u><b>' + (p.gur||'...') + '</b></u></div></div>';
    
    showToast('Modul siap!', 'success');
}
window.generateModul = generateModul;

// ============ ATTENDANCE ============
function loadAbsensi() {
    var jVal = document.getElementById('selectJadwalAbsen').value;
    if (!jVal) { showToast('Pilih Jadwal!', 'warning'); return; }
    var j = JSON.parse(jVal);
    var siswaKelas = dataSiswa.filter(function(s) { 
        return s.kelas === j.kelas || s.rombel === j.rombel || s.rombel === (j.kelas + j.rombel); 
    });
    
    document.getElementById('areaAbsen').classList.remove('d-none');
    
    if (siswaKelas.length === 0) {
        document.getElementById('listSiswaAbsen').innerHTML = '<div class="col-12 text-danger">Tidak ada siswa di kelas ini</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < siswaKelas.length; i++) {
        html += '<div class="col-md-3 col-6"><div class="form-check p-2 border rounded"><input type="checkbox" class="form-check-input absen-check" value="' + siswaKelas[i].nama + '" id="abs' + i + '" checked><label class="form-check-label small" for="abs' + i + '">' + siswaKelas[i].nama + '</label></div></div>';
    }
    document.getElementById('listSiswaAbsen').innerHTML = html;
}
window.loadAbsensi = loadAbsensi;

function simpanJurnal() {
    var jVal = document.getElementById('selectJadwalAbsen').value;
    var materi = document.getElementById('selectTPAbsen').value;
    if (!jVal || !materi) { showToast('Lengkapi data!', 'warning'); return; }
    
    var j = JSON.parse(jVal);
    var p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    var mapel = getActiveMapelName();
    
    var hadir = 0, tidakHadir = [];
    var checks = document.querySelectorAll('.absen-check');
    for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) hadir++;
        else tidakHadir.push(checks[i].value);
    }
    
    var days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    var today = new Date();
    var tgl = days[today.getDay()] + ', ' + today.toLocaleDateString('id-ID');
    
    document.getElementById('docJurnal').innerHTML = '<div class="doc-header">JURNAL PEMBELAJARAN</div><table style="width:60%;margin-bottom:15px;"><tr><td>Sekolah: ' + (p.sek||'...') + '</td></tr><tr><td>Mapel: ' + mapel + '</td></tr><tr><td>Guru: ' + (p.gur||'...') + '</td></tr></table><table class="doc-table" style="text-align:center;"><thead><tr><th>Tanggal</th><th>Kelas</th><th>Materi</th><th>Absensi</th></tr></thead><tbody><tr><td>' + tgl + '</td><td>' + (j.jenjang||'') + ' ' + (j.kelas||'') + (j.rombel||'') + '</td><td style="text-align:left;">' + materi + '</td><td style="text-align:left;">Hadir: ' + hadir + '<br>Tidak: ' + tidakHadir.length + '</td></tr></tbody></table>';
    
    showToast('Jurnal siap!', 'success');
}
window.simpanJurnal = simpanJurnal;

// ============ PENILAIAN ============
function renderKelasPenilaian() {
    var rombelSet = {};
    for (var i = 0; i < dataSiswa.length; i++) {
        rombelSet[dataSiswa[i].rombel] = true;
    }
    var opts = '<option value="">Pilih</option>';
    for (var r in rombelSet) {
        opts += '<option value="' + r + '">' + r + '</option>';
    }
    document.getElementById('selectKelasNilai').innerHTML = opts;
}
window.renderKelasPenilaian = renderKelasPenilaian;

function loadPenilaian() {
    var rombel = document.getElementById('selectKelasNilai').value;
    if (!rombel) return;
    
    var topik = document.getElementById('topikNilai').value;
    var p = JSON.parse(localStorage.getItem('sim_prof')) || {};
    var mapel = getActiveMapelName();
    var siswa = dataSiswa.filter(function(s) { return s.rombel === rombel; });
    
    var tbody = '';
    if (siswa.length === 0) {
        tbody = '<tr><td colspan="5" class="text-center">Tidak ada siswa</td></tr>';
    } else {
        for (var i = 0; i < siswa.length; i++) {
            var nilai = dataNilai[rombel + '_' + siswa[i].nisn] || '';
            tbody += '<tr><td>' + (i+1) + '</td><td>' + siswa[i].nisn + '</td><td style="text-align:left;">' + siswa[i].nama + '</td><td>' + siswa[i].jk + '</td><td class="no-print"><input type="number" class="form-control form-control-sm input-nilai text-center" data-id="' + siswa[i].nisn + '" value="' + nilai + '" style="width:70px;margin:0 auto;"></td><td class="d-none print-nilai">' + nilai + '</td></tr>';
        }
    }
    
    document.getElementById('docNilai').innerHTML = '<div class="doc-header">DAFTAR NILAI SISWA</div><table style="width:60%;margin-bottom:15px;"><tr><td>Mapel: <b>' + mapel + '</b></td></tr><tr><td>Rombel: <b>' + rombel + '</b></td></tr><tr><td>Topik: <b>' + topik + '</b></td></tr></table><table class="doc-table" style="text-align:center;"><thead><tr><th>No</th><th>NISN</th><th>Nama</th><th>JK</th><th>Nilai</th></tr></thead><tbody>' + tbody + '</tbody></table><style>@media print{.no-print{display:none!important;}.print-nilai{display:table-cell!important;}}</style>';
    
    document.getElementById('docNilai').classList.remove('d-none');
}
window.loadPenilaian = loadPenilaian;

function simpanNilai() {
    var rombel = document.getElementById('selectKelasNilai').value;
    if (!rombel) { showToast('Pilih rombel!', 'warning'); return; }
    var inputs = document.querySelectorAll('.input-nilai');
    for (var i = 0; i < inputs.length; i++) {
        dataNilai[rombel + '_' + inputs[i].getAttribute('data-id')] = inputs[i].value;
    }
    localStorage.setItem('sim_nilai', JSON.stringify(dataNilai));
    showToast('Tersimpan!', 'success');
    loadPenilaian();
}
window.simpanNilai = simpanNilai;

// ============ PRINT ============
function triggerPrint(sourceId, pdfName, orientation) {
    updateUIProfile();
    document.title = pdfName + '_' + Date.now();
    
    var views = document.querySelectorAll('.print-view');
    for (var i = 0; i < views.length; i++) {
        views[i].classList.add('d-none');
        views[i].classList.remove('print-active');
    }
    
    var target = document.getElementById(sourceId);
    if (!target || !target.innerHTML.trim()) {
        showToast('Generate dokumen dulu!', 'warning');
        return;
    }
    
    target.classList.remove('d-none');
    target.classList.add('print-active');
    
    var style = document.getElementById('printOrientationStyle');
    if (!style) {
        style = document.createElement('style');
        style.id = 'printOrientationStyle';
        document.head.appendChild(style);
    }
    style.textContent = '@media print { @page { size: ' + orientation + '; } }';
    
    setTimeout(function() {
        window.print();
        setTimeout(function() { target.classList.remove('print-active'); }, 500);
    }, 300);
}
window.triggerPrint = triggerPrint;

// ============ UTILITIES ============
function copyToClipboard(id) {
    var el = document.getElementById(id);
    el.select();
    navigator.clipboard.writeText(el.value);
    showToast('Disalin!', 'success');
}
window.copyToClipboard = copyToClipboard;

function showToast(message, type) {
    type = type || 'info';
    var existing = document.querySelectorAll('.toast-notification');
    for (var i = 0; i < existing.length; i++) existing[i].remove();
    
    var colors = {
        success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        danger: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
        warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };
    
    var icons = { success: 'fa-check-circle', danger: 'fa-times-circle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' };
    
    var toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = '<i class="fas ' + icons[type] + ' me-2"></i>' + message;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;background:' + colors[type] + ';color:white;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,0.2);z-index:9999;font-weight:500;font-size:0.9rem;max-width:300px;';
    
    document.body.appendChild(toast);
    
    setTimeout(function() { toast.remove(); }, 3000);
}

// ============ EVENT LISTENERS ============
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        showToast('Data tersimpan otomatis!', 'info');
    }
});

window.addEventListener('resize', function() {
    if (window.innerWidth >= 992) {
        var sidebar = document.getElementById('sidebarMenu');
        var overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
    }
});

console.log('SIM Kurikulum Merdeka Pro v2.1 loaded');
console.log('Device ID: ' + deviceId);
