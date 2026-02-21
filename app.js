// ==========================================
// SIM KURIKULUM MERDEKA PRO - MAIN APP JS
// ==========================================

// Data State
let dataSiswa = JSON.parse(localStorage.getItem('sim_siswa')) || [];
let dataJadwal = JSON.parse(localStorage.getItem('sim_jadwal')) || [];
let dataNilai = JSON.parse(localStorage.getItem('sim_nilai')) || {};
let dataCPTP = JSON.parse(localStorage.getItem('sim_cptp')) || { cp: "", tps: [{bab:1, judul:"Materi Pertama", jp:4}] };
let customHolidays = JSON.parse(localStorage.getItem('sim_holidays')) || [];
let premiumUsers = JSON.parse(localStorage.getItem('sim_premium_users')) || [];

// Admin Default Settings
const DEFAULT_ADMIN = {
    email: "afifaro@gmail.com",
    password: "admin123"
};

let adminSettings = JSON.parse(localStorage.getItem('sim_admin')) || DEFAULT_ADMIN;
let pricingSettings = JSON.parse(localStorage.getItem('sim_pricing')) || {
    whatsapp: "6281234567890",
    harga: 99000,
    hargaDesc: "Akses Selamanya / Lifetime",
    bank: "BCA",
    rekening: "1234567890",
    namaRek: "Admin SIM Kurikulum"
};

// Device ID for premium check
let deviceId = localStorage.getItem('sim_device_id');
if (!deviceId) {
    deviceId = 'DEV_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('sim_device_id', deviceId);
}

// Calendar State
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// National Holidays (Fixed dates)
const nationalHolidays = {
    "01-01": "Tahun Baru Masehi",
    "02-01": "Tahun Baru Imlek",
    "03-12": "Hari Raya Nyepi",
    "03-29": "Wafat Isa Al Masih",
    "04-10": "Hari Buruh Internasional",
    "05-01": "Hari Buruh Internasional",
    "05-12": "Hari Raya Waisak",
    "05-29": "Kenaikan Isa Al Masih",
    "06-01": "Hari Lahir Pancasila",
    "08-17": "Hari Kemerdekaan RI",
    "10-05": "Hari Tentara Nasional Indonesia",
    "11-10": "Hari Pahlawan",
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
    updateStats();
    checkPremiumStatus();
    loadPricingDisplay();
};

// ==========================================
// NAVIGATION
// ==========================================
window.showTab = function(tabId) {
    // Check premium for restricted tabs
    const premiumTabs = ['tabCPTP', 'tabSiswa', 'tabPerangkat', 'tabPelaksanaan', 'tabPenilaian'];
    const promesOnly = ['tabTahunan']; // Promes is premium, ATP and Prota are free
    
    if (premiumTabs.includes(tabId) && !isPremiumUser()) {
        showUpgradeModal();
        return;
    }
    
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.remove('d-none');
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    updateUIProfile();
    
    // Tab-specific initializations
    if(tabId === 'tabCPTP') renderCPTP();
    if(tabId === 'tabTahunan') populateFaseRombelOptions('tFaseRombel');
    if(tabId === 'tabPerangkat' || tabId === 'tabPelaksanaan') populateDropdowns();
    if(tabId === 'tabPenilaian') renderKelasPenilaian();
    if(tabId === 'tabKalender') renderCalendar();
    if(tabId === 'tabAdmin') loadAdminPanel();
};

window.toggleSidebar = function() {
    document.getElementById('sidebarMenu').classList.toggle('show');
};

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
        badge.innerHTML = '<i class="fas fa-crown me-1"></i>Premium';
        if (banner) banner.style.display = 'none';
    } else {
        badge.className = 'badge bg-secondary';
        badge.innerHTML = 'Free User';
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
    const waMessage = encodeURIComponent(`Halo, saya ingin upgrade ke SIM Kurikulum Merdeka Pro.\n\nDevice ID: ${deviceId}\n\nMohon informasi lebih lanjut. Terima kasih!`);
    waBtn.href = `https://wa.me/${pricingSettings.whatsapp}?text=${waMessage}`;
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
    const newEmail = document.getElementById('adminEmailSetting').value;
    const newPassword = document.getElementById('adminPasswordSetting').value;
    
    adminSettings.email = newEmail;
    if (newPassword.trim()) {
        adminSettings.password = newPassword;
    }
    
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
    showToast('Pengaturan harga tersimpan!', 'success');
};

window.addPremiumUser = function() {
    const userId = document.getElementById('newPremiumUser').value.trim();
    if (!userId) {
        showToast('Masukkan User ID!', 'warning');
        return;
    }
    
    if (!premiumUsers.includes(userId)) {
        premiumUsers.push(userId);
        localStorage.setItem('sim_premium_users', JSON.stringify(premiumUsers));
        document.getElementById('newPremiumUser').value = '';
        renderPremiumUsers();
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
        showToast('User dihapus!', 'info');
    }
};

function renderPremiumUsers() {
    const tbody = document.getElementById('premiumUsersList');
    if (premiumUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada user premium</td></tr>';
        return;
    }
    
    let html = '';
    premiumUsers.forEach((user, i) => {
        const isCurrentDevice = user === deviceId ? ' <span class="badge bg-success">Device Ini</span>' : '';
        html += `<tr>
            <td>${i+1}</td>
            <td>${user}${isCurrentDevice}</td>
            <td>${new Date().toLocaleDateString('id-ID')}</td>
            <td><button class="btn btn-sm btn-danger" onclick="removePremiumUser('${user}')"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ==========================================
// CALENDAR SYSTEM
// ==========================================
function renderCalendar() {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                       "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    document.getElementById('calendarTitle').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    let html = '';
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day" style="opacity: 0.3;"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const fullDateStr = `${currentYear}-${dateStr}`;
        
        let classes = 'calendar-day';
        let holidayName = '';
        
        // Check if today
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            classes += ' today';
        }
        
        // Check national holiday
        if (nationalHolidays[dateStr]) {
            classes += ' holiday';
            holidayName = nationalHolidays[dateStr];
        }
        
        // Check custom holiday
        const customHoliday = customHolidays.find(h => h.date === fullDateStr);
        if (customHoliday) {
            classes += ' holiday-custom';
            holidayName = customHoliday.name;
        }
        
        html += `<div class="${classes}" onclick="showHolidayInfo('${fullDateStr}', '${holidayName}')" title="${holidayName}">
            ${day}
            ${holidayName ? '<div class="holiday-dot"></div>' : ''}
        </div>`;
    }
    
    document.getElementById('calendarDays').innerHTML = html;
    renderHolidayList();
    updateStats();
}

window.changeMonth = function(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
};

window.showHolidayInfo = function(date, name) {
    if (name) {
        showToast(`${date}: ${name}`, 'info');
    }
};

window.addCustomHoliday = function() {
    const date = document.getElementById('customHolidayDate').value;
    const name = document.getElementById('customHolidayName').value.trim();
    
    if (!date || !name) {
        showToast('Lengkapi tanggal dan nama hari libur!', 'warning');
        return;
    }
    
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
    showToast('Hari libur dihapus!', 'info');
};

function renderHolidayList() {
    const container = document.getElementById('holidayList');
    let html = '<h6 class="fw-bold mb-3 text-danger"><i class="fas fa-flag me-2"></i>Libur Nasional</h6>';
    
    for (const [date, name] of Object.entries(nationalHolidays)) {
        const [month, day] = date.split('-');
        html += `<div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
            <span><small class="text-muted">${day}/${month}</small> ${name}</span>
        </div>`;
    }
    
    html += '<hr><h6 class="fw-bold mb-3 text-success"><i class="fas fa-star me-2"></i>Libur Kustom</h6>';
    
    if (customHolidays.length === 0) {
        html += '<p class="text-muted small">Belum ada hari libur kustom</p>';
    } else {
        customHolidays.forEach(h => {
            html += `<div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <span><small class="text-muted">${h.date}</small><br>${h.name}</span>
                <button class="btn btn-sm btn-outline-danger" onclick="removeCustomHoliday('${h.date}')"><i class="fas fa-times"></i></button>
            </div>`;
        });
    }
    
    container.innerHTML = html;
}

// ==========================================
// STATISTICS
// ==========================================
function updateStats() {
    document.getElementById('statSiswa').textContent = dataSiswa.length;
    document.getElementById('statJadwal').textContent = dataJadwal.length;
    document.getElementById('statTP').textContent = dataCPTP.tps.length;
    document.getElementById('statLibur').textContent = Object.keys(nationalHolidays).length + customHolidays.length;
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================
window.simpanProfil = function() {
    const p = {
        mapel: document.getElementById('profMapel').value,
        npsn: document.getElementById('profNpsn').value,
        sek: document.getElementById('profSekolah').value,
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
        document.getElementById('profMapel').value = p.mapel || '';
        document.getElementById('profNpsn').value = p.npsn || '';
        document.getElementById('profSekolah').value = p.sek || '';
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
    document.querySelectorAll('.vMapel').forEach(e => e.innerText = p.mapel || 'Mata Pelajaran');
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
    dataCPTP.tps.forEach((tp, index) => {
        html += `<tr>
            <td><input type="number" class="form-control tp-bab" value="${tp.bab}"></td>
            <td><input type="text" class="form-control tp-judul" value="${tp.judul}"></td>
            <td><input type="number" class="form-control tp-jp" value="${tp.jp}"></td>
            <td><button class="btn btn-sm btn-outline-danger" onclick="hapusTP(${index})"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    });
    document.getElementById('bodyInputTP').innerHTML = html;
}

window.tambahBarisTP = function() {
    dataCPTP.tps.push({ bab: dataCPTP.tps.length + 1, judul: "", jp: 4 });
    renderCPTP();
};

window.hapusTP = function(index) {
    dataCPTP.tps.splice(index, 1);
    renderCPTP();
};

window.simpanCPTP = function() {
    dataCPTP.cp = document.getElementById('inputCP').value;
    dataCPTP.tps = [];
    const babs = document.querySelectorAll('.tp-bab');
    const juduls = document.querySelectorAll('.tp-judul');
    const jps = document.querySelectorAll('.tp-jp');
    
    for(let i = 0; i < babs.length; i++) {
        if(juduls[i].value.trim() !== "") {
            dataCPTP.tps.push({
                bab: babs[i].value,
                judul: juduls[i].value,
                jp: jps[i].value
            });
        }
    }
    localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
    updateStats();
    showToast('CP & TP tersimpan!', 'success');
};

window.loadDefaultPAI = function() {
    if(typeof dbKurikulumPAI === 'undefined') {
        return showToast('File data_default.js tidak ditemukan!', 'danger');
    }
    const kls = document.getElementById('loadDefaultKls').value;
    const dataKelas = dbKurikulumPAI[kls];
    if(dataKelas) {
        dataCPTP.cp = dataKelas.cp;
        dataCPTP.tps = dataKelas.tps;
        localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
        renderCPTP();
        updateStats();
        showToast(`Data PAI Kelas ${kls} berhasil dimuat!`, 'success');
    }
};

// ==========================================
// STUDENT DATA MANAGEMENT
// ==========================================
function processCsvData(d) {
    let count = 0;
    d.forEach(s => {
        let nisn = s.nisn || s.NISN;
        let nama = s.nama || s.Nama;
        let jk = s.jk || s.JK;
        let kelas = s.kelas || s.Kelas;
        let rombel = s.rombel || s.Rombel;
        
        if(nama && kelas && rombel) {
            dataSiswa.push({
                nisn: nisn || '-',
                nama: nama,
                jk: jk || '-',
                kelas: kelas,
                rombel: rombel
            });
            count++;
        }
    });
    localStorage.setItem('sim_siswa', JSON.stringify(dataSiswa));
    renderTabelSiswa();
    updateStats();
    showToast(`${count} siswa berhasil diimport!`, 'success');
}

window.importSiswaLokal = function() {
    const file = document.getElementById('fileCsvSiswa').files[0];
    if(!file) return showToast('Pilih file CSV!', 'warning');
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            processCsvData(results.data);
        }
    });
};

window.clearDataSiswa = function() {
    if(confirm("Hapus semua data siswa?")) {
        dataSiswa = [];
        localStorage.removeItem('sim_siswa');
        renderTabelSiswa();
        updateStats();
        showToast('Data siswa dihapus!', 'info');
    }
};

window.renderTabelSiswa = function() {
    const filter = document.getElementById('filterKelasSiswa').value;
    let options = '<option value="ALL">-- Semua Rombel --</option>';
    new Set(dataSiswa.map(s => s.rombel)).forEach(r => {
        options += `<option value="${r}" ${filter === r ? 'selected' : ''}>${r}</option>`;
    });
    document.getElementById('filterKelasSiswa').innerHTML = options;
    
    let html = '';
    const filtered = filter === "ALL" ? dataSiswa : dataSiswa.filter(s => s.rombel === filter);
    filtered.forEach(s => {
        html += `<tr>
            <td>${s.nisn}</td>
            <td>${s.nama}</td>
            <td>${s.jk}</td>
            <td>${s.kelas}</td>
            <td>${s.rombel}</td>
        </tr>`;
    });
    document.getElementById('tabelSiswaBody').innerHTML = html || '<tr><td colspan="5" class="text-center py-4">Belum ada data siswa</td></tr>';
};

// ==========================================
// SCHEDULE MANAGEMENT
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
    showToast('Jadwal dihapus!', 'info');
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
                <td><button class="btn btn-sm btn-danger" onclick="hapusJadwal(${i})"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
    }
    document.getElementById('tabelJadwalBody').innerHTML = html;
}

// ==========================================
// DROPDOWN HELPERS
// ==========================================
function populateDropdowns() {
    let optJadwal = '<option value="">-- Pilih Jadwal/Rombel --</option>';
    dataJadwal.forEach((d) => {
        optJadwal += `<option value='${JSON.stringify(d)}'>${d.hari} Jam ${d.jam} - Rombel ${d.rombel}</option>`;
    });
    document.querySelectorAll('#pSelectJadwal, #selectJadwalAbsen').forEach(el => el.innerHTML = optJadwal);
    
    let optTP = '<option value="">-- Pilih Materi (TP) --</option>';
    dataCPTP.tps.forEach(t => {
        optTP += `<option value='${t.judul}'>Bab ${t.bab} - ${t.judul}</option>`;
    });
    document.querySelectorAll('#pSelectTP, #selectTPAbsen').forEach(el => el.innerHTML = optTP);
}

function populateFaseRombelOptions(elementId) {
    let setFr = new Set(dataJadwal.map(d => `Fase ${d.fase} - ${d.rombel}`));
    let options = '';
    setFr.forEach(fr => options += `<option value="${fr}">${fr}</option>`);
    document.getElementById(elementId).innerHTML = options || '<option value="">Buat Jadwal Dulu</option>';
}

// ==========================================
// DOCUMENT GENERATORS
// ==========================================
window.generateTahunan = function() {
    const fr = document.getElementById('tFaseRombel').value;
    document.querySelectorAll('.vFaseRombel').forEach(el => el.innerText = fr);
    document.getElementById('vCPATP').innerText = dataCPTP.cp;
    
    let htmlAtp = '', htmlProta = '', htmlPromes = '';
    let totalJP = 0;
    
    dataCPTP.tps.forEach((t, idx) => {
        totalJP += parseInt(t.jp);
        
        htmlAtp += `<tr>
            <td style="text-align: center;">${t.bab}</td>
            <td>Peserta didik mampu memahami dan menerapkan: ${t.judul}</td>
            <td style="text-align: center;">${t.jp} JP</td>
        </tr>`;
        
        const semester = idx < Math.ceil(dataCPTP.tps.length / 2) ? 'Ganjil' : 'Genap';
        htmlProta += `<tr>
            <td style="text-align: center;">${semester}</td>
            <td>Bab ${t.bab} - ${t.judul}</td>
            <td style="text-align: center;">${t.jp}</td>
            <td>Sesuai Kalender Akademik</td>
        </tr>`;
        
        // Promes with weekly distribution
        const weeksNeeded = Math.ceil(t.jp / 2);
        let weekCells = '';
        for (let w = 0; w < 24; w++) {
            if (w < weeksNeeded) {
                weekCells += `<td style="text-align: center; background: #e3f2fd;">✓</td>`;
            } else {
                weekCells += `<td></td>`;
            }
        }
        htmlPromes += `<tr>
            <td style="text-align: left;">Bab ${t.bab}: ${t.judul}</td>
            <td style="text-align: center;">${t.jp}</td>
            ${weekCells}
        </tr>`;
    });
    
    // Add total row to ATP
    htmlAtp += `<tr style="font-weight: bold; background: #f8f9fa;">
        <td colspan="2" style="text-align: right;">Total Alokasi Waktu:</td>
        <td style="text-align: center;">${totalJP} JP</td>
    </tr>`;
    
    document.getElementById('tblAtpBody').innerHTML = htmlAtp;
    document.getElementById('tblProtaBody').innerHTML = htmlProta;
