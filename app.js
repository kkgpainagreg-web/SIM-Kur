// =============================================
// SIM KURIKULUM MERDEKA - MAIN APPLICATION
// =============================================

// ========== DATA STATE ==========
let dataSiswa = JSON.parse(localStorage.getItem('sim_siswa')) || [];
let dataJadwal = JSON.parse(localStorage.getItem('sim_jadwal')) || [];
let dataNilai = JSON.parse(localStorage.getItem('sim_nilai')) || {};
let dataCPTP = JSON.parse(localStorage.getItem('sim_cptp')) || { cp: "", tps: [{bab:1, judul:"Materi Pertama", jp:4}] };

// ========== ADMIN SETTINGS ==========
const ADMIN_EMAIL = "afifaro@gmail.com";

let adminSettings = JSON.parse(localStorage.getItem('sim_admin_settings')) || {
    price: 99000,
    whatsapp: "6281234567890",
    bank: "BCA",
    rekening: "1234567890",
    namaRekening: "Admin SIM Kurikulum"
};

let currentUser = JSON.parse(localStorage.getItem('sim_current_user')) || null;
let isPremiumUser = JSON.parse(localStorage.getItem('sim_premium')) || false;

// ========== DEVICE CODE ==========
function getDeviceCode() {
    let code = localStorage.getItem('sim_device_code');
    if (!code) {
        code = 'SIM-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase().substring(0, 5);
        localStorage.setItem('sim_device_code', code);
    }
    return code;
}

// ========== GOOGLE SIGN-IN ==========
function initGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Ganti dengan Client ID Anda
            callback: handleGoogleCallback,
            auto_select: false
        });
    }
}

window.handleGoogleLogin = function() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback: tampilkan one-tap atau redirect
                showManualLoginPrompt();
            }
        });
    } else {
        showManualLoginPrompt();
    }
};

function showManualLoginPrompt() {
    // Simulasi untuk demo - dalam produksi gunakan Google Sign-In yang proper
    const email = prompt("Masukkan email admin (untuk demo):");
    if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        loginAsAdmin(email, "Admin", "");
    } else if (email) {
        alert("Email tidak dikenali sebagai admin. Hanya " + ADMIN_EMAIL + " yang bisa mengakses Admin Panel.");
    }
}

function handleGoogleCallback(response) {
    const payload = parseJwt(response.credential);
    
    if (payload.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        loginAsAdmin(payload.email, payload.name, payload.picture);
    } else {
        alert("Maaf, hanya admin (" + ADMIN_EMAIL + ") yang bisa login.");
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return {};
    }
}

function loginAsAdmin(email, name, picture) {
    currentUser = { email, name, picture, isAdmin: true };
    localStorage.setItem('sim_current_user', JSON.stringify(currentUser));
    isPremiumUser = true;
    localStorage.setItem('sim_premium', 'true');
    
    updateUserUI();
    showTab('tabAdmin');
    alert("Login berhasil! Selamat datang, " + name);
}

window.handleLogout = function() {
    currentUser = null;
    localStorage.removeItem('sim_current_user');
    
    // Cek apakah device ini sudah diaktivasi premium
    checkDeviceActivation();
    
    updateUserUI();
    showTab('tabDashboard');
    alert("Logout berhasil!");
};

function updateUserUI() {
    const loginSection = document.getElementById('loginSection');
    const logoutSection = document.getElementById('logoutSection');
    const adminMenuSection = document.getElementById('adminMenuSection');
    const userRole = document.getElementById('userRole');
    
    if (currentUser && currentUser.isAdmin) {
        loginSection.classList.add('d-none');
        logoutSection.classList.remove('d-none');
        adminMenuSection.classList.remove('d-none');
        
        document.getElementById('adminName').textContent = currentUser.name || currentUser.email;
        
        if (currentUser.picture) {
            document.getElementById('adminAvatar').src = currentUser.picture;
            document.getElementById('adminAvatar').style.display = 'block';
        }
        
        userRole.textContent = 'Administrator';
        userRole.classList.add('text-warning');
    } else {
        loginSection.classList.remove('d-none');
        logoutSection.classList.add('d-none');
        adminMenuSection.classList.add('d-none');
        
        userRole.textContent = isPremiumUser ? 'Premium User' : 'Versi Gratis';
        userRole.classList.remove('text-warning');
        if (isPremiumUser) userRole.classList.add('text-success');
    }
}

// ========== SIDEBAR TOGGLE ==========
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
};

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
}

// ========== NAVIGATION ==========
window.showTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.sidebar .nav-link').forEach(el => el.classList.remove('active'));
    
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.remove('d-none');
    
    if (event && event.target) {
        const link = event.target.closest('.nav-link');
        if (link) link.classList.add('active');
    }
    
    closeSidebar();
    updateUIProfile();
    updateStats();
    
    if (tabId === 'tabCPTP') renderCPTP();
    if (tabId === 'tabTahunan') populateFaseRombelOptions('tFaseRombel');
    if (tabId === 'tabPerangkat' || tabId === 'tabPelaksanaan') populateDropdowns();
    if (tabId === 'tabPenilaian') renderKelasPenilaian();
    if (tabId === 'tabAdmin') {
        loadAdminSettingsToForm();
        renderActivatedCodes();
    }
};

// ========== PREMIUM CHECK ==========
window.checkPremium = function(tabId) {
    if (isPremiumUser || (currentUser && currentUser.isAdmin)) {
        showTab(tabId);
    } else {
        showUpgradeModal();
    }
};

window.showUpgradeModal = function() {
    document.getElementById('displayPrice').textContent = 'Rp ' + adminSettings.price.toLocaleString('id-ID');
    document.getElementById('displayBank').textContent = adminSettings.bank + ' - ' + adminSettings.rekening;
    document.getElementById('displayAccountName').textContent = 'a.n. ' + adminSettings.namaRekening;
    
    const deviceCode = getDeviceCode();
    const waMessage = encodeURIComponent(`Halo Admin, saya ingin upgrade SIM Kurikulum Merdeka ke Premium.\n\nKode Perangkat: ${deviceCode}\n\nMohon bantuan aktivasinya. Terima kasih!`);
    document.getElementById('waUpgradeBtn').href = `https://wa.me/${adminSettings.whatsapp}?text=${waMessage}`;
    
    const modal = new bootstrap.Modal(document.getElementById('upgradeModal'));
    modal.show();
};

// ========== ADMIN FUNCTIONS ==========
function loadAdminSettingsToForm() {
    document.getElementById('adminPrice').value = adminSettings.price;
    document.getElementById('adminWA').value = adminSettings.whatsapp;
    document.getElementById('adminBank').value = adminSettings.bank;
    document.getElementById('adminRekening').value = adminSettings.rekening;
    document.getElementById('adminNamaRek').value = adminSettings.namaRekening;
}

window.saveAdminSettings = function() {
    adminSettings.price = parseInt(document.getElementById('adminPrice').value) || 99000;
    adminSettings.whatsapp = document.getElementById('adminWA').value || '6281234567890';
    adminSettings.bank = document.getElementById('adminBank').value || 'BCA';
    adminSettings.rekening = document.getElementById('adminRekening').value || '1234567890';
    adminSettings.namaRekening = document.getElementById('adminNamaRek').value || 'Admin';
    
    localStorage.setItem('sim_admin_settings', JSON.stringify(adminSettings));
    alert('Pengaturan berhasil disimpan!');
};

window.activateUserPremium = function() {
    const code = document.getElementById('userActivationCode').value.trim().toUpperCase();
    
    if (!code) {
        alert('Masukkan kode aktivasi!');
        return;
    }
    
    let activatedCodes = JSON.parse(localStorage.getItem('sim_activated_codes')) || [];
    
    if (activatedCodes.includes(code)) {
        alert('Kode ini sudah pernah diaktivasi!');
        return;
    }
    
    activatedCodes.push(code);
    localStorage.setItem('sim_activated_codes', JSON.stringify(activatedCodes));
    
    // Jika kode yang diaktivasi sama dengan device code sendiri
    if (code === getDeviceCode()) {
        isPremiumUser = true;
        localStorage.setItem('sim_premium', 'true');
        updateUserUI();
    }
    
    renderActivatedCodes();
    alert(`Kode ${code} berhasil diaktivasi!`);
    document.getElementById('userActivationCode').value = '';
};

function renderActivatedCodes() {
    const container = document.getElementById('activatedCodesList');
    const codes = JSON.parse(localStorage.getItem('sim_activated_codes')) || [];
    
    if (codes.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0">Belum ada kode yang diaktivasi.</p>';
        return;
    }
    
    let html = '<ul class="list-group list-group-flush">';
    codes.forEach((code, i) => {
        html += `<li class="list-group-item d-flex justify-content-between align-items-center py-2 px-0">
            <code>${code}</code>
            <button class="btn btn-outline-danger btn-sm" onclick="removeActivatedCode(${i})">
                <i class="bi bi-trash"></i>
            </button>
        </li>`;
    });
    html += '</ul>';
    
    container.innerHTML = html;
}

window.removeActivatedCode = function(index) {
    if (!confirm('Hapus kode aktivasi ini?')) return;
    
    let codes = JSON.parse(localStorage.getItem('sim_activated_codes')) || [];
    codes.splice(index, 1);
    localStorage.setItem('sim_activated_codes', JSON.stringify(codes));
    renderActivatedCodes();
};

function checkDeviceActivation() {
    const myCode = getDeviceCode();
    const activatedCodes = JSON.parse(localStorage.getItem('sim_activated_codes')) || [];
    
    if (activatedCodes.includes(myCode)) {
        isPremiumUser = true;
        localStorage.setItem('sim_premium', 'true');
    } else {
        isPremiumUser = false;
        localStorage.setItem('sim_premium', 'false');
    }
}

// ========== COPY TO CLIPBOARD ==========
window.copyToClipboard = function(elementId) {
    const el = document.getElementById(elementId);
    el.select();
    navigator.clipboard.writeText(el.value);
    alert("Prompt disalin!");
};

// ========== PRINT ==========
window.triggerPrint = function(sourceId, pdfName) {
    updateUIProfile();
    document.title = pdfName + "_" + new Date().getTime();
    
    document.querySelectorAll('.print-view').forEach(el => {
        el.classList.add('hide-on-print');
        el.style.display = 'none';
    });
    
    const target = document.getElementById(sourceId);
    target.classList.remove('d-none', 'hide-on-print');
    target.style.display = 'block';
    
    setTimeout(() => {
        window.print();
        target.style.display = 'none';
    }, 100);
};

// ========== PROFILE ==========
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
    alert("Profil Tersimpan!");
    updateUIProfile();
};

function loadProfil() {
    const p = JSON.parse(localStorage.getItem('sim_prof'));
    if (p) {
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

function updateStats() {
    document.getElementById('statSiswa').textContent = dataSiswa.length;
    document.getElementById('statJadwal').textContent = dataJadwal.length;
    document.getElementById('statTP').textContent = dataCPTP.tps.length;
    document.getElementById('statRombel').textContent = new Set(dataSiswa.map(s => s.rombel)).size;
}

// ========== CP & TP ==========
function renderCPTP() {
    document.getElementById('inputCP').value = dataCPTP.cp;
    let h = '';
    dataCPTP.tps.forEach((tp) => {
        h += `<tr>
            <td><input type="number" class="form-control form-control-sm tp-bab" value="${tp.bab}"></td>
            <td><input type="text" class="form-control form-control-sm tp-judul" value="${tp.judul}"></td>
            <td><input type="number" class="form-control form-control-sm tp-jp" value="${tp.jp}"></td>
        </tr>`;
    });
    document.getElementById('bodyInputTP').innerHTML = h;
}

window.tambahBarisTP = function() {
    dataCPTP.tps.push({ bab: dataCPTP.tps.length + 1, judul: "", jp: 4 });
    renderCPTP();
};

window.simpanCPTP = function() {
    dataCPTP.cp = document.getElementById('inputCP').value;
    dataCPTP.tps = [];
    
    const babs = document.querySelectorAll('.tp-bab');
    const juduls = document.querySelectorAll('.tp-judul');
    const jps = document.querySelectorAll('.tp-jp');
    
    for (let i = 0; i < babs.length; i++) {
        if (juduls[i].value.trim()) {
            dataCPTP.tps.push({ bab: babs[i].value, judul: juduls[i].value, jp: jps[i].value });
        }
    }
    
    localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
    alert("CP & TP Disimpan!");
    updateStats();
};

window.loadDefaultPAI = function() {
    if (typeof dbKurikulumPAI === 'undefined') {
        return alert("File data_default.js tidak ditemukan!");
    }
    
    const kls = document.getElementById('loadDefaultKls').value;
    const data = dbKurikulumPAI[kls];
    
    if (data) {
        dataCPTP.cp = data.cp;
        dataCPTP.tps = data.tps;
        localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
        renderCPTP();
        alert(`Data PAI Kelas ${kls} dimuat!`);
        updateStats();
    }
};

// ========== SISWA ==========
window.importSiswaLokal = function() {
    const f = document.getElementById('fileCsvSiswa').files[0];
    if (!f) return alert("Pilih file CSV!");
    
    Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: function(r) {
            let count = 0;
            r.data.forEach(s => {
                const nm = s.nama || s.Nama;
                const kls = s.kelas || s.Kelas;
                const rmb = s.rombel || s.Rombel;
                
                if (nm && kls && rmb) {
                    dataSiswa.push({
                        nisn: s.nisn || s.NISN || '-',
                        nama: nm,
                        jk: s.jk || s.JK || '-',
                        kelas: kls,
                        rombel: rmb
                    });
                    count++;
                }
            });
            
            localStorage.setItem('sim_siswa', JSON.stringify(dataSiswa));
            renderTabelSiswa();
            updateStats();
            alert(`${count} siswa diimport!`);
        }
    });
};

window.clearDataSiswa = function() {
    if (confirm("Hapus semua data siswa?")) {
        dataSiswa = [];
        localStorage.removeItem('sim_siswa');
        renderTabelSiswa();
        updateStats();
    }
};

window.renderTabelSiswa = function() {
    const f = document.getElementById('filterKelasSiswa').value;
    let opt = '<option value="ALL">Semua Rombel</option>';
    new Set(dataSiswa.map(s => s.rombel)).forEach(r => {
        opt += `<option value="${r}" ${f === r ? 'selected' : ''}>${r}</option>`;
    });
    document.getElementById('filterKelasSiswa').innerHTML = opt;
    
    let tb = '';
    const filtered = f === "ALL" ? dataSiswa : dataSiswa.filter(s => s.rombel === f);
    filtered.forEach(s => {
        tb += `<tr><td>${s.nisn}</td><td>${s.nama}</td><td><span class="badge ${s.jk === 'L' ? 'bg-primary' : 'bg-danger'}">${s.jk}</span></td><td>${s.kelas}</td><td>${s.rombel}</td></tr>`;
    });
    
    document.getElementById('tabelSiswaBody').innerHTML = tb || '<tr><td colspan="5" class="text-center text-muted">Data kosong</td></tr>';
};

// ========== JADWAL ==========
window.tambahJadwalLokal = function() {
    const h = document.getElementById('jadwalHari').value;
    const j = document.getElementById('jadwalJam').value;
    const f = document.getElementById('jadwalFase').value;
    const r = document.getElementById('jadwalRombel').value;
    
    if (!j || !r) return alert("Jam & Rombel wajib diisi!");
    
    dataJadwal.push({ hari: h, jam: j, fase: f, rombel: r });
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
    renderJadwal();
    updateStats();
    
    document.getElementById('jadwalJam').value = '';
    document.getElementById('jadwalRombel').value = '';
};

window.hapusJadwal = function(idx) {
    if (confirm('Hapus?')) {
        dataJadwal.splice(idx, 1);
        localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
        renderJadwal();
        updateStats();
    }
};

function renderJadwal() {
    let tb = '';
    dataJadwal.forEach((d, i) => {
        tb += `<tr><td>${d.hari}</td><td>Ke-${d.jam}</td><td><span class="badge bg-primary">Fase ${d.fase}</span></td><td><span class="badge bg-success">${d.rombel}</span></td>
        <td><button class="btn btn-outline-danger btn-sm" onclick="hapusJadwal(${i})"><i class="bi bi-trash"></i></button></td></tr>`;
    });
    document.getElementById('tabelJadwalBody').innerHTML = tb || '<tr><td colspan="5" class="text-center text-muted">Belum ada jadwal</td></tr>';
}

// ========== HELPERS ==========
function populateDropdowns() {
    let oj = '<option value="">-- Pilih Jadwal --</option>';
    dataJadwal.forEach(d => oj += `<option value='${JSON.stringify(d)}'>${d.hari} Jam ${d.jam} - ${d.rombel}</option>`);
    document.querySelectorAll('#pSelectJadwal, #selectJadwalAbsen').forEach(el => el.innerHTML = oj);
    
    let ot = '<option value="">-- Pilih Materi --</option>';
    dataCPTP.tps.forEach(t => ot += `<option value='${t.judul}'>Bab ${t.bab} - ${t.judul}</option>`);
    document.querySelectorAll('#pSelectTP, #selectTPAbsen').forEach(el => el.innerHTML = ot);
}

function populateFaseRombelOptions(elementId) {
    let set = new Set(dataJadwal.map(d => `Fase ${d.fase} - ${d.rombel}`));
    let o = '';
    set.forEach(fr => o += `<option value="${fr}">${fr}</option>`);
    document.getElementById(elementId).innerHTML = o || '<option value="">Buat Jadwal Dulu</option>';
}

// ========== GENERATORS ==========
window.generateTahunan = function() {
    const fr = document.getElementById('tFaseRombel').value;
    document.querySelectorAll('.vFaseRombel').forEach(el => el.innerText = fr);
    document.getElementById('vCPATP').innerText = dataCPTP.cp;

    let hatp = '', hprota = '', hpromes = '';
    dataCPTP.tps.forEach(t => {
        hatp += `<tr><td>${t.bab}</td><td>Peserta didik mampu: ${t.judul}</td><td>${t.jp} JP</td></tr>`;
        hprota += `<tr><td>Ganjil</td><td>Bab ${t.bab} - ${t.judul}</td><td>${t.jp}</td><td>-</td></tr>`;
        hpromes += `<tr><td>Bab ${t.bab}: ${t.judul}</td><td>${t.jp}</td>${'<td></td>'.repeat(16)}</tr>`;
    });
    
    document.getElementById('tblAtpBody').innerHTML = hatp;
    document.getElementById('tblProtaBody').innerHTML = hprota;
    document.getElementById('tblPromesBody').innerHTML = hpromes;
    
    alert("Data dimuat! Klik tombol cetak.");
};

window.generateModul = function() {
    const j = document.getElementById('pSelectJadwal').value;
    const tp = document.getElementById('pSelectTP').value;
    
    if (!j || !tp) return alert("Pilih Jadwal & Materi!");
    
    const jv = JSON.parse(j);
    document.querySelectorAll('.vFaseRombel').forEach(e => e.innerText = `Fase ${jv.fase} / ${jv.rombel}`);
    document.getElementById('outMateriModul').innerText = tp;
    
    alert("Modul siap! Klik Cetak.");
};

// ========== ABSENSI ==========
window.loadAbsensi = function() {
    const jVal = document.getElementById('selectJadwalAbsen').value;
    if (!jVal) return alert("Pilih Jadwal!");
    
    const rmb = JSON.parse(jVal).rombel;
    const sKelas = dataSiswa.filter(s => s.rombel === rmb);
    
    document.getElementById('areaAbsen').classList.remove('d-none');
    
    let h = '';
    sKelas.forEach(s => {
        h += `<div class="col-6 col-md-3"><div class="form-check p-2 bg-light rounded small">
            <input type="checkbox" class="form-check-input absen-check" value="${s.nama}" id="a_${s.nisn}" checked>
            <label class="form-check-label" for="a_${s.nisn}">${s.nama}</label>
        </div></div>`;
    });
    
    document.getElementById('listSiswaAbsen').innerHTML = h || '<div class="col-12 text-danger">Siswa kosong.</div>';
};

window.simpanJurnal = function() {
    const jVal = JSON.parse(document.getElementById('selectJadwalAbsen').value);
    const mt = document.getElementById('selectTPAbsen').value;
    const boxes = document.querySelectorAll('.absen-check');
    
    let h = 0, abs = [];
    boxes.forEach(b => { if (b.checked) h++; else abs.push(b.value); });
    
    document.getElementById('jurTanggal').innerText = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('jurRombel').innerText = jVal.rombel;
    document.getElementById('jurMateri').innerText = mt;
    document.getElementById('jurHadir').innerText = h;
    document.getElementById('jurAbsen').innerText = abs.length;
    document.getElementById('jurListAbsen').innerText = abs.length > 0 ? abs.join(", ") : "-";
    
    alert("Tersimpan! Klik Cetak Jurnal.");
};

// ========== PENILAIAN ==========
window.renderKelasPenilaian = function() {
    let o = '<option value="">-- Pilih Rombel --</option>';
    new Set(dataSiswa.map(s => s.rombel)).forEach(k => o += `<option value="${k}">${k}</option>`);
    document.getElementById('selectKelasNilai').innerHTML = o;
};

window.loadPenilaian = function() {
    const rmb = document.getElementById('selectKelasNilai').value;
    if (!rmb) return;
    
    document.getElementById('lblKelasNilai').innerText = rmb;
    document.getElementById('lblTopikNilai').innerText = document.getElementById('topikNilai').value;
    
    let tb = '';
    dataSiswa.filter(s => s.rombel === rmb).forEach((s, i) => {
        let v = dataNilai[`${rmb}_${s.nisn}`] || '';
        tb += `<tr><td>${i + 1}</td><td>${s.nisn}</td><td class="text-start">${s.nama}</td><td><span class="badge ${s.jk === 'L' ? 'bg-primary' : 'bg-danger'}">${s.jk}</span></td>
        <td class="no-print"><input type="number" class="form-control form-control-sm input-nilai text-center" data-id="${s.nisn}" value="${v}" min="0" max="100"></td>
        <td class="hide-on-print" style="display:none;">${v}</td></tr>`;
    });
    
    tb += `<style>@media print { .input-nilai { display: none !important; } .hide-on-print { display: table-cell !important; } }</style>`;
    
    document.getElementById('tblNilaiBody').innerHTML = tb || '<tr><td colspan="5">Pilih Rombel.</td></tr>';
    document.getElementById('docNilai').classList.remove('d-none');
};

window.simpanNilai = function() {
    const rmb = document.getElementById('selectKelasNilai').value;
    if (!rmb) return alert("Pilih rombel!");
    
    document.querySelectorAll('.input-nilai').forEach(el => {
        dataNilai[`${rmb}_${el.getAttribute('data-id')}`] = el.value;
    });
    
    localStorage.setItem('sim_nilai', JSON.stringify(dataNilai));
    alert("Nilai Disimpan!");
    loadPenilaian();
};

// ========== INITIALIZATION ==========
window.onload = function() {
    initGoogleSignIn();
    checkDeviceActivation();
    loadProfil();
    renderTabelSiswa();
    renderJadwal();
    renderCPTP();
    updateStats();
    updateUserUI();
    updateUIProfile();
    
    console.log("Device Code:", getDeviceCode());
};
