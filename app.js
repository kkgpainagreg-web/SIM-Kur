// =============================================
// SIM KURIKULUM MERDEKA - MAIN APPLICATION JS
// =============================================

// ========== DATA STATE ==========
let dataSiswa = JSON.parse(localStorage.getItem('sim_siswa')) || [];
let dataJadwal = JSON.parse(localStorage.getItem('sim_jadwal')) || [];
let dataNilai = JSON.parse(localStorage.getItem('sim_nilai')) || {};
let dataCPTP = JSON.parse(localStorage.getItem('sim_cptp')) || { cp: "", tps: [{bab:1, judul:"Materi Pertama", jp:4}] };

// ========== ADMIN & PREMIUM SETTINGS ==========
const DEFAULT_ADMIN = {
    email: "afifaro@gmail.com",
    password: "admin123"
};

let adminSettings = JSON.parse(localStorage.getItem('sim_admin_settings')) || {
    email: DEFAULT_ADMIN.email,
    password: DEFAULT_ADMIN.password,
    price: 99000,
    whatsapp: "6281234567890",
    bank: "BCA",
    rekening: "1234567890",
    namaRekening: "Admin SIM Kurikulum"
};

let isAdminLoggedIn = false;
let isPremiumUser = JSON.parse(localStorage.getItem('sim_premium')) || false;

// Generate unique device code
function getDeviceCode() {
    let code = localStorage.getItem('sim_device_code');
    if (!code) {
        code = 'SIM-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
        localStorage.setItem('sim_device_code', code);
    }
    return code;
}

// ========== NAVIGATION ==========
window.showTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.sidebar .nav-link').forEach(el => el.classList.remove('active'));
    
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.classList.remove('d-none');
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    updateUIProfile();
    updateStats();
    
    if(tabId === 'tabCPTP') renderCPTP();
    if(tabId === 'tabTahunan') populateFaseRombelOptions('tFaseRombel');
    if(tabId === 'tabPerangkat' || tabId === 'tabPelaksanaan') populateDropdowns();
    if(tabId === 'tabPenilaian') renderKelasPenilaian();
    if(tabId === 'tabAdmin') {
        loadAdminSettingsToForm();
        document.getElementById('deviceCode').textContent = getDeviceCode();
    }
};

// ========== PREMIUM CHECK ==========
window.checkPremium = function(tabId) {
    if (isPremiumUser || isAdminLoggedIn) {
        showTab(tabId);
    } else {
        showUpgradeModal();
    }
};

window.showUpgradeModal = function() {
    // Update modal with current settings
    document.getElementById('displayPrice').textContent = 'Rp ' + adminSettings.price.toLocaleString('id-ID');
    document.getElementById('displayBank').textContent = adminSettings.bank + ' - ' + adminSettings.rekening;
    document.getElementById('displayAccountName').textContent = 'a.n. ' + adminSettings.namaRekening;
    
    const waMessage = encodeURIComponent(`Halo Admin, saya ingin upgrade ke Premium SIM Kurikulum Merdeka.\n\nKode Perangkat: ${getDeviceCode()}\n\nMohon bantuan aktivasinya. Terima kasih!`);
    document.getElementById('waUpgradeBtn').href = `https://wa.me/${adminSettings.whatsapp}?text=${waMessage}`;
    
    const modal = new bootstrap.Modal(document.getElementById('upgradeModal'));
    modal.show();
};

// ========== ADMIN FUNCTIONS ==========
window.showAdminLogin = function() {
    if (isAdminLoggedIn) {
        showTab('tabAdmin');
    } else {
        const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
        modal.show();
    }
};

window.loginAdmin = function() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (email === adminSettings.email && password === adminSettings.password) {
        isAdminLoggedIn = true;
        isPremiumUser = true; // Admin gets all premium features
        
        bootstrap.Modal.getInstance(document.getElementById('adminLoginModal')).hide();
        
        document.getElementById('userRole').textContent = 'Admin Mode';
        document.getElementById('userRole').classList.add('text-warning');
        
        showTab('tabAdmin');
        alert('Login Admin Berhasil!');
    } else {
        alert('Email atau Password salah!');
    }
};

window.logoutAdmin = function() {
    isAdminLoggedIn = false;
    isPremiumUser = JSON.parse(localStorage.getItem('sim_premium')) || false;
    
    document.getElementById('userRole').textContent = isPremiumUser ? 'Premium User' : 'Versi Gratis';
    document.getElementById('userRole').classList.remove('text-warning');
    
    showTab('tabDashboard');
    alert('Logout Berhasil!');
};

function loadAdminSettingsToForm() {
    document.getElementById('adminPrice').value = adminSettings.price;
    document.getElementById('adminWA').value = adminSettings.whatsapp;
    document.getElementById('adminBank').value = adminSettings.bank;
    document.getElementById('adminRekening').value = adminSettings.rekening;
    document.getElementById('adminNamaRek').value = adminSettings.namaRekening;
    document.getElementById('adminNewEmail').value = adminSettings.email;
}

window.saveAdminSettings = function() {
    adminSettings.price = parseInt(document.getElementById('adminPrice').value) || 99000;
    adminSettings.whatsapp = document.getElementById('adminWA').value;
    adminSettings.bank = document.getElementById('adminBank').value;
    adminSettings.rekening = document.getElementById('adminRekening').value;
    adminSettings.namaRekening = document.getElementById('adminNamaRek').value;
    
    localStorage.setItem('sim_admin_settings', JSON.stringify(adminSettings));
    alert('Pengaturan berhasil disimpan!');
};

window.updateAdminCredentials = function() {
    const newEmail = document.getElementById('adminNewEmail').value;
    const newPassword = document.getElementById('adminNewPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    
    if (newPassword && newPassword !== confirmPassword) {
        alert('Password tidak cocok!');
        return;
    }
    
    if (newEmail) {
        adminSettings.email = newEmail;
    }
    
    if (newPassword) {
        adminSettings.password = newPassword;
    }
    
    localStorage.setItem('sim_admin_settings', JSON.stringify(adminSettings));
    alert('Kredensial Admin berhasil diupdate!');
};

window.activateUserPremium = function() {
    const code = document.getElementById('userActivationCode').value.trim();
    
    if (!code) {
        alert('Masukkan kode aktivasi!');
        return;
    }
    
    // Store activated codes
    let activatedCodes = JSON.parse(localStorage.getItem('sim_activated_codes')) || [];
    
    if (!activatedCodes.includes(code)) {
        activatedCodes.push(code);
        localStorage.setItem('sim_activated_codes', JSON.stringify(activatedCodes));
    }
    
    alert(`Kode ${code} telah diaktivasi!\n\nUser dengan kode ini sekarang bisa mengakses fitur Premium.`);
    document.getElementById('userActivationCode').value = '';
};

// Check if current device is activated
function checkDeviceActivation() {
    const myCode = getDeviceCode();
    const activatedCodes = JSON.parse(localStorage.getItem('sim_activated_codes')) || [];
    
    if (activatedCodes.includes(myCode)) {
        isPremiumUser = true;
        localStorage.setItem('sim_premium', 'true');
    }
}

// ========== COPY TO CLIPBOARD ==========
window.copyToClipboard = function(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    alert("Prompt telah disalin! Silakan paste ke ChatGPT/Gemini.");
};

// ========== PRINT LOGIC ==========
window.triggerPrint = function(sourceId, pdfName, orientation) {
    updateUIProfile();
    document.title = pdfName + "_" + new Date().getTime();
    
    document.querySelectorAll('.print-view').forEach(el => el.classList.add('hide-on-print'));
    document.querySelectorAll('.document-page').forEach(el => el.style.display = 'none');
    
    const target = document.getElementById(sourceId);
    target.classList.remove('d-none', 'hide-on-print');
    target.style.display = 'block';
    
    window.print();
    target.style.display = 'none';
};

// ========== PROFILE FUNCTIONS ==========
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

function updateStats() {
    document.getElementById('statSiswa').textContent = dataSiswa.length;
    document.getElementById('statJadwal').textContent = dataJadwal.length;
    document.getElementById('statTP').textContent = dataCPTP.tps.length;
    
    const rombels = new Set(dataSiswa.map(s => s.rombel));
    document.getElementById('statRombel').textContent = rombels.size;
}

// ========== CP & TP FUNCTIONS ==========
function renderCPTP() {
    document.getElementById('inputCP').value = dataCPTP.cp;
    let h = '';
    dataCPTP.tps.forEach((tp) => {
        h += `<tr>
            <td><input type="number" class="form-control tp-bab" value="${tp.bab}"></td>
            <td><input type="text" class="form-control tp-judul" value="${tp.judul}"></td>
            <td><input type="number" class="form-control tp-jp" value="${tp.jp}"></td>
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
    alert("CP & TP Berhasil Disimpan!");
    updateStats();
};

window.loadDefaultPAI = function() {
    if(typeof dbKurikulumPAI === 'undefined') {
        return alert("File data_default.js tidak ditemukan!");
    }
    
    const kls = document.getElementById('loadDefaultKls').value;
    const dataKelas = dbKurikulumPAI[kls];
    
    if(dataKelas) {
        dataCPTP.cp = dataKelas.cp;
        dataCPTP.tps = dataKelas.tps;
        localStorage.setItem('sim_cptp', JSON.stringify(dataCPTP));
        renderCPTP();
        alert(`Berhasil memuat Default PAI Kelas ${kls}!`);
        updateStats();
    }
};

// ========== SISWA FUNCTIONS ==========
function processCsvData(d) {
    let hitung = 0;
    d.forEach(s => {
        let nisn = s.nisn || s.NISN;
        let nm = s.nama || s.Nama;
        let jk = s.jk || s.JK;
        let kls = s.kelas || s.Kelas;
        let rmb = s.rombel || s.Rombel;
        
        if(nm && kls && rmb) {
            dataSiswa.push({
                nisn: nisn || '-',
                nama: nm,
                jk: jk || '-',
                kelas: kls,
                rombel: rmb
            });
            hitung++;
        }
    });
    
    localStorage.setItem('sim_siswa', JSON.stringify(dataSiswa));
    renderTabelSiswa();
    updateStats();
    alert(`${hitung} siswa diimport!`);
}

window.importSiswaLokal = function() {
    const f = document.getElementById('fileCsvSiswa').files[0];
    if(!f) return alert("Pilih file CSV!");
    
    Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: function(r) {
            processCsvData(r.data);
        }
    });
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
    const f = document.getElementById('filterKelasSiswa').value;
    let opt = '<option value="ALL">-- Semua Rombel --</option>';
    
    new Set(dataSiswa.map(s => s.rombel)).forEach(r => {
        opt += `<option value="${r}" ${f === r ? 'selected' : ''}>${r}</option>`;
    });
    
    document.getElementById('filterKelasSiswa').innerHTML = opt;
    
    let tb = '';
    const filtered = f === "ALL" ? dataSiswa : dataSiswa.filter(s => s.rombel === f);
    
    filtered.forEach(s => {
        tb += `<tr>
            <td>${s.nisn}</td>
            <td>${s.nama}</td>
            <td><span class="badge ${s.jk === 'L' ? 'bg-primary' : 'bg-danger'}">${s.jk}</span></td>
            <td>${s.kelas}</td>
            <td>${s.rombel}</td>
        </tr>`;
    });
    
    document.getElementById('tabelSiswaBody').innerHTML = tb || '<tr><td colspan="5" class="text-center text-muted">Data siswa kosong</td></tr>';
};

// ========== JADWAL FUNCTIONS ==========
window.tambahJadwalLokal = function() {
    const h = document.getElementById('jadwalHari').value;
    const j = document.getElementById('jadwalJam').value;
    const f = document.getElementById('jadwalFase').value;
    const r = document.getElementById('jadwalRombel').value;
    
    if(!j || !r) return alert("Jam & Rombel wajib diisi!");
    
    dataJadwal.push({ hari: h, jam: j, fase: f, rombel: r });
    localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
    renderJadwal();
    updateStats();
    
    // Clear inputs
    document.getElementById('jadwalJam').value = '';
    document.getElementById('jadwalRombel').value = '';
};

window.hapusJadwal = function(idx) {
    if(confirm('Hapus jadwal ini?')) {
        dataJadwal.splice(idx, 1);
        localStorage.setItem('sim_jadwal', JSON.stringify(dataJadwal));
        renderJadwal();
        updateStats();
    }
};

function renderJadwal() {
    let tb = '';
    dataJadwal.forEach((d, i) => {
        tb += `<tr>
            <td>${d.hari}</td>
            <td>Jam Ke-${d.jam}</td>
            <td><span class="badge bg-primary">Fase ${d.fase}</span></td>
            <td><span class="badge bg-success">${d.rombel}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="hapusJadwal(${i})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    document.getElementById('tabelJadwalBody').innerHTML = tb || '<tr><td colspan="5" class="text-center text-muted">Belum ada jadwal</td></tr>';
}

// ========== DROPDOWN HELPERS ==========
function populateDropdowns() {
    let oj = '<option value="">-- Pilih Jadwal --</option>';
    dataJadwal.forEach((d) => {
        oj += `<option value='${JSON.stringify(d)}'>${d.hari} Jam ${d.jam} - ${d.rombel}</option>`;
    });
    
    document.querySelectorAll('#pSelectJadwal, #selectJadwalAbsen').forEach(el => el.innerHTML = oj);
    
    let ot = '<option value="">-- Pilih Materi --</option>';
    dataCPTP.tps.forEach(t => {
        ot += `<option value='${t.judul}'>Bab ${t.bab} - ${t.judul}</option>`;
    });
    
    document.querySelectorAll('#pSelectTP, #selectTPAbsen').forEach(el => el.innerHTML = ot);
}

function populateFaseRombelOptions(elementId) {
    let setFr = new Set(dataJadwal.map(d => `Fase ${d.fase} - ${d.rombel}`));
    let o = '';
    setFr.forEach(fr => o += `<option value="${fr}">${fr}</option>`);
    document.getElementById(elementId).innerHTML = o || '<option value="">Buat Jadwal Dulu</option>';
}

// ========== TAHUNAN GENERATOR ==========
window.generateTahunan = function() {
    const fr = document.getElementById('tFaseRombel').value;
    document.querySelectorAll('.vFaseRombel').forEach(el => el.innerText = fr);
    document.getElementById('vCPATP').innerText = dataCPTP.cp;

    let hatp = '', hprota = '', hpromes = '';
    
    dataCPTP.tps.forEach(t => {
        hatp += `<tr><td>${t.bab}</td><td>Peserta didik mampu memahami: ${t.judul}</td><td>${t.jp} JP</td></tr>`;
        hprota += `<tr><td>Ganjil</td><td>Bab ${t.bab} - ${t.judul}</td><td>${t.jp}</td><td>Sesuai Kalender</td></tr>`;
        hpromes += `<tr><td>Bab ${t.bab}: ${t.judul}</td><td>${t.jp}</td>
            <td>${Math.ceil(t.jp/2)}</td><td>${Math.floor(t.jp/2)}</td><td></td><td></td>
            <td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td></tr>`;
    });
    
    document.getElementById('tblAtpBody').innerHTML = hatp;
    document.getElementById('tblProtaBody').innerHTML = hprota;
    document.getElementById('tblPromesBody').innerHTML = hpromes;
    
    alert("Data di-load! Silakan klik tombol Cetak.");
};

// ========== MODUL GENERATOR ==========
window.generateModul = function() {
    const j = document.getElementById('pSelectJadwal').value;
    const tp = document.getElementById('pSelectTP').value;
    
    if(!j || !tp) return alert("Pilih Jadwal & Materi!");
    
    const jv = JSON.parse(j);
    document.querySelectorAll('.vFaseRombel').forEach(e => e.innerText = `Fase ${jv.fase} / ${jv.rombel}`);
    document.getElementById('outMateriModul').innerText = tp;
    
    alert("Modul Siap! Klik Cetak.");
};

// ========== ABSENSI ==========
window.loadAbsensi = function() {
    const jVal = document.getElementById('selectJadwalAbsen').value;
    if(!jVal) return alert("Pilih Jadwal!");
    
    const rmb = JSON.parse(jVal).rombel;
    const sKelas = dataSiswa.filter(s => s.rombel === rmb);
    
    document.getElementById('areaAbsen').classList.remove('d-none');
    
    let h = '';
    sKelas.forEach(s => {
        h += `<div class="col-md-3 col-6">
            <div class="form-check p-2 bg-light rounded">
                <input type="checkbox" class="form-check-input absen-check" value="${s.nama}" id="absen_${s.nisn}" checked>
                <label class="form-check-label small" for="absen_${s.nisn}">${s.nama}</label>
            </div>
        </div>`;
    });
    
    document.getElementById('listSiswaAbsen').innerHTML = h || '<div class="col-12 text-danger">Siswa kosong di rombel ini.</div>';
};

window.simpanJurnal = function() {
    const jVal = JSON.parse(document.getElementById('selectJadwalAbsen').value);
    const mt = document.getElementById('selectTPAbsen').value;
    const boxes = document.querySelectorAll('.absen-check');
    
    let h = 0, abs = [];
    boxes.forEach(b => {
        if(b.checked) h++;
        else abs.push(b.value);
    });
    
    document.getElementById('jurTanggal').innerText = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('jurRombel').innerText = jVal.rombel;
    document.getElementById('jurMateri').innerText = mt;
    document.getElementById('jurHadir').innerText = h;
    document.getElementById('jurAbsen').innerText = abs.length;
    document.getElementById('jurListAbsen').innerText = abs.length > 0 ? abs.join(", ") : "-";
    
    alert("Tersimpan! Silakan klik Cetak Jurnal.");
};

// ========== PENILAIAN ==========
window.renderKelasPenilaian = function() {
    let o = '<option value="">-- Pilih Rombel --</option>';
    new Set(dataSiswa.map(s => s.rombel)).forEach(k => {
        o += `<option value="${k}">${k}</option>`;
    });
    document.getElementById('selectKelasNilai').innerHTML = o;
};

window.loadPenilaian = function() {
    const rmb = document.getElementById('selectKelasNilai').value;
    if(!rmb) return;
    
    document.getElementById('lblKelasNilai').innerText = rmb;
    document.getElementById('lblTopikNilai').innerText = document.getElementById('topikNilai').value;
    
    let tb = '';
    dataSiswa.filter(s => s.rombel === rmb).forEach((s, i) => {
        let v = dataNilai[`${rmb}_${s.nisn}`] || '';
        tb += `<tr>
            <td>${i + 1}</td>
            <td>${s.nisn}</td>
            <td class="text-start">${s.nama}</td>
            <td><span class="badge ${s.jk === 'L' ? 'bg-primary' : 'bg-danger'}">${s.jk}</span></td>
            <td class="no-print"><input type="number" class="form-control form-control-sm input-nilai text-center" data-id="${s.nisn}" value="${v}" min="0" max="100"></td>
            <td class="hide-on-print print-only-td" style="display:none;">${v}</td>
        </tr>`;
    });
    
    tb += `<style>@media print { .input-nilai { display: none !important; } .print-only-td { display: table-cell !important; } }</style>`;
    
    document.getElementById('tblNilaiBody').innerHTML = tb || '<tr><td colspan="5">Pilih Rombel.</td></tr>';
    document.getElementById('docNilai').classList.remove('d-none');
};

window.simpanNilai = function() {
    const rmb = document.getElementById('selectKelasNilai').value;
    if(!rmb) return alert("Pilih rombel!");
    
    document.querySelectorAll('.input-nilai').forEach(el => {
        dataNilai[`${rmb}_${el.getAttribute('data-id')}`] = el.value;
    });
    
    localStorage.setItem('sim_nilai', JSON.stringify(dataNilai));
    alert("Nilai Disimpan!");
    loadPenilaian();
};

// ========== INITIALIZATION ==========
window.onload = function() {
    checkDeviceActivation();
    loadProfil();
    renderTabelSiswa();
    renderJadwal();
    renderCPTP();
    updateStats();
    
    // Update user role display
    if (isPremiumUser) {
        document.getElementById('userRole').textContent = 'Premium User';
        document.getElementById('userRole').classList.add('text-success');
    }
};