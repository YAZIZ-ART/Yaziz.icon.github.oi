(() => {
  'use strict';

  const F = window.FORM;
  const CFG = window.APP_CONFIG || {};
  const STORE = 'kuesioner-usahatani-draft-v1';
  const CARRY = ['h_komoditas', 'h_varietas', 'h_desa', 'h_jenis', 'h_pewawancara', 'h_tanggal', 'h_periode'];
  const MIRROR = { h_komoditas: 'q25', h_varietas: 'q26' };
  const ALL_ITEMS = F.sections.flatMap((s) => s.items);

  /* ---------- util ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function h(tag, props = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      e.append(c.nodeType ? c : document.createTextNode(c));
    });
    return e;
  }

  const uid = () =>
    window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  function today() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const optObj = (o) => (typeof o === 'string' ? { v: o } : o);
  const keyOf = (item, f) => (item.f.length === 1 ? `q${item.no}` : `q${item.no}_${f.k}`);
  const ariaOf = (item, f) => (f.label ? `${item.q} – ${f.label}` : item.q);

  /* Angka: terima "TT", angka biasa, atau angka dengan pemisah ribuan. Kembalikan null jika tidak valid. */
  function normNum(s) {
    s = String(s ?? '').trim();
    if (!s) return '';
    if (/^tt$/i.test(s)) return 'TT';
    if (/^[1-9]\d{0,2}([.,]\d{3})+$/.test(s)) return s.replace(/[.,]/g, '');
    if (/^\d+([.,]\d+)?$/.test(s)) return s.replace(',', '.');
    return null;
  }
  function toNumber(s) {
    const n = normNum(s);
    return typeof n === 'string' && n !== '' && n !== 'TT' ? Number(n) : null;
  }
  const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID');

  /* ---------- state ---------- */
  const freshState = () => ({ id: uid(), v: { h_tanggal: today() }, savedId: null });
  let state = null;
  try {
    state = JSON.parse(localStorage.getItem(STORE));
  } catch (e) {
    state = null;
  }
  if (!state || !state.v) state = freshState();

  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE, JSON.stringify(state));
        const t = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        $('#saved').textContent = `Draf tersimpan di perangkat ini pukul ${t}`;
      } catch (e) {
        $('#saved').textContent = 'Draf tidak dapat disimpan di perangkat ini';
      }
    }, 400);
  }

  function setVal(key, val) {
    if (val === '' || val === null || val === undefined || (Array.isArray(val) && !val.length)) delete state.v[key];
    else state.v[key] = val;
    scheduleSave();
    scheduleRefresh();
  }
  const getSel = (key) => {
    const v = state.v[key];
    return Array.isArray(v) ? v : v ? [v] : [];
  };

  /* ---------- render: fields ---------- */
  function renderNum(key, f, aria) {
    const inp = h('input', {
      type: 'text',
      inputmode: 'decimal',
      autocomplete: 'off',
      'data-key': key,
      'data-kind': 'num',
      'aria-label': aria,
      placeholder: f.ph,
    });
    return h(
      'div',
      { class: 'num' },
      f.prefix ? h('span', { class: 'adorn' }, f.prefix) : null,
      inp,
      f.unit ? h('span', { class: 'adorn' }, f.unit) : null,
      h('button', { type: 'button', class: 'tt', 'data-tt': '1', title: 'Petani tidak tahu atau lupa (isi TT)', 'aria-label': 'Isi TT' }, 'TT')
    );
  }

  function renderChoice(key, f, aria) {
    const multi = f.type === 'check';
    const box = h('div', { class: 'choice', 'data-key': key });
    const opts = h('div', { class: 'opts', role: multi ? 'group' : 'radiogroup', 'aria-label': aria });
    const extras = h('div', { class: 'extras' });
    f.opts.forEach((o0, i) => {
      const o = optObj(o0);
      const inp = h('input', {
        type: multi ? 'checkbox' : 'radio',
        name: key,
        value: o.v,
        'data-key': key,
        'data-kind': multi ? 'check' : 'radio',
        'data-excl': o.excl ? '1' : null,
      });
      opts.append(h('label', { class: 'opt' }, inp, h('span', {}, o.v)));
      if (o.input) {
        const ek = `${key}|${i}`;
        const ia = `${aria} – ${o.v}`;
        const field =
          o.input === 'num'
            ? h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', 'data-key': ek, 'data-kind': 'num', 'aria-label': ia })
            : h('input', { type: 'text', autocomplete: 'off', 'data-key': ek, 'data-kind': 'text', 'aria-label': ia, placeholder: 'Tulis jawaban' });
        extras.append(
          h(
            'label',
            { class: 'extra', 'data-val': o.v, hidden: true },
            h('span', { class: 'flabel' }, cap(o.ask || o.v)),
            o.prefix ? h('span', { class: 'adorn' }, o.prefix) : null,
            field,
            o.unit ? h('span', { class: 'adorn' }, o.unit) : null
          )
        );
      }
    });
    box.append(opts, extras);
    return box;
  }

  function renderField(key, f, aria) {
    const wrap = h('div', { class: 'field' + (f.type === 'textarea' ? ' wide' : '') });
    if (f.label) wrap.append(h('span', { class: 'flabel' }, f.label));
    if (f.type === 'radio' || f.type === 'check') wrap.append(renderChoice(key, f, aria));
    else if (f.type === 'num') wrap.append(renderNum(key, f, aria));
    else if (f.type === 'textarea')
      wrap.append(h('textarea', { rows: 3, autocomplete: 'off', 'data-key': key, 'data-kind': 'text', 'aria-label': aria }));
    else
      wrap.append(
        h('input', {
          type: f.type === 'date' ? 'date' : 'text',
          inputmode: f.type === 'tel' ? 'tel' : null,
          autocomplete: 'off',
          'data-key': key,
          'data-kind': 'text',
          'aria-label': aria,
          placeholder: f.ph,
        })
      );
    return wrap;
  }

  /* ---------- render: tabel ---------- */
  function renderTable(item) {
    const tb = item.table;
    const no = item.no;
    const thead = h(
      'thead',
      {},
      h('tr', {}, h('th', { scope: 'col', class: 'sticky' }, tb.rowHead), tb.cols.map((c) => h('th', { scope: 'col' }, c.h)))
    );
    const rows = tb.rows.map((label, i) => ({ label, i }));
    if (tb.other) rows.push({ other: true, i: tb.rows.length });

    const tbody = h('tbody');
    rows.forEach((r) => {
      const tr = h('tr');
      const rowName = r.other ? `${tb.rowHead} lainnya` : r.label;
      tr.append(
        r.other
          ? h(
              'th',
              { scope: 'row', class: 'sticky' },
              h('input', {
                type: 'text',
                autocomplete: 'off',
                placeholder: 'Lainnya: tulis nama',
                'data-key': `t${no}.r${r.i}.n`,
                'data-kind': 'text',
                'aria-label': rowName,
              })
            )
          : h('th', { scope: 'row', class: 'sticky' }, r.label)
      );
      tb.cols.forEach((c, j) => {
        const key = `t${no}.r${r.i}.c${j}`;
        const aria = `${rowName} – ${c.h}`;
        let cell;
        if (c.t === 'select') {
          cell = h(
            'select',
            { 'data-key': key, 'data-kind': 'select', 'aria-label': aria },
            h('option', { value: '' }, '–'),
            c.opts.map((o) => h('option', { value: o }, o))
          );
        } else if (c.t === 'num') {
          cell = h('input', {
            type: 'text',
            inputmode: 'decimal',
            autocomplete: 'off',
            'data-key': key,
            'data-kind': 'num',
            'data-col': j,
            'data-auto': c.auto ? c.auto.join(',') : null,
            'aria-label': aria,
          });
        } else {
          cell = h('input', { type: 'text', autocomplete: 'off', 'data-key': key, 'data-kind': 'text', 'aria-label': aria });
        }
        tr.append(h('td', { 'data-label': c.h }, cell));
      });
      tbody.append(tr);
    });

    const table = h('table', { class: 'grid' + (tb.narrow ? ' narrow' : '') }, thead, tbody);
    if (tb.cols.some((c) => c.sum)) {
      table.append(
        h(
          'tfoot',
          {},
          h(
            'tr',
            {},
            h('th', { scope: 'row', class: 'sticky' }, 'Jumlah'),
            tb.cols.map((c, j) => h('td', { 'data-label': c.sum ? c.h : null, class: c.sum ? null : 'blank' }, c.sum ? h('span', { class: 'sum', 'data-sum': `${no}.${j}` }, '–') : null))
          )
        )
      );
    }
    return h(
      'div',
      { class: 'table-block' },
      h('div', { class: 'table-scroll', tabindex: '0', role: 'region', 'aria-label': `Tabel pertanyaan ${no}` }, table),
      h('p', { class: 'hint' }, 'Isi hanya baris yang dipakai. Tulis angka saja; tulis TT jika tidak tahu.')
    );
  }

  /* ---------- render: halaman ---------- */
  function renderItem(item) {
    const row = h('div', { class: 'q-row' + (item.table ? ' is-table' : ''), id: `q${item.no}`, role: 'group', 'aria-labelledby': `ql${item.no}` });
    const label = h('div', { class: 'q-label' }, h('span', { class: 'no' }, `${item.no}.`), h('span', { class: 'txt', id: `ql${item.no}` }, item.q));
    const ans = h('div', { class: 'q-answer' });
    if (item.table) ans.append(renderTable(item));
    else {
      const fs = h('div', { class: 'fields' + (item.f.length > 1 ? ' multi' : '') });
      item.f.forEach((f) => fs.append(renderField(keyOf(item, f), f, ariaOf(item, f))));
      ans.append(fs);
    }
    row.append(label, ans);
    return row;
  }

  function build() {
    $('#title').textContent = F.title;
    $('#subtitle').textContent = F.subtitle;
    document.title = `${F.title} – ${F.subtitle}`;

    const form = $('#form');

    const metaGrid = h('div', { class: 'meta-grid' });
    F.meta.forEach((f) => metaGrid.append(renderField(f.key, f, f.label)));
    form.append(h('section', { class: 'block', 'aria-label': 'Identitas wawancara' }, metaGrid));

    const c = F.consent;
    form.append(
      h(
        'section',
        { class: 'block consent', 'aria-label': 'Persetujuan responden' },
        h('p', {}, h('strong', {}, 'Persetujuan responden: '), F.consentText),
        renderField(c.key, c, c.label)
      ),
      h('section', { class: 'howto' }, h('h2', {}, 'Cara mengisi'), h('p', {}, F.howTo))
    );

    const chips = $('#chips');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setCurrent(en.target.dataset.id)),
      { rootMargin: '-150px 0px -65% 0px' }
    );
    F.sections.forEach((s) => {
      const sec = h(
        'section',
        { class: 'sec', id: `sec-${s.id}`, 'data-id': s.id, 'aria-labelledby': `h-${s.id}` },
        h('h2', { id: `h-${s.id}` }, `${s.id}. ${s.title}`)
      );
      s.items.forEach((it) => sec.append(renderItem(it)));
      form.append(sec);
      io.observe(sec);
      chips.append(h('a', { class: 'chip', href: `#sec-${s.id}`, 'data-id': s.id, title: s.title }, s.id));
    });

    const end = h(
      'section',
      { class: 'block end' },
      h('div', { class: 'field wide' }, h('span', { class: 'flabel' }, F.note.label), h('textarea', { rows: 3, autocomplete: 'off', 'data-key': F.note.key, 'data-kind': 'text', 'aria-label': F.note.label })),
      h('p', { class: 'thanks' }, F.closing),
      h('div', { id: 'errors', class: 'errors', role: 'alert', hidden: true }),
      h(
        'div',
        { class: 'actions' },
        h('button', { type: 'button', class: 'btn', id: 'btn-clear' }, 'Kosongkan formulir'),
        h('button', { type: 'button', class: 'btn', id: 'btn-print' }, 'Cetak / simpan PDF'),
        h('button', { type: 'submit', class: 'btn primary', id: 'btn-submit' }, CFG.endpoint ? 'Simpan ke Google Drive' : 'Selesai & periksa')
      ),
      CFG.endpoint ? null : h('p', { class: 'hint' }, 'Penyimpanan ke Google Drive belum diaktifkan. Lihat README untuk langkah pemasangan.')
    );
    form.append(end);
  }

  function setCurrent(id) {
    $$('#chips .chip').forEach((c) => {
      if (c.dataset.id === id) {
        c.setAttribute('aria-current', 'true');
        const box = $('#chips');
        box.scrollTo({ left: c.offsetLeft - box.clientWidth / 2 + c.clientWidth / 2, behavior: 'smooth' });
      } else c.removeAttribute('aria-current');
    });
  }

  /* ---------- restore ---------- */
  function restoreAll() {
    $$('#form [data-key]').forEach((el) => {
      const k = el.dataset.key;
      const kind = el.dataset.kind;
      if (kind === 'radio' || kind === 'check') el.checked = getSel(k).includes(el.value);
      else if (kind) el.value = state.v[k] ?? '';
    });
    $$('#form .extra').forEach((ex) => {
      const key = ex.closest('.choice').dataset.key;
      ex.hidden = !getSel(key).includes(ex.dataset.val);
    });
    $$('#form [data-auto]').forEach((cell) => {
      const [a, b] = cell.dataset.auto.split(',');
      const tr = cell.closest('tr');
      const va = toNumber(tr.querySelector(`[data-col="${a}"]`).value);
      const vb = toNumber(tr.querySelector(`[data-col="${b}"]`).value);
      if (cell.value && !(va !== null && vb !== null && Number(cell.value) === Math.round(va * vb * 100) / 100)) cell.dataset.manual = '1';
      else delete cell.dataset.manual;
    });
    $$('.invalid').forEach((e) => e.classList.remove('invalid'));
    $$('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
    $$('.err').forEach((e) => e.remove());
    $('#errors').hidden = true;
    recalcSums();
    refresh();
    scheduleSave();
  }

  /* ---------- hitung otomatis ---------- */
  function autoCalc(t) {
    const tr = t.closest('tr');
    if (!tr) return;
    const cell = tr.querySelector('[data-auto]');
    if (!cell) return;
    if (t === cell) {
      if (t.value === '') delete t.dataset.manual;
      else t.dataset.manual = '1';
      return;
    }
    if (cell.dataset.manual) return;
    const [a, b] = cell.dataset.auto.split(',');
    const va = toNumber(tr.querySelector(`[data-col="${a}"]`).value);
    const vb = toNumber(tr.querySelector(`[data-col="${b}"]`).value);
    const out = va !== null && vb !== null ? String(Math.round(va * vb * 100) / 100) : '';
    cell.value = out;
    setVal(cell.dataset.key, out);
  }

  function recalcSums() {
    $$('[data-sum]').forEach((sp) => {
      const [no, j] = sp.dataset.sum.split('.');
      let total = 0;
      let any = false;
      $$(`input[data-key^="t${no}."][data-col="${j}"]`).forEach((i) => {
        const n = toNumber(i.value);
        if (n !== null) {
          total += n;
          any = true;
        }
      });
      sp.textContent = any ? rupiah(total) : '–';
    });
  }

  /* ---------- validasi tampilan ---------- */
  function markInvalid(el, msg) {
    el.setAttribute('aria-invalid', 'true');
    const f = el.closest('.field, .extra');
    if (f) {
      f.classList.add('invalid');
      if (!f.querySelector('.err')) f.append(h('span', { class: 'err' }, msg));
    }
  }
  function clearInvalid(el) {
    el.removeAttribute('aria-invalid');
    const f = el.closest('.field, .extra');
    if (f) {
      f.classList.remove('invalid');
      const e = f.querySelector('.err');
      if (e) e.remove();
    }
  }

  /* ---------- event ---------- */
  function wire() {
    const form = $('#form');

    form.addEventListener('input', (e) => {
      const t = e.target;
      const key = t.dataset && t.dataset.key;
      const kind = t.dataset && t.dataset.kind;
      if (!key || kind === 'radio' || kind === 'check') return;
      if (kind === 'num') {
        const c = t.value.replace(/[^0-9.,tT]/g, '');
        if (c !== t.value) t.value = c;
        clearInvalid(t);
      }
      const prev = state.v[key];
      setVal(key, t.value);
      if (MIRROR[key]) {
        const tk = MIRROR[key];
        if (!state.v[tk] || state.v[tk] === prev) {
          setVal(tk, t.value);
          const target = $(`[data-key="${tk}"]`);
          if (target) target.value = t.value;
        }
      }
      if (kind === 'num') {
        autoCalc(t);
        recalcSums();
      }
    });

    form.addEventListener('change', (e) => {
      const t = e.target;
      if (!t.dataset || !t.dataset.key) return;
      if (t.dataset.kind === 'select') setVal(t.dataset.key, t.value);
      if (t.dataset.kind === 'check') onCheck(t);
    });

    form.addEventListener('click', (e) => {
      const t = e.target;
      if (t.matches && t.matches('input[type="radio"][data-key]')) onRadio(t);
      const tt = t.closest && t.closest('[data-tt]');
      if (tt) {
        const inp = tt.parentElement.querySelector('input');
        inp.value = inp.value === 'TT' ? '' : 'TT';
        clearInvalid(inp);
        setVal(inp.dataset.key, inp.value);
        inp.focus();
      }
    });

    form.addEventListener('focusout', (e) => {
      const t = e.target;
      if (!t.dataset || t.dataset.kind !== 'num') return;
      const n = normNum(t.value);
      if (n === null) {
        markInvalid(t, 'Isi angka atau TT');
        return;
      }
      clearInvalid(t);
      if (n !== t.value) {
        t.value = n;
        setVal(t.dataset.key, n);
      }
      autoCalc(t);
      recalcSums();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submit();
    });

    $('#btn-clear').addEventListener('click', () => {
      if (!confirm('Hapus semua isian di formulir ini?')) return;
      state = freshState();
      restoreAll();
      window.scrollTo({ top: 0 });
    });
    $('#btn-print').addEventListener('click', printCopy);
  }

  function syncExtras(key) {
    const box = $(`.choice[data-key="${CSS.escape(key)}"]`);
    if (!box) return;
    const sel = getSel(key);
    $$('.extra', box).forEach((ex) => (ex.hidden = !sel.includes(ex.dataset.val)));
  }

  function onRadio(t) {
    const key = t.dataset.key;
    if (state.v[key] === t.value) {
      t.checked = false;
      setVal(key, '');
    } else setVal(key, t.value);
    syncExtras(key);
  }

  function onCheck(t) {
    const key = t.dataset.key;
    const group = $$(`input[type="checkbox"][data-key="${CSS.escape(key)}"]`);
    if (t.checked) group.forEach((g) => g !== t && (t.dataset.excl || g.dataset.excl) && (g.checked = false));
    setVal(
      key,
      group.filter((g) => g.checked).map((g) => g.value)
    );
    syncExtras(key);
  }

  /* ---------- jawaban -> teks ---------- */
  function optText(o, val) {
    if (!val) return o.v;
    const core = (o.prefix ? o.prefix + ' ' : '') + val + (o.unit && val !== 'TT' ? ' ' + o.unit : '');
    if (o.v === 'Lainnya') return `Lainnya: ${val}`;
    if (o.input === 'num') return `${o.v}, ${o.ask ? o.ask + ' ' : ''}${core}`;
    return o.ask ? `${o.v}, ${o.ask}: ${core}` : `${o.v}, ${core}`;
  }

  function fieldText(key, f) {
    if (f.type === 'radio' || f.type === 'check') {
      return getSel(key)
        .map((v) => {
          const i = f.opts.findIndex((o) => optObj(o).v === v);
          if (i < 0) return v;
          const o = optObj(f.opts[i]);
          if (!o.input) return v;
          return optText(o, String(state.v[`${key}|${i}`] ?? '').trim());
        })
        .join('; ');
    }
    return String(state.v[key] ?? '').trim();
  }

  function hasAnswer(it) {
    if (it.table) {
      const p = `t${it.no}.`;
      return Object.keys(state.v).some((k) => k.startsWith(p) && String(state.v[k]).trim() !== '');
    }
    return it.f.some((f) => fieldText(keyOf(it, f), f) !== '');
  }

  function itemAnswer(it) {
    const parts = [];
    it.f.forEach((f) => {
      let t = fieldText(keyOf(it, f), f);
      if (!t) return;
      if (f.type === 'num' && t !== 'TT') t = (f.prefix ? f.prefix + ' ' : '') + t + (f.unit ? ' ' + f.unit : '');
      parts.push(it.f.length > 1 && f.label ? `${f.label}: ${t}` : t);
    });
    return parts.join('\n');
  }

  /* ---------- progres ---------- */
  let raf = 0;
  function scheduleRefresh() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(refresh);
  }
  function refresh() {
    let done = 0;
    F.sections.forEach((s) => {
      let n = 0;
      s.items.forEach((it) => hasAnswer(it) && n++);
      done += n;
      const chip = $(`#chips .chip[data-id="${s.id}"]`);
      if (chip) chip.dataset.state = n === s.items.length ? 'done' : n > 0 ? 'part' : '';
    });
    const total = ALL_ITEMS.length;
    $('#prog-text').textContent = `${done} dari ${total} pertanyaan terisi`;
    $('#prog-bar').style.width = `${(done / total) * 100}%`;
    $('#prog').setAttribute('aria-valuenow', String(done));
    $('#prog').setAttribute('aria-valuemax', String(total));
  }

  /* ---------- laporan & payload ---------- */
  function typed(f, text) {
    if (f.type === 'num') {
      const n = normNum(text);
      return typeof n === 'string' && n !== '' && n !== 'TT' ? Number(n) : text;
    }
    return text;
  }

  function colName(it, f) {
    const base = `Q${it.no} ${it.q}`;
    let name = base.length > 80 ? base.slice(0, 77) + '…' : base;
    if (it.f.length > 1 && f.label) name += ` – ${f.label}`;
    if (f.type === 'num' && (f.unit || f.prefix)) name += ` (${f.prefix || f.unit})`;
    return name;
  }

  function tableData(it) {
    const tb = it.table;
    const no = it.no;
    const rows = tb.rows.map((label, i) => ({ label, i }));
    if (tb.other) rows.push({ other: true, i: tb.rows.length });
    const all = [];
    const sheetRows = [];
    rows.forEach((r) => {
      const label = r.other ? String(state.v[`t${no}.r${r.i}.n`] ?? '').trim() : r.label;
      const cells = tb.cols.map((c, j) => String(state.v[`t${no}.r${r.i}.c${j}`] ?? '').trim());
      const has = cells.some((x) => x !== '');
      if (!r.other || has || label) all.push([label || 'Lainnya', ...cells]);
      if (has || (r.other && label)) {
        sheetRows.push([label || 'Lainnya', ...cells.map((x, j) => (tb.cols[j].t === 'num' ? typed({ type: 'num' }, x) : x))]);
      }
    });
    return { headers: [tb.rowHead, ...tb.cols.map((c) => c.h)], rows: all, sheetRows };
  }

  function buildReport() {
    const meta = F.meta.map((f) => ({ l: f.label, v: fieldText(f.key, f) }));
    meta.push({ l: F.consent.label, v: fieldText(F.consent.key, F.consent) });
    const blocks = F.sections.map((s) => ({
      id: s.id,
      title: s.title,
      items: s.items.map((it) => {
        if (it.table) {
          const td = tableData(it);
          return { no: it.no, q: it.q, table: { headers: td.headers, rows: td.rows } };
        }
        return { no: it.no, q: it.q, a: itemAnswer(it) };
      }),
    }));
    return { id: state.id, title: F.title, subtitle: F.subtitle, meta, blocks, note: String(state.v[F.note.key] ?? '').trim() };
  }

  function buildPayload() {
    const flat = [
      ['ID Kiriman', state.id],
      ['Waktu kirim', new Date().toISOString()],
    ];
    F.meta.forEach((f) => flat.push([f.label, fieldText(f.key, f)]));
    flat.push([F.consent.label, fieldText(F.consent.key, F.consent)]);
    ALL_ITEMS.forEach((it) => {
      if (it.table) return;
      it.f.forEach((f) => flat.push([colName(it, f), typed(f, fieldText(keyOf(it, f), f))]));
    });
    flat.push([F.note.label, String(state.v[F.note.key] ?? '').trim()]);

    const tables = ALL_ITEMS.filter((it) => it.table).map((it) => {
      const td = tableData(it);
      return { sheet: it.sheet, headers: td.headers, rows: td.sheetRows };
    });

    return {
      app: 'kuesioner-usahatani-v1',
      id: state.id,
      submittedAt: new Date().toISOString(),
      kode: String(state.v.h_kode ?? '').trim(),
      komoditas: String(state.v.h_komoditas ?? '').trim(),
      tanggal: String(state.v.h_tanggal ?? '').trim(),
      flat,
      tables,
      report: buildReport(),
      raw: state.v,
    };
  }

  /* ---------- tampilan cetak ---------- */
  function renderReport(rep, box) {
    box.replaceChildren();
    box.append(h('h1', {}, rep.title.toUpperCase()), h('p', { class: 'p-sub' }, rep.subtitle));
    const mt = h('table', { class: 'p-meta' });
    for (let i = 0; i < rep.meta.length; i += 2) {
      const a = rep.meta[i];
      const b = rep.meta[i + 1];
      mt.append(h('tr', {}, h('th', {}, a.l), h('td', {}, a.v || '—'), b ? h('th', {}, b.l) : h('th'), b ? h('td', {}, b.v || '—') : h('td')));
    }
    box.append(mt);
    rep.blocks.forEach((b) => {
      box.append(h('h2', {}, `${b.id}. ${b.title.toUpperCase()}`));
      const qa = h('table', { class: 'p-qa' }, h('thead', {}, h('tr', {}, h('th', { class: 'c-no' }, 'No'), h('th', {}, 'Pertanyaan'), h('th', {}, 'Jawaban'))));
      const body = h('tbody');
      qa.append(body);
      let hasQA = false;
      const flush = () => {
        if (hasQA) box.append(qa.cloneNode(true));
        body.replaceChildren();
        hasQA = false;
      };
      b.items.forEach((it) => {
        if (it.table) {
          flush();
          box.append(
            h('h3', {}, `${it.no}. ${it.q}`),
            h(
              'table',
              { class: 'p-grid' },
              h('thead', {}, h('tr', {}, it.table.headers.map((x) => h('th', {}, x)))),
              h('tbody', {}, it.table.rows.map((r) => h('tr', {}, r.map((x) => h('td', {}, x)))))
            )
          );
        } else {
          hasQA = true;
          const ans = h('td', {});
          (it.a || '—').split('\n').forEach((line, i) => {
            if (i) ans.append(h('br'));
            ans.append(line);
          });
          body.append(h('tr', {}, h('td', { class: 'c-no' }, String(it.no)), h('td', {}, it.q), ans));
        }
      });
      flush();
    });
    box.append(h('h2', {}, 'CATATAN PEWAWANCARA'), h('p', { class: 'p-note' }, rep.note || '—'));
  }

  function printCopy() {
    const rep = buildReport();
    renderReport(rep, $('#print-view'));
    const old = document.title;
    document.title = `Kuesioner_${(state.v.h_kode || 'draf').toString().replace(/[^\w-]+/g, '_')}`;
    window.print();
    setTimeout(() => (document.title = old), 500);
  }

  /* ---------- kirim ---------- */
  function validate() {
    const errs = [];
    $$('.invalid').forEach((e) => e.classList.remove('invalid'));
    $$('.err').forEach((e) => e.remove());

    F.meta
      .filter((f) => f.req)
      .forEach((f) => {
        if (!String(state.v[f.key] ?? '').trim()) {
          const el = $(`[data-key="${f.key}"]`);
          markInvalid(el, 'Wajib diisi');
          errs.push({ el, msg: `${f.label} wajib diisi` });
        }
      });

    const consent = state.v[F.consent.key];
    if (consent !== 'Bersedia') {
      errs.push({
        el: $('.consent'),
        msg: consent === 'Tidak bersedia' ? 'Responden tidak bersedia diwawancarai, jadi data tidak disimpan.' : 'Persetujuan responden belum dipilih.',
      });
    }

    $$('#form input[data-kind="num"]').forEach((el) => {
      if (el.closest('[hidden]')) return;
      const n = normNum(el.value);
      if (n === null) {
        markInvalid(el, 'Isi angka atau TT');
        errs.push({ el, msg: `Angka tidak valid: ${el.getAttribute('aria-label')}` });
      } else if (n !== el.value) {
        el.value = n;
        setVal(el.dataset.key, n);
      }
    });
    return errs;
  }

  function showErrors(errs) {
    const box = $('#errors');
    box.replaceChildren();
    if (!errs.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.append(h('strong', {}, 'Periksa kembali:'));
    const ul = h('ul');
    errs.slice(0, 8).forEach((er) => {
      const b = h('button', { type: 'button', class: 'linklike' }, er.msg);
      b.addEventListener('click', () => {
        er.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (er.el.focus && er.el.tagName !== 'SECTION') er.el.focus({ preventScroll: true });
      });
      ul.append(h('li', {}, b));
    });
    if (errs.length > 8) ul.append(h('li', {}, `…dan ${errs.length - 8} lainnya`));
    box.append(ul);
    errs[0].el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function setBusy(on) {
    const b = $('#btn-submit');
    b.disabled = on;
    b.textContent = on ? 'Menyimpan…' : CFG.endpoint ? 'Simpan ke Google Drive' : 'Selesai & periksa';
  }

  async function submit() {
    const errs = validate();
    showErrors(errs);
    if (errs.length) return;

    if (state.savedId === state.id && !confirm('Responden ini sudah pernah tersimpan. Simpan lagi sebagai data baru?')) return;
    if (state.savedId === state.id) {
      state.id = uid();
      state.savedId = null;
    }

    const payload = buildPayload();
    if (!CFG.endpoint) {
      showResult({ kind: 'local', payload });
      return;
    }

    setBusy(true);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 90000);
    try {
      const res = await fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: ctl.signal,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Server menolak data.');
      state.savedId = payload.id;
      scheduleSave();
      showResult({ kind: 'ok', data, payload });
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'Waktu habis. Periksa sinyal internet lalu coba lagi.' : err.message || 'Tidak dapat terhubung ke server.';
      showResult({ kind: 'error', msg, payload });
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  function download(name, text, type) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    document.body.append(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  function newRespondent() {
    const keep = {};
    CARRY.forEach((k) => state.v[k] && (keep[k] = state.v[k]));
    state = { id: uid(), v: keep, savedId: null };
    restoreAll();
    window.scrollTo({ top: 0 });
  }

  function showResult(r) {
    const dlg = $('#result');
    const body = $('#result-body');
    body.replaceChildren();
    const btns = h('div', { class: 'actions' });
    const closeBtn = h('button', { type: 'button', class: 'btn' }, 'Tutup');
    closeBtn.addEventListener('click', () => dlg.close());

    const jsonBtn = h('button', { type: 'button', class: 'btn' }, 'Unduh data (JSON)');
    jsonBtn.addEventListener('click', () =>
      download(`kuesioner_${r.payload.kode || 'draf'}.json`, JSON.stringify({ id: r.payload.id, raw: r.payload.raw, report: r.payload.report }, null, 2), 'application/json')
    );
    const printBtn = h('button', { type: 'button', class: 'btn' }, 'Cetak / simpan PDF');
    printBtn.addEventListener('click', () => {
      dlg.close();
      printCopy();
    });

    if (r.kind === 'ok') {
      const d = r.data;
      body.append(
        h('h2', {}, d.duplicate ? 'Data ini sudah tersimpan sebelumnya' : 'Jawaban tersimpan di Google Drive'),
        h('p', {}, `Responden ${r.payload.kode}${r.payload.komoditas ? ' – ' + r.payload.komoditas : ''}.`)
      );
      const links = h('p', { class: 'links' });
      if (d.pdfUrl) links.append(h('a', { href: d.pdfUrl, target: '_blank', rel: 'noopener' }, 'Buka lembar jawaban (PDF)'));
      if (d.sheetUrl) links.append(h('a', { href: d.sheetUrl, target: '_blank', rel: 'noopener' }, 'Buka rekap (Google Sheets)'));
      body.append(links);
      const again = h('button', { type: 'button', class: 'btn primary' }, 'Isi responden baru');
      again.addEventListener('click', () => {
        dlg.close();
        newRespondent();
      });
      btns.append(again, closeBtn);
    } else if (r.kind === 'error') {
      body.append(
        h('h2', {}, 'Belum tersimpan'),
        h('p', {}, r.msg),
        h('p', { class: 'hint' }, 'Isian Anda aman di perangkat ini. Coba lagi setelah sinyal membaik, atau unduh cadangan.')
      );
      const retry = h('button', { type: 'button', class: 'btn primary' }, 'Coba lagi');
      retry.addEventListener('click', () => {
        dlg.close();
        submit();
      });
      btns.append(retry, jsonBtn, printBtn, closeBtn);
    } else {
      body.append(
        h('h2', {}, 'Isian lengkap'),
        h('p', {}, 'Penyimpanan ke Google Drive belum diaktifkan, jadi data belum dikirim ke mana pun. Anda dapat mencetak atau mengunduh salinannya.')
      );
      btns.append(printBtn, jsonBtn, closeBtn);
    }
    body.append(btns);
    dlg.showModal();
  }

  /* ---------- mulai ---------- */
  build();
  wire();
  restoreAll();
})();
