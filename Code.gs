/**
 * Penerima jawaban Kuesioner Usahatani -> Google Drive.
 *
 * Setiap kali formulir dikirim, skrip ini:
 *  1. Membuat lembar jawaban PDF di subfolder "Lembar Jawaban (PDF)".
 *  2. Menyimpan cadangan data mentah (JSON) di subfolder "Data Mentah (JSON)".
 *  3. Menambahkan baris ke Google Sheets "Rekap Kuesioner Usahatani"
 *     (tab "Responden" = satu baris per petani; tab 46, 57, 61, 62, 63 = tabel, satu baris per item).
 *
 * Petunjuk pemasangan ada di README.md.
 */

// Folder Google Drive tujuan (ID diambil dari tautan folder Anda).
const FOLDER_ID = '1m0IrouS7Z2_4Dq3Onknz5TJLRKKtNmSH';

const SPREADSHEET_NAME = 'Rekap Kuesioner Usahatani';
const MAIN_SHEET = 'Responden';
const PDF_FOLDER_NAME = 'Lembar Jawaban (PDF)';
const JSON_FOLDER_NAME = 'Data Mentah (JSON)';

/** Jalankan fungsi ini SEKALI dari editor untuk memberi izin akses Drive & Sheets. */
function setup() {
  const root = DriveApp.getFolderById(FOLDER_ID);
  getSubFolder_(root, PDF_FOLDER_NAME);
  getSubFolder_(root, JSON_FOLDER_NAME);
  const ss = getSpreadsheet_(root);
  Logger.log('Siap. Rekap: ' + ss.getUrl());
}

function doGet() {
  return json_({ ok: true, message: 'Penerima kuesioner aktif.' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const p = JSON.parse(e.postData.contents);
    if (!p || p.app !== 'kuesioner-usahatani-v1' || !p.id || !Array.isArray(p.flat) || !p.report) {
      throw new Error('Data tidak dikenali.');
    }
    return json_(save_(p));
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function save_(p) {
  const root = DriveApp.getFolderById(FOLDER_ID);
  const ss = getSpreadsheet_(root);
  const main = getSheet_(ss, MAIN_SHEET);

  // Cegah data ganda jika pengiriman diulang.
  if (main.getLastRow() > 0) {
    const found = main.createTextFinder(p.id).matchEntireCell(true).findNext();
    if (found) return { ok: true, duplicate: true, sheetUrl: ss.getUrl() };
  }

  const base = safeName_([p.tanggal, p.kode, p.komoditas].filter(String).join('_')) || p.id;

  // 1. PDF lembar jawaban
  let pdfUrl = '';
  try {
    const html = reportHtml_(p.report);
    const pdf = Utilities.newBlob(html, 'text/html', base + '.html').getAs('application/pdf').setName(base + '.pdf');
    pdfUrl = getSubFolder_(root, PDF_FOLDER_NAME).createFile(pdf).getUrl();
  } catch (err) {
    pdfUrl = '';
  }

  // 2. Cadangan JSON
  getSubFolder_(root, JSON_FOLDER_NAME).createFile(
    base + '.json',
    JSON.stringify({ id: p.id, submittedAt: p.submittedAt, raw: p.raw }, null, 2),
    MimeType.PLAIN_TEXT
  );

  // 3. Rekap di Google Sheets
  const headers = p.flat.map(function (x) { return x[0]; });
  const row = p.flat.map(function (x) { return x[1]; });
  if (pdfUrl) { headers.push('Lembar jawaban (PDF)'); row.push(pdfUrl); }
  appendRows_(main, headers, [row]);

  (p.tables || []).forEach(function (t) {
    if (!t.rows || !t.rows.length) return;
    const th = ['ID Kiriman', 'Kode responden', 'Komoditas'].concat(t.headers);
    const rows = t.rows.map(function (r) { return [p.id, p.kode, p.komoditas].concat(r); });
    appendRows_(getSheet_(ss, t.sheet), th, rows);
  });

  return { ok: true, duplicate: false, pdfUrl: pdfUrl, sheetUrl: ss.getUrl() };
}

/* ---------- Drive & Sheets ---------- */

function getSubFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function getSpreadsheet_(root) {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('SS_ID');
  if (saved) {
    try { return SpreadsheetApp.openById(saved); } catch (err) {}
  }
  let ss;
  const files = root.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(SPREADSHEET_NAME);
    DriveApp.getFileById(ss.getId()).moveTo(root);
    ss.getSheets()[0].setName(MAIN_SHEET);
  }
  props.setProperty('SS_ID', ss.getId());
  return ss;
}

function getSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

/**
 * Menambah baris ke sheet. Kolom dicocokkan dengan nama header;
 * header baru otomatis ditambahkan di kanan.
 */
function appendRows_(sheet, headerNames, matrix) {
  const lastCol = sheet.getLastColumn();
  let header = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const isNew = header.length === 0;
  const index = {};
  header.forEach(function (h, i) { if (h !== '') index[h] = i; });

  const add = [];
  headerNames.forEach(function (h) {
    if (!(h in index)) {
      index[h] = header.length + add.length;
      add.push(h);
    }
  });
  if (add.length) {
    if (sheet.getMaxColumns() < header.length + add.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), header.length + add.length - sheet.getMaxColumns());
    }
    const hr = sheet.getRange(1, header.length + 1, 1, add.length);
    hr.setValues([add]).setFontWeight('bold').setBackground('#e7f0ea').setWrap(true).setVerticalAlignment('top');
    header = header.concat(add);
  }
  if (isNew) sheet.setFrozenRows(1);

  const width = header.length;
  const out = matrix.map(function (r) {
    const line = new Array(width).fill('');
    headerNames.forEach(function (h, i) { line[index[h]] = r[i] === undefined ? '' : r[i]; });
    return line;
  });

  const start = sheet.getLastRow() + 1;
  if (sheet.getMaxRows() < start + out.length - 1) {
    sheet.insertRowsAfter(sheet.getMaxRows(), start + out.length - 1 - sheet.getMaxRows());
  }
  const range = sheet.getRange(start, 1, out.length, width);
  // Teks disimpan sebagai teks (mencegah rumus & nol di depan hilang); angka tetap angka.
  range.setNumberFormats(out.map(function (line) {
    return line.map(function (v) { return typeof v === 'number' ? 'General' : '@'; });
  }));
  range.setValues(out);
}

/* ---------- PDF ---------- */

function reportHtml_(r) {
  const e = esc_;
  const th = 'border:1px solid #888;padding:3px 5px;background:#eee;text-align:left;font-size:9pt;';
  const td = 'border:1px solid #888;padding:3px 5px;vertical-align:top;font-size:9pt;';
  const tbl = 'border-collapse:collapse;width:100%;margin-bottom:8px;';
  let h = '<html><body style="font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;">';
  h += '<h1 style="font-size:15pt;margin:0;">' + e(String(r.title).toUpperCase()) + '</h1>';
  h += '<p style="margin:2px 0 10px;">' + e(r.subtitle) + '</p>';

  h += '<table style="' + tbl + '">';
  for (let i = 0; i < r.meta.length; i += 2) {
    const a = r.meta[i], b = r.meta[i + 1];
    h += '<tr><th style="' + th + 'width:17%;">' + e(a.l) + '</th><td style="' + td + 'width:33%;">' + e(a.v || '—') + '</td>' +
         '<th style="' + th + 'width:17%;">' + (b ? e(b.l) : '') + '</th><td style="' + td + 'width:33%;">' + (b ? e(b.v || '—') : '') + '</td></tr>';
  }
  h += '</table>';

  r.blocks.forEach(function (b) {
    h += '<h2 style="font-size:11pt;margin:14px 0 6px;border-bottom:1.5px solid #000;">' + e(b.id + '. ' + String(b.title).toUpperCase()) + '</h2>';
    let open = false;
    const closeQa = function () { if (open) { h += '</table>'; open = false; } };
    b.items.forEach(function (it) {
      if (it.table) {
        closeQa();
        h += '<h3 style="font-size:10pt;margin:10px 0 4px;">' + e(it.no + '. ' + it.q) + '</h3>';
        h += '<table style="' + tbl + '"><tr>' + it.table.headers.map(function (x) { return '<th style="' + th + '">' + e(x) + '</th>'; }).join('') + '</tr>';
        it.table.rows.forEach(function (row) {
          h += '<tr>' + row.map(function (x) { return '<td style="' + td + '">' + e(x) + '</td>'; }).join('') + '</tr>';
        });
        h += '</table>';
      } else {
        if (!open) {
          h += '<table style="' + tbl + '"><tr><th style="' + th + 'width:6%;">No</th><th style="' + th + 'width:46%;">Pertanyaan</th><th style="' + th + '">Jawaban</th></tr>';
          open = true;
        }
        h += '<tr><td style="' + td + 'text-align:center;">' + it.no + '</td><td style="' + td + '">' + e(it.q) + '</td><td style="' + td + '">' +
             e(it.a || '—').replace(/\n/g, '<br>') + '</td></tr>';
      }
    });
    closeQa();
  });

  h += '<h2 style="font-size:11pt;margin:14px 0 6px;border-bottom:1.5px solid #000;">CATATAN PEWAWANCARA</h2>';
  h += '<p style="border:1px solid #888;padding:6px;">' + e(r.note || '—').replace(/\n/g, '<br>') + '</p>';
  h += '</body></html>';
  return h;
}

/* ---------- util ---------- */

function esc_(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeName_(s) {
  return String(s || '').replace(/[\\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
