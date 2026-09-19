/* ============================================================
   PAINEL DA FERNANDA. A PRIMEIRA COISA que roda aqui é conferir
   a sessão. Sem sessão, vai para o login. O painel só aparece
   depois dessa conferência.
   ============================================================ */
(async function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- 1. CONFERIR A SESSÃO ---------- */
  function falha(txt) { $('#espera').textContent = txt; }
  if (!window.sb) { falha('Não consegui carregar o Supabase. Confira a internet e recarregue a página.'); return; }
  let sessao = null;
  try { const r = await sb.auth.getSession(); sessao = r.data && r.data.session; } catch (e) { /* cai no login */ }
  if (!sessao) { location.replace('../login/'); return; }
  $('#espera').hidden = true;
  $('#app').hidden = false;
  $('#emailUser').textContent = sessao.user.email || '';
  sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') location.replace('../login/'); });

  /* ---------- utilidades ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const dataDe = (s) => { if (!s) return null; const p = String(s).slice(0, 10).split('-').map(Number); return p.length === 3 && !isNaN(p[0]) ? new Date(p[0], p[1] - 1, p[2]) : null; };
  const hoje = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const somaDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const dif = (a, b) => Math.round((a - b) / 86400000);
  const br = (s) => { const d = dataDe(s); return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : '-'; };
  const moeda = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const isEx = (s) => /^\(exemplo\)/i.test(String(s || ''));
  const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
  const seguroUrl = (u) => /^https?:\/\//i.test(String(u || '')) ? u : '';

  const IC = {
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeoff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A9.6 9.6 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.3 4M6.3 6.4C3.6 8.2 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 004.2 4.2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/></svg>',
    chev: '<svg class="sv" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 01-13.4 7.8L3 21l1.3-4.4A9 9 0 1121 12zM9 9c0 3 3 6 6 6l1-2-2-1-1 .7c-.8-.4-1.6-1.2-2-2L11.7 10l-1-2L9 9z"/></svg>',
    drag: '<svg viewBox="0 0 24 24"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    baixar: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M4 20h16"/></svg>'
  };

  let toastT;
  function toast(txt, erro) {
    const t = $('#toast'); t.textContent = txt; t.className = 'toast' + (erro ? ' erro' : ''); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4500);
  }

  /* ---------- erros em português ---------- */
  function traduzErro(e, tabela) {
    const m = (e && e.message) || String(e || ''); const c = (e && e.code) || '';
    const coluna = /column/i.test(m);
    if (!coluna && (c === '42P01' || c === 'PGRST205' || /does not exist|schema cache|find the table/i.test(m))) return 'A tabela "' + tabela + '" não existe no banco. Rode o arquivo banco.sql no Supabase.';
    if (c === '42703' || c === 'PGRST204' || coluna) return 'Falta um campo na tabela "' + tabela + '" (' + m + '). Rode o banco.sql de novo no Supabase.';
    if (c === '42501' || /row-level security|permission denied|jwt/i.test(m)) return 'Sem permissão. Confira se você entrou com o mesmo e-mail que colocou no banco.sql.';
    if (c === '23514') return 'Algum valor não é aceito. Confira as opções escolhidas.';
    if (/fetch|network/i.test(m)) return 'Sem conexão com o banco. Confira a internet.';
    return 'Não consegui salvar: ' + m;
  }

  /* ---------- dados ---------- */
  const S = { videos: [], marcas: [], cal: [], camp: [], marcados: new Set(), visitas: [] };
  const AVISOS = {};
  const TABELA = { videos: 'videos', marcas: 'marcas', cal: 'calendario', camp: 'campanhas', marcados: 'marcados', visitas: 'visitas' };

  async function carregar(chave) {
    const nome = TABELA[chave];
    try {
      let q = sb.from(nome).select('*');
      if (chave === 'visitas') q = q.gte('data', somaDias(hoje(), -14).toISOString());
      const r = await q.limit(5000);
      if (r.error) { AVISOS[nome] = traduzErro(r.error, nome); return []; }
      delete AVISOS[nome]; return r.data || [];
    } catch (e) { AVISOS[nome] = traduzErro(e, nome); return []; }
  }
  async function recarregar(chave) {
    const d = await carregar(chave);
    if (chave === 'marcados') S.marcados = new Set(d.map((x) => x.chave)); else S[chave] = d;
  }
  async function gravar(chave, obj, id) {
    const nome = TABELA[chave];
    try {
      const r = id ? await sb.from(nome).update(obj).eq('id', id) : await sb.from(nome).insert(obj);
      return r.error ? traduzErro(r.error, nome) : null;
    } catch (e) { return traduzErro(e, nome); }
  }
  async function remover(chave, id) {
    const nome = TABELA[chave];
    try { const r = await sb.from(nome).delete().eq('id', id); return r.error ? traduzErro(r.error, nome) : null; }
    catch (e) { return traduzErro(e, nome); }
  }

  function mostrarAvisos() {
    const nomes = Object.keys(AVISOS);
    $('#avisos').innerHTML = nomes.map((n) => '<div class="aviso" role="alert"><b>Atenção:</b> ' + esc(AVISOS[n]) + '</div>').join('');
  }

  /* ---------- janela e formulário ---------- */
  let janAtiva = null, focoAntes = null;
  function fecharJanela() {
    if (!janAtiva) return; janAtiva.remove(); janAtiva = null;
    document.removeEventListener('keydown', teclaJanela);
    if (focoAntes && focoAntes.focus && document.contains(focoAntes)) focoAntes.focus();
  }
  function teclaJanela(e) {
    if (e.key === 'Escape') { fecharJanela(); return; }
    if (e.key === 'Tab' && janAtiva) {
      const f = $$('button,input,select,textarea,a[href]', janAtiva).filter((x) => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  }
  function abrirJanela(html, larga) {
    if (janAtiva) { janAtiva.remove(); janAtiva = null; document.removeEventListener('keydown', teclaJanela); } else focoAntes = document.activeElement;
    const ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="jan' + (larga ? ' larga' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) fecharJanela(); });
    $('#modalRaiz').appendChild(ov); janAtiva = ov;
    document.addEventListener('keydown', teclaJanela);
    const p = $('input:not([type=hidden]),select,textarea,button', ov); if (p) p.focus();
    return ov;
  }

  function campoHtml(c, v) {
    const val = v == null ? '' : v;
    const st = c.meio ? '' : ' style="grid-column:1/-1"';
    const id = 'f_' + c.k;
    if (c.tipo === 'sim') return '<div class="f linha"' + st + '><input type="checkbox" id="' + id + '" name="' + c.k + '"' + (v ? ' checked' : '') + '><label for="' + id + '">' + esc(c.label) + '</label></div>';
    let el;
    if (c.tipo === 'longo') el = '<textarea id="' + id + '" name="' + c.k + '">' + esc(val) + '</textarea>';
    else if (c.tipo === 'lista') el = '<select id="' + id + '" name="' + c.k + '">' + c.opcoes.map((o) => { const ov = Array.isArray(o) ? o[0] : o, ol = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(ov) + '"' + (String(ov) === String(val) ? ' selected' : '') + '>' + esc(ol) + '</option>'; }).join('') + '</select>';
    else el = '<input id="' + id + '" name="' + c.k + '" type="' + (c.tipo === 'data' ? 'date' : c.tipo === 'numero' ? 'number' : 'text') + '"' + (c.tipo === 'numero' ? ' step="' + (c.passo || 'any') + '" min="0"' : '') + ' value="' + esc(String(val).slice(0, c.tipo === 'data' ? 10 : 9999)) + '">';
    return '<div class="f"' + st + '><label for="' + id + '">' + esc(c.label) + (c.obrig ? ' *' : '') + '</label>' + el + (c.dica ? '<p class="dica">' + esc(c.dica) + '</p>' : '') + '</div>';
  }

  function formulario(o) {
    const v = o.valores || {};
    const ov = abrirJanela('<h2>' + esc(o.titulo) + '</h2><div class="jan-err" hidden></div><form novalidate><div class="grid2">' + o.campos.map((c) => campoHtml(c, v[c.k])).join('') + '</div><div class="jan-bt">' + (o.aoApagar ? '<button type="button" class="btn perigo esq" data-apagar>Apagar</button>' : '') + '<button type="button" class="btn sec" data-cancelar>Cancelar</button><button type="submit" class="btn">Salvar</button></div></form>', o.larga);
    const err = $('.jan-err', ov), form = $('form', ov);
    const mostraErro = (t) => { err.textContent = t; err.hidden = false; err.scrollIntoView({ block: 'nearest' }); };
    $('[data-cancelar]', ov).addEventListener('click', fecharJanela);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); err.hidden = true;
      const obj = {};
      for (const c of o.campos) {
        const el = form.elements[c.k];
        let val = c.tipo === 'sim' ? el.checked : el.value.trim();
        if (c.obrig && !val) { mostraErro('Preencha o campo "' + c.label + '".'); el.focus(); return; }
        if (c.tipo === 'numero') val = val === '' ? 0 : Number(val);
        if (c.tipo === 'data' && val === '') val = null;
        obj[c.k] = val;
      }
      const bt = $('button[type=submit]', ov); bt.disabled = true;
      const erro = await o.aoSalvar(obj);
      bt.disabled = false;
      if (erro) { mostraErro(erro); return; }
      fecharJanela(); toast('Salvo!');
    });
    if (o.aoApagar) {
      const ba = $('[data-apagar]', ov); let pronto = false, t;
      ba.addEventListener('click', async () => {
        if (!pronto) { pronto = true; ba.textContent = 'Clique de novo para apagar'; t = setTimeout(() => { pronto = false; ba.textContent = 'Apagar'; }, 4000); return; }
        clearTimeout(t); ba.disabled = true;
        const erro = await o.aoApagar();
        if (erro) { ba.disabled = false; mostraErro(erro); return; }
        fecharJanela(); toast('Apagado.');
      });
    }
  }

  function baixarCSV(arquivo, cab, linhas, colsSeguras) {
    const cel = (v, i) => {
      let s = String(v == null ? '' : v);
      if (!(colsSeguras || []).includes(i) && /^[=+\-@\t\r]/.test(s)) s = "'" + s; /* evita fórmulas no Excel */
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const txt = [cab].concat(linhas).map((l) => l.map(cel).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + txt], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = arquivo;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  const painel = () => $('#painel');
  const vazio = (t) => '<p class="vazio">' + t + '</p>';

  /* =========================================================
     1. PORTFÓLIO
     ========================================================= */
  const CAMPOS_VIDEO = [
    { k: 'titulo', label: 'Título', obrig: true },
    { k: 'link', label: 'Link do vídeo', dica: 'Reels, TikTok ou YouTube. O card do site abre este link.' },
    { k: 'nicho', label: 'Nicho', meio: true, dica: 'Ex: Beleza. Os filtros do site nascem daqui.' },
    { k: 'formato', label: 'Formato', meio: true, dica: 'Ex: 9:16' },
    { k: 'marca', label: 'Marca', meio: true },
    { k: 'destaque', label: 'Destaque', meio: true, dica: 'Ex: 2,4M views. Se preencher, vira card de destaque.' },
    { k: 'capa', label: 'Endereço da imagem de capa (opcional)' },
    { k: 'visivel', label: 'Mostrar no site', tipo: 'sim' }
  ];
  const ordenaVideos = () => S.videos.slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || String(a.criado_em).localeCompare(String(b.criado_em)));

  function abrirVideo(v) {
    const novo = !v;
    formulario({
      titulo: novo ? 'Adicionar vídeo' : 'Editar vídeo', campos: CAMPOS_VIDEO,
      valores: novo ? { visivel: true } : v,
      aoSalvar: async (obj) => {
        if (novo) obj.ordem = S.videos.reduce((m, x) => Math.max(m, x.ordem || 0), 0) + 1;
        const e = await gravar('videos', obj, novo ? null : v.id); if (e) return e;
        await recarregar('videos'); render(); return null;
      },
      aoApagar: novo ? null : async () => { const e = await remover('videos', v.id); if (e) return e; await recarregar('videos'); render(); return null; }
    });
  }

  async function reordenar(idOrigem, idAlvo, depois) {
    const lista = ordenaVideos();
    const i = lista.findIndex((x) => x.id === idOrigem); if (i < 0) return;
    const [item] = lista.splice(i, 1);
    let j = lista.findIndex((x) => x.id === idAlvo); if (j < 0) j = lista.length; if (depois) j++;
    lista.splice(j, 0, item);
    const mudou = [];
    lista.forEach((x, n) => { if ((x.ordem || 0) !== n + 1) { x.ordem = n + 1; mudou.push(x); } });
    render();
    if (!mudou.length) return;
    const rs = await Promise.all(mudou.map((x) => gravar('videos', { ordem: x.ordem }, x.id)));
    const erro = rs.find(Boolean);
    if (erro) { toast(erro, true); await recarregar('videos'); render(); } else toast('Ordem salva!');
  }

  function renderPortfolio() {
    const h = hoje(), dias = [], cont = {};
    for (let i = 13; i >= 0; i--) { const d = somaDias(h, -i); dias.push(d); cont[iso(d)] = 0; }
    const orig = {}; let total = 0;
    S.visitas.forEach((v) => {
      const d = new Date(v.data); if (isNaN(d)) return;
      const k = iso(d); if (!(k in cont)) return;
      cont[k]++; total++;
      const o = String(v.origem || '').trim() || 'Direto'; orig[o] = (orig[o] || 0) + 1;
    });
    const hojeN = cont[iso(h)] || 0;
    const noAr = S.videos.filter((v) => v.visivel && !isEx(v.titulo));
    const nichos = {}; noAr.forEach((v) => { const n = String(v.nicho || '').trim(); if (n) nichos[n] = (nichos[n] || 0) + 1; });
    const topN = Object.entries(nichos).sort((a, b) => b[1] - a[1])[0];
    const origens = Object.entries(orig).sort((a, b) => b[1] - a[1]);

    const vals = dias.map((d) => cont[iso(d)]); const max = Math.max.apply(null, vals.concat([1]));
    const grafico = total === 0
      ? vazio('Quando as primeiras pessoas visitarem o seu portfólio, aqui vai aparecer um gráfico com as visitas dos últimos 14 dias, dia por dia.')
      : '<div class="grafico" role="img" aria-label="Visitas por dia nos últimos 14 dias">' + dias.map((d, i) => '<div class="col" title="' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ': ' + vals[i] + '"><span class="v">' + (vals[i] || '') + '</span><div class="b' + (vals[i] ? '' : ' zero') + '" style="height:' + (vals[i] ? Math.max(6, Math.round(vals[i] / max * 100)) : 2) + 'px"></div></div>').join('') + '</div><div class="rot">' + dias.map((d) => '<span>' + pad(d.getDate()) + '</span>').join('') + '</div>';
    const listaOrig = origens.length === 0
      ? vazio('Aqui vai aparecer por onde as pessoas chegaram (Instagram, Google, link direto e outros) quando o portfólio começar a receber visitas.')
      : '<div class="orig">' + origens.slice(0, 6).map(([n, q]) => '<div class="l"><span class="trunc">' + esc(n) + '</span><span class="t"><i style="width:' + (total > 0 ? Math.round(q / total * 100) : 0) + '%"></i></span><b class="num">' + q + '</b></div>').join('') + '</div>';

    const lista = ordenaVideos();
    const linhas = lista.length === 0 ? '<tr><td colspan="8">' + vazio('Nenhum vídeo ainda. Clique em "Adicionar vídeo".') + '</td></tr>' : lista.map((v, i) => '<tr class="clicavel" data-id="' + esc(v.id) + '"><td class="alca" title="Arraste para mudar a ordem" aria-hidden="true">' + IC.drag + '</td><td>' + esc(v.titulo) + (isEx(v.titulo) ? '<span class="tag-ex">exemplo</span>' : '') + '</td><td>' + esc(v.nicho || '-') + '</td><td>' + esc(v.formato || '-') + '</td><td>' + esc(v.marca || '-') + '</td><td>' + esc(v.destaque || '-') + '</td><td><button class="ic' + (v.visivel ? ' on' : '') + '" data-olho="' + esc(v.id) + '" aria-label="' + (v.visivel ? 'Escondido do site: clique para esconder' : 'Escondido: clique para mostrar no site') + '" title="' + (v.visivel ? 'Aparece no site' : 'Escondido do site') + '">' + (v.visivel ? IC.eye : IC.eyeoff) + '</button></td><td><div class="acoes"><button class="ic" data-sobe="' + esc(v.id) + '" aria-label="Subir" ' + (i === 0 ? 'disabled' : '') + '>' + IC.up + '</button><button class="ic" data-desce="' + esc(v.id) + '" aria-label="Descer" ' + (i === lista.length - 1 ? 'disabled' : '') + '>' + IC.down + '</button><button class="ic" data-edit="' + esc(v.id) + '" aria-label="Editar">' + IC.edit + '</button></div></td></tr>').join('');

    painel().innerHTML =
      '<div class="faixa-k"><div class="k"><small>Visitas em 14 dias</small><b>' + total + '</b></div><div class="k"><small>Visitas hoje</small><b>' + hojeN + '</b></div><div class="k"><small>Vídeos no ar</small><b>' + noAr.length + '</b></div><div class="k"><small>Nicho mais forte</small><b>' + (topN ? esc(topN[0]) : '-') + '</b>' + (topN ? '<span>' + plural(topN[1], 'vídeo', 'vídeos') + '</span>' : '<span>cadastre vídeos com nicho</span>') + '</div><div class="k"><small>De onde mais vêm</small><b>' + (origens[0] ? esc(origens[0][0]) : '-') + '</b>' + (origens[0] ? '<span>' + plural(origens[0][1], 'visita', 'visitas') + '</span>' : '<span>sem visitas ainda</span>') + '</div></div>' +
      '<div class="dupla"><section class="caixa"><h2>Visitas nos últimos 14 dias</h2>' + grafico + '</section><section class="caixa"><h2>Por onde chegaram</h2>' + listaOrig + '</section></div>' +
      '<div class="barra"><h2 class="sec-h" style="padding:0">Meus vídeos</h2><span class="esp"></span><button class="btn" id="novoVideo">Adicionar vídeo</button></div>' +
      '<div class="rolagem"><table><thead><tr><th></th><th>Título</th><th>Nicho</th><th>Formato</th><th>Marca</th><th>Destaque</th><th>Site</th><th></th></tr></thead><tbody id="tbVideos">' + linhas + '</tbody></table></div>' +
      '<p class="mut" style="margin-top:8px;font-size:.78rem">Arraste pela alça para mudar a ordem, ou use as setas. O olhinho mostra ou esconde o vídeo no site.</p>';

    $('#novoVideo').onclick = () => abrirVideo(null);
    const tb = $('#tbVideos'); let arrasta = null;
    const achar = (id) => S.videos.find((x) => x.id === id);
    tb.addEventListener('click', async (e) => {
      const b = e.target.closest('button'), tr = e.target.closest('tr[data-id]'); if (!tr) return;
      const id = tr.dataset.id;
      if (b && b.dataset.olho) { const v = achar(id); v.visivel = !v.visivel; render(); const er = await gravar('videos', { visivel: v.visivel }, id); if (er) { toast(er, true); await recarregar('videos'); render(); } return; }
      if (b && (b.dataset.sobe || b.dataset.desce)) { const l = ordenaVideos(), i = l.findIndex((x) => x.id === id); const j = b.dataset.sobe ? i - 1 : i + 1; if (l[j]) reordenar(id, l[j].id, !!b.dataset.desce); return; }
      abrirVideo(achar(id));
    });
    tb.addEventListener('mousedown', (e) => { const a = e.target.closest('.alca'); if (a) a.closest('tr').draggable = true; });
    tb.addEventListener('dragstart', (e) => { const tr = e.target.closest('tr[data-id]'); if (!tr) return; arrasta = tr.dataset.id; tr.classList.add('arrastando'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', arrasta); });
    tb.addEventListener('dragover', (e) => { const tr = e.target.closest('tr[data-id]'); if (!tr || !arrasta) return; e.preventDefault(); $$('.alvo', tb).forEach((x) => x.classList.remove('alvo')); tr.classList.add('alvo'); });
    tb.addEventListener('drop', (e) => { const tr = e.target.closest('tr[data-id]'); if (!tr || !arrasta) return; e.preventDefault(); const de = arrasta; arrasta = null; const l = ordenaVideos(); reordenar(de, tr.dataset.id, l.findIndex((x) => x.id === de) < l.findIndex((x) => x.id === tr.dataset.id)); });
    tb.addEventListener('dragend', () => { arrasta = null; $$('tr', tb).forEach((x) => { x.draggable = false; x.classList.remove('arrastando', 'alvo'); }); });
  }

  /* =========================================================
     2. MARCAS
     ========================================================= */
  const SITU = [['lead', 'Lead'], ['conversando', 'Conversando'], ['cliente', 'Cliente'], ['parada', 'Parada']];
  const rotSitu = (s) => (SITU.find((x) => x[0] === s) || [0, s || '-'])[1];
  const mFiltro = { q: '', sit: '' };
  const zap = (t) => { let d = String(t || '').replace(/\D/g, ''); if (d.length < 10) return ''; if (!d.startsWith('55')) d = '55' + d; return 'https://wa.me/' + d; };
  const insta = (h) => { const u = String(h || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[\/?#].*$/, ''); return u ? 'https://instagram.com/' + encodeURIComponent(u) : ''; };

  function abrirMarca(m) {
    const novo = !m;
    formulario({
      titulo: novo ? 'Adicionar marca' : 'Editar marca',
      campos: [
        { k: 'nome', label: 'Marca', obrig: true },
        { k: 'instagram', label: 'Instagram', meio: true, dica: 'Ex: @marca' },
        { k: 'email', label: 'E-mail', meio: true },
        { k: 'telefone', label: 'Telefone', meio: true },
        { k: 'situacao', label: 'Situação', tipo: 'lista', opcoes: SITU, meio: true },
        { k: 'ultimo_contato', label: 'Último contato', tipo: 'data', meio: true },
        { k: 'obs', label: 'Observação', tipo: 'longo' }
      ],
      valores: novo ? { situacao: 'lead', ultimo_contato: iso(hoje()) } : m,
      aoSalvar: async (obj) => { const e = await gravar('marcas', obj, novo ? null : m.id); if (e) return e; await recarregar('marcas'); render(); return null; },
      aoApagar: novo ? null : async () => { const e = await remover('marcas', m.id); if (e) return e; await recarregar('marcas'); render(); return null; }
    });
  }

  function marcasFiltradas() {
    const q = semAcento(mFiltro.q).replace(/^@/, '');
    return S.marcas.filter((m) => (!mFiltro.sit || m.situacao === mFiltro.sit) && (!q || semAcento(m.nome).includes(q) || semAcento(m.instagram).replace(/^@/, '').includes(q) || semAcento(m.email).includes(q)))
      .sort((a, b) => String(b.ultimo_contato || '').localeCompare(String(a.ultimo_contato || '')) || String(a.nome).localeCompare(String(b.nome), 'pt'));
  }
  function tabelaMarcas() {
    const l = marcasFiltradas();
    $('#tbMarcas').innerHTML = l.length === 0
      ? '<tr><td colspan="7">' + vazio(S.marcas.length ? 'Nenhuma marca com esse filtro.' : 'Nenhuma marca ainda. Quando alguém enviar o formulário do site, aparece aqui como Lead.') + '</td></tr>'
      : l.map((m) => { const w = zap(m.telefone), ig = insta(m.instagram); return '<tr class="clicavel" data-id="' + esc(m.id) + '"><td>' + esc(m.nome) + (isEx(m.nome) ? '<span class="tag-ex">exemplo</span>' : '') + '</td><td>' + (ig ? '<a href="' + esc(ig) + '" target="_blank" rel="noopener" data-fora>' + esc(m.instagram) + '</a>' : '-') + '</td><td class="trunc">' + esc(m.email || '-') + '</td><td style="white-space:nowrap">' + esc(m.telefone || '-') + (w ? ' <a class="ic" href="' + esc(w) + '" target="_blank" rel="noopener" data-fora aria-label="Abrir WhatsApp" title="Abrir WhatsApp">' + IC.wa + '</a>' : '') + '</td><td><span class="pil p-' + esc(m.situacao) + '">' + esc(rotSitu(m.situacao)) + '</span></td><td class="trunc">' + esc(m.obs || '-') + '</td><td style="white-space:nowrap">' + br(m.ultimo_contato) + '</td></tr>'; }).join('');
  }
  function renderMarcas() {
    painel().innerHTML =
      '<div class="barra"><input type="search" id="mBusca" placeholder="Buscar por nome, @ ou e-mail" aria-label="Buscar marcas" value="' + esc(mFiltro.q) + '"><select id="mSit" aria-label="Filtrar por situação"><option value="">Todas as situações</option>' + SITU.map((s) => '<option value="' + s[0] + '"' + (mFiltro.sit === s[0] ? ' selected' : '') + '>' + s[1] + '</option>').join('') + '</select><span class="esp"></span><button class="btn sec" id="mCsv">Baixar base (CSV)</button><button class="btn" id="mNova">Adicionar marca</button></div>' +
      '<div class="rolagem"><table><thead><tr><th>Marca</th><th>Instagram</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Observação</th><th>Último contato</th></tr></thead><tbody id="tbMarcas"></tbody></table></div>';
    tabelaMarcas();
    $('#mBusca').oninput = (e) => { mFiltro.q = e.target.value; tabelaMarcas(); };
    $('#mSit').onchange = (e) => { mFiltro.sit = e.target.value; tabelaMarcas(); };
    $('#mNova').onclick = () => abrirMarca(null);
    $('#mCsv').onclick = () => baixarCSV('marcas.csv', ['Marca', 'Instagram', 'E-mail', 'Telefone', 'Situação', 'Observação', 'Último contato'], marcasFiltradas().map((m) => [m.nome, m.instagram, m.email, m.telefone, rotSitu(m.situacao), m.obs, br(m.ultimo_contato).replace('-', '')]), [1, 3, 6]);
    $('#tbMarcas').onclick = (e) => { if (e.target.closest('[data-fora]')) return; const tr = e.target.closest('tr[data-id]'); if (tr) abrirMarca(S.marcas.find((x) => x.id === tr.dataset.id)); };
  }

  /* =========================================================
     3. CALENDÁRIO
     ========================================================= */
  const TIPOS_CAL = [['gravar', 'Gravar'], ['editar', 'Editar'], ['postar', 'Postar']];
  let calMes = new Date(hoje().getFullYear(), hoje().getMonth(), 1), calTipo = 'todos';
  const rotTipoCal = (t) => t === 'prazo' ? 'Prazo' : (TIPOS_CAL.find((x) => x[0] === t) || [0, t])[1];

  function itensCal() {
    const it = S.cal.filter((c) => c.data).map((c) => ({ o: 'cal', id: c.id, tipo: c.tipo || 'gravar', titulo: c.titulo, data: String(c.data).slice(0, 10), feito: c.status === 'feito' }));
    S.camp.forEach((c) => { if (c.prazo) it.push({ o: 'camp', id: c.id, tipo: 'prazo', titulo: c.campanha, data: String(c.prazo).slice(0, 10), feito: c.status === 'Entregue' }); });
    return calTipo === 'todos' ? it : it.filter((i) => i.tipo === calTipo);
  }
  function abrirItemCal(i) {
    if (i.o === 'camp') { abrirCampanha(S.camp.find((x) => x.id === i.id)); return; }
    abrirEventoCal(S.cal.find((x) => x.id === i.id));
  }
  function abrirEventoCal(ev, dataPadrao) {
    const novo = !ev;
    formulario({
      titulo: novo ? 'Adicionar ao calendário' : 'Editar item',
      campos: [
        { k: 'titulo', label: 'O que fazer', obrig: true },
        { k: 'marca', label: 'Marca', meio: true },
        { k: 'tipo', label: 'Tipo', tipo: 'lista', opcoes: TIPOS_CAL, meio: true },
        { k: 'data', label: 'Data', tipo: 'data', obrig: true, meio: true },
        { k: 'status', label: 'Situação', tipo: 'lista', opcoes: [['a fazer', 'A fazer'], ['feito', 'Feito']], meio: true }
      ],
      valores: novo ? { tipo: 'gravar', status: 'a fazer', data: dataPadrao || iso(hoje()) } : ev,
      aoSalvar: async (obj) => { const e = await gravar('cal', obj, novo ? null : ev.id); if (e) return e; await recarregar('cal'); render(); return null; },
      aoApagar: novo ? null : async () => { const e = await remover('cal', ev.id); if (e) return e; await recarregar('cal'); render(); return null; }
    });
  }
  function listaDia(dia) {
    const its = itensCal().filter((i) => i.data === dia);
    const ov = abrirJanela('<div class="fx"><h2>' + br(dia) + '</h2><button class="btn sec mini" data-fechar>Fechar</button></div>' +
      (its.length ? its.map((i, n) => '<div class="atraso" style="border-top:' + (n ? '1px solid var(--line)' : '0') + ';padding-left:0;padding-right:0">' + (i.o === 'cal' ? '<input type="checkbox" data-feito="' + esc(i.id) + '"' + (i.feito ? ' checked' : '') + ' aria-label="Marcar como feito">' : '') + '<button class="it t-' + i.tipo + (i.feito ? ' feito' : '') + '" style="width:auto;margin:0;flex:1" data-abrir="' + n + '">' + esc(i.titulo) + '</button><span class="mut" style="font-size:.75rem">' + rotTipoCal(i.tipo) + '</span></div>').join('') : vazio('Nada neste dia.')) +
      '<div class="jan-bt"><button class="btn" data-novo>Adicionar neste dia</button></div>');
    $('[data-fechar]', ov).onclick = fecharJanela;
    $('[data-novo]', ov).onclick = () => { fecharJanela(); abrirEventoCal(null, dia); };
    $$('[data-abrir]', ov).forEach((b) => { b.onclick = () => { const i = its[+b.dataset.abrir]; fecharJanela(); abrirItemCal(i); }; });
    $$('[data-feito]', ov).forEach((c) => { c.onchange = async () => { const ev = S.cal.find((x) => x.id === c.dataset.feito); ev.status = c.checked ? 'feito' : 'a fazer'; const e = await gravar('cal', { status: ev.status }, ev.id); if (e) { toast(e, true); await recarregar('cal'); } render(); }; });
  }

  function renderCalendario() {
    const h = hoje(), primeiro = calMes, offset = (primeiro.getDay() + 6) % 7;
    const ultimo = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0);
    const celulas = Math.ceil((offset + ultimo.getDate()) / 7) * 7, ini = somaDias(primeiro, -offset);
    const its = itensCal(), porDia = {}; its.forEach((i) => { (porDia[i.data] = porDia[i.data] || []).push(i); });
    const nomeMes0 = primeiro.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), nomeMes = nomeMes0.charAt(0).toUpperCase() + nomeMes0.slice(1);
    let grade = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => '<div class="dsem">' + d + '</div>').join('');
    for (let n = 0; n < celulas; n++) {
      const d = somaDias(ini, n), k = iso(d), l = porDia[k] || [];
      grade += '<div class="dia' + (d.getMonth() !== primeiro.getMonth() ? ' fora' : '') + (k === iso(h) ? ' hoje' : '') + '" data-dia="' + k + '"><span class="n">' + d.getDate() + '</span><button class="mais-i" data-add="' + k + '" aria-label="Adicionar em ' + br(k) + '">+</button>' +
        l.slice(0, 3).map((i) => '<button class="it t-' + i.tipo + (i.feito ? ' feito' : '') + '" data-item="' + i.o + ':' + esc(i.id) + '" title="' + rotTipoCal(i.tipo) + ': ' + esc(i.titulo) + '">' + esc(i.titulo) + '</button>').join('') +
        (l.length > 3 ? '<button class="mais" data-lista="' + k + '">+' + (l.length - 3) + ' mais</button>' : '') + '</div>';
    }
    const atrasados = [];
    S.cal.forEach((c) => { const d = dataDe(c.data); if (d && d < h && c.status !== 'feito') atrasados.push({ o: 'cal', id: c.id, titulo: c.titulo, tipo: c.tipo, d }); });
    S.camp.forEach((c) => { const d = dataDe(c.prazo); if (d && d < h && c.status !== 'Entregue') atrasados.push({ o: 'camp', id: c.id, titulo: c.campanha, tipo: 'prazo', d }); });
    atrasados.sort((a, b) => a.d - b.d);

    painel().innerHTML =
      '<div class="cal-cab"><button class="btn sec" id="calAnt" aria-label="Mês anterior">&#8592;</button><h2>' + esc(nomeMes) + '</h2><button class="btn sec" id="calProx" aria-label="Próximo mês">&#8594;</button><button class="btn sec" id="calHoje">Este mês</button><span style="flex:1"></span>' +
      [['todos', 'Todos']].concat(TIPOS_CAL).map((t) => '<button class="chip' + (calTipo === t[0] ? ' ativo' : '') + '" data-tipo="' + t[0] + '">' + t[1] + '</button>').join('') + '<button class="btn" id="calNovo">Adicionar</button></div>' +
      '<div class="grade">' + grade + '</div>' +
      '<section class="caixa" style="margin-top:16px"><h2>Ficou pra trás</h2>' + (atrasados.length === 0 ? vazio('Nada atrasado. Tudo em dia.') : '<div style="padding-top:8px">' + atrasados.map((a, n) => '<div class="atraso"><span class="pil t-' + a.tipo + '">' + rotTipoCal(a.tipo) + '</span><button class="tx" style="background:none;border:0;text-align:left" data-atr="' + n + '">' + esc(a.titulo) + '</button><span class="quando">há ' + plural(dif(h, a.d), 'dia', 'dias') + '</span>' + (a.o === 'cal' ? '<button class="btn sec mini" data-feito="' + esc(a.id) + '">Marcar feito</button>' : '') + '</div>').join('') + '</div>') + '</section>';

    $('#calAnt').onclick = () => { calMes = new Date(calMes.getFullYear(), calMes.getMonth() - 1, 1); render(); };
    $('#calProx').onclick = () => { calMes = new Date(calMes.getFullYear(), calMes.getMonth() + 1, 1); render(); };
    $('#calHoje').onclick = () => { calMes = new Date(h.getFullYear(), h.getMonth(), 1); render(); };
    $('#calNovo').onclick = () => abrirEventoCal(null);
    $$('[data-tipo]').forEach((b) => { b.onclick = () => { calTipo = b.dataset.tipo; render(); }; });
    $('.grade').onclick = (e) => {
      const it = e.target.closest('[data-item]');
      if (it) { const [o, id] = it.dataset.item.split(':'); abrirItemCal({ o, id }); return; }
      const li = e.target.closest('[data-lista]'); if (li) { listaDia(li.dataset.lista); return; }
      const dia = e.target.closest('.dia'); if (dia) abrirEventoCal(null, dia.dataset.dia);
    };
    $$('[data-atr]').forEach((b) => { b.onclick = () => abrirItemCal(atrasados[+b.dataset.atr]); });
    $$('[data-feito]').forEach((b) => { b.onclick = async () => { const e = await gravar('cal', { status: 'feito' }, b.dataset.feito); if (e) toast(e, true); else toast('Marcado como feito.'); await recarregar('cal'); render(); }; });
  }

  /* =========================================================
     4. CAMPANHAS
     ========================================================= */
  const FUNIL = ['Briefing', 'Roteiro', 'Aprovação Roteiro', 'Gravação', 'Edição', 'Aprovado', 'Entregue'];
  const cSort = { col: null, dir: 1 }; let cFiltro = 'todas', cBusca = '';
  const COLS = [
    { k: 'favorita', t: '', r: 'Favoritas' }, { k: 'campanha', t: 'Campanha' }, { k: 'cliente', t: 'Cliente' }, { k: 'tipo', t: 'Tipo' },
    { k: 'status', t: 'Status' }, { k: 'qtd', t: 'Qtd', num: 1 }, { k: 'valor', t: 'Valor', num: 1 }, { k: 'prazo', t: 'Prazo' }, { k: 'pagamento', t: 'Pagamento' }
  ];
  function valorOrd(c, k) {
    if (k === 'status') { const i = FUNIL.indexOf(c.status); return i < 0 ? 99 : i; }
    if (k === 'favorita') return c.favorita ? 0 : 1;
    if (k === 'qtd' || k === 'valor') return Number(c[k]) || 0;
    if (k === 'prazo') return c.prazo ? String(c.prazo).slice(0, 10) : null;
    return semAcento(c[k]);
  }
  function campanhasVisiveis() {
    const q = semAcento(cBusca);
    let l = S.camp.filter((c) => (cFiltro === 'todas' || (cFiltro === 'ativas' ? c.ativa : !c.ativa)) && (!q || semAcento(c.campanha).includes(q) || semAcento(c.cliente).includes(q)));
    if (cSort.col) {
      const k = cSort.col;
      l = l.slice().sort((a, b) => {
        const x = valorOrd(a, k), y = valorOrd(b, k);
        if (x === null && y === null) return 0; if (x === null) return 1; if (y === null) return -1;
        return (x < y ? -1 : x > y ? 1 : 0) * cSort.dir;
      });
    } else l = l.slice().sort((a, b) => String(b.criado_em).localeCompare(String(a.criado_em)));
    return l;
  }
  function abrirCampanha(c) {
    const novo = !c;
    formulario({
      titulo: novo ? 'Adicionar campanha' : 'Editar campanha',
      campos: [
        { k: 'campanha', label: 'Campanha', obrig: true },
        { k: 'cliente', label: 'Cliente', meio: true },
        { k: 'tipo', label: 'Tipo', tipo: 'lista', opcoes: ['Conteúdo', 'Publicidade'], meio: true },
        { k: 'status', label: 'Status', tipo: 'lista', opcoes: FUNIL, meio: true },
        { k: 'qtd', label: 'Quantidade de vídeos', tipo: 'numero', passo: 1, meio: true },
        { k: 'valor', label: 'Valor (R$)', tipo: 'numero', meio: true },
        { k: 'prazo', label: 'Prazo', tipo: 'data', meio: true },
        { k: 'pagamento', label: 'Pagamento', tipo: 'lista', opcoes: [['pendente', 'Pendente'], ['pago', 'Pago']], meio: true },
        { k: 'ativa', label: 'Campanha ativa', tipo: 'sim', meio: true },
        { k: 'favorita', label: 'Favorita (destaque na lista)', tipo: 'sim', meio: true }
      ],
      valores: novo ? { tipo: 'Conteúdo', status: 'Briefing', pagamento: 'pendente', ativa: true, qtd: 1, valor: 0 } : c,
      aoSalvar: async (obj) => { const e = await gravar('camp', obj, novo ? null : c.id); if (e) return e; await recarregar('camp'); render(); return null; },
      aoApagar: novo ? null : async () => { const e = await remover('camp', c.id); if (e) return e; await recarregar('camp'); render(); return null; }
    });
  }
  function etiquetaPrazo(c) {
    if (!c.prazo || c.status === 'Entregue') return '';
    const d = dif(dataDe(c.prazo), hoje());
    if (d < 0) return '<span class="et vermelha">' + plural(-d, 'dia', 'dias') + ' de atraso</span>';
    if (d <= 3) return '<span class="et amarela">' + (d === 0 ? 'vence hoje' : d === 1 ? 'vence amanhã' : 'vence em ' + d + ' dias') + '</span>';
    return '';
  }
  function tabelaCampanhas() {
    const l = campanhasVisiveis();
    $('#tbCamp').innerHTML = l.length === 0 ? '<tr><td colspan="9">' + vazio(S.camp.length ? 'Nenhuma campanha com esse filtro.' : 'Nenhuma campanha ainda. Clique em "Adicionar campanha".') + '</td></tr>' : l.map((c) => {
      const si = FUNIL.indexOf(c.status);
      return '<tr class="clicavel' + (c.favorita ? ' fav' : '') + '" data-id="' + esc(c.id) + '"><td><button class="ic est' + (c.favorita ? ' on' : '') + '" data-est="' + esc(c.id) + '" aria-label="' + (c.favorita ? 'Tirar dos favoritos' : 'Marcar como favorita') + '">' + IC.star + '</button></td><td>' + esc(c.campanha) + (isEx(c.campanha) ? '<span class="tag-ex">exemplo</span>' : '') + '</td><td>' + esc(c.cliente || '-') + '</td><td><span class="pil ' + (c.tipo === 'Publicidade' ? 'p-publicidade' : 'p-conteudo') + '">' + esc(c.tipo) + '</span></td><td><span class="pil p-s' + (si < 0 ? 0 : si) + '">' + esc(c.status) + '</span></td><td class="num">' + (Number(c.qtd) || 0) + '</td><td class="num">' + moeda(c.valor) + '</td><td style="white-space:nowrap">' + br(c.prazo) + etiquetaPrazo(c) + '</td><td><span class="pil p-' + esc(c.pagamento) + '">' + (c.pagamento === 'pago' ? 'Pago' : 'Pendente') + '</span></td></tr>';
    }).join('');
    $$('#cabCamp th.ord').forEach((th) => {
      const on = cSort.col === th.dataset.col; th.classList.toggle('on', on);
      $('.seta', th).textContent = on ? (cSort.dir === 1 ? '↑' : '↓') : '↕';
      th.setAttribute('aria-sort', on ? (cSort.dir === 1 ? 'ascending' : 'descending') : 'none');
    });
  }
  function renderCampanhas() {
    const reais = S.camp.filter((c) => !isEx(c.campanha));
    const total = reais.reduce((s, c) => s + (Number(c.valor) || 0), 0), videos = reais.reduce((s, c) => s + (Number(c.qtd) || 0), 0);
    const receber = reais.filter((c) => c.pagamento !== 'pago').reduce((s, c) => s + (Number(c.valor) || 0), 0), recebido = total - receber;
    painel().innerHTML =
      '<div class="faixa-k"><div class="k"><small>Campanhas</small><b>' + reais.length + '</b></div><div class="k"><small>Ativas</small><b>' + reais.filter((c) => c.ativa).length + '</b></div><div class="k"><small>Valor total</small><b>' + moeda(total) + '</b><span>Ticket médio por vídeo: ' + moeda(videos > 0 ? total / videos : 0) + '</span></div><div class="k"><small>A receber</small><b>' + moeda(receber) + '</b><span>Já recebido: ' + moeda(recebido) + '</span></div></div>' +
      '<div class="barra">' + [['todas', 'Todas'], ['ativas', 'Ativas'], ['finalizadas', 'Finalizadas']].map((f) => '<button class="chip' + (cFiltro === f[0] ? ' ativo' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('') + '<input type="search" id="cBusca" placeholder="Buscar campanha ou cliente" aria-label="Buscar campanhas" value="' + esc(cBusca) + '"><span class="esp"></span><button class="btn sec" id="cCsv">Baixar (CSV)</button><button class="btn" id="cNova">Adicionar campanha</button></div>' +
      '<div class="rolagem"><table><thead><tr id="cabCamp">' + COLS.map((c) => '<th class="ord" data-col="' + c.k + '"' + (c.num ? ' style="text-align:right"' : '') + ' tabindex="0" role="columnheader" aria-label="Ordenar por ' + esc(c.r || c.t) + '">' + esc(c.t) + '<span class="seta">↕</span></th>').join('') + '</tr></thead><tbody id="tbCamp"></tbody></table></div>';
    tabelaCampanhas();
    $$('#cabCamp th.ord').forEach((th) => {
      const ordenar = () => { if (cSort.col === th.dataset.col) cSort.dir = -cSort.dir; else { cSort.col = th.dataset.col; cSort.dir = 1; } tabelaCampanhas(); };
      th.onclick = ordenar; th.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ordenar(); } };
    });
    $$('[data-f]').forEach((b) => { b.onclick = () => { cFiltro = b.dataset.f; renderCampanhas(); }; });
    $('#cBusca').oninput = (e) => { cBusca = e.target.value; tabelaCampanhas(); };
    $('#cNova').onclick = () => abrirCampanha(null);
    $('#cCsv').onclick = () => baixarCSV('campanhas.csv', ['Campanha', 'Cliente', 'Tipo', 'Status', 'Qtd', 'Valor', 'Prazo', 'Pagamento', 'Ativa', 'Favorita'], campanhasVisiveis().map((c) => [c.campanha, c.cliente, c.tipo, c.status, c.qtd, String(Number(c.valor) || 0).replace('.', ','), br(c.prazo), c.pagamento, c.ativa ? 'sim' : 'não', c.favorita ? 'sim' : 'não']), [4, 5, 6]);
    $('#tbCamp').onclick = async (e) => {
      const tr = e.target.closest('tr[data-id]'); if (!tr) return;
      const est = e.target.closest('[data-est]');
      if (est) { const c = S.camp.find((x) => x.id === tr.dataset.id); c.favorita = !c.favorita; tabelaCampanhas(); const er = await gravar('camp', { favorita: c.favorita }, c.id); if (er) { toast(er, true); await recarregar('camp'); tabelaCampanhas(); } return; }
      abrirCampanha(S.camp.find((x) => x.id === tr.dataset.id));
    };
  }

  /* =========================================================
     5. CHECKLIST PORTFÓLIO (conteúdo vem de js/biblioteca.js)
     ========================================================= */
  const SUBABAS = [['check', 'Checklist do portfólio'], ['refs', 'Referências de vídeo'], ['rot', 'Roteiros'], ['nic', 'Ideias por nicho'], ['rev', 'Revisar meu roteiro']];
  let subAba = 'check'; const abertos = new Set();
  const lerLocal = (k, pad_) => { try { const v = localStorage.getItem(k); return v == null ? pad_ : v; } catch (e) { return pad_; } };
  const gravaLocal = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };

  async function marcar(chave, ligado) {
    if (ligado) S.marcados.add(chave); else S.marcados.delete(chave);
    try {
      const r = ligado ? await sb.from('marcados').upsert({ chave: chave, atualizado_em: new Date().toISOString() }) : await sb.from('marcados').delete().eq('chave', chave);
      if (r.error) throw r.error;
    } catch (e) {
      if (ligado) S.marcados.delete(chave); else S.marcados.add(chave);
      toast(traduzErro(e, 'marcados'), true);
    }
    const y = window.scrollY; render(); window.scrollTo(0, y);
  }
  const acc = (id, cab, corpo) => '<div class="acc' + (abertos.has(id) ? ' aberto' : '') + '" data-acc="' + esc(id) + '"><button class="acc-h" aria-expanded="' + abertos.has(id) + '">' + cab + IC.chev + '</button><div class="acc-b">' + corpo + '</div></div>';
  const beats = (b) => (b || []).map((x) => '<div class="beat"><span class="t">' + esc(x.t) + '</span><div>' + x.o + '</div></div>').join('');

  function renderChecklist() {
    const B = window.Biblioteca;
    const abas = '<div class="subabas">' + SUBABAS.map((s) => '<button class="chip' + (subAba === s[0] ? ' ativo' : '') + '" data-sub="' + s[0] + '">' + s[1] + '</button>').join('') + '</div>';
    if (!B) { painel().innerHTML = abas + '<div class="caixa">' + vazio('Não encontrei o arquivo js/biblioteca.js. Confira se ele está na pasta js do projeto.') + '</div>'; return; }
    let corpo = '';
    if (subAba === 'check') {
      let feitos = 0, tot = 0;
      const secs = (B.CHECKLIST || []).map((s) => {
        const n = (s.itens || []).length, f = (s.itens || []).filter((_, i) => S.marcados.has(s.id + ':' + i)).length; feitos += f; tot += n;
        const cab = '<span class="em">' + esc(s.emoji) + '</span><span class="tt"><b>' + esc(s.nome) + '</b><span>' + esc(s.resumo) + '</span></span><span class="prog" style="width:90px"><i style="width:' + (n ? Math.round(f / n * 100) : 0) + '%"></i></span><span class="ct">' + f + '/' + n + '</span>';
        const it = (s.itens || []).map((x, i) => { const on = S.marcados.has(s.id + ':' + i); return '<label class="chk' + (on ? ' ok' : '') + '"><input type="checkbox" data-chk="' + esc(s.id + ':' + i) + '"' + (on ? ' checked' : '') + '><div><b>' + esc(x.t) + '</b><span>' + esc(x.d) + '</span></div></label>'; }).join('');
        return acc('c:' + s.id, cab, '<div class="porque"><b>Por quê: </b>' + esc(s.porque) + '</div>' + it);
      }).join('');
      corpo = '<div class="geral"><b>' + feitos + ' de ' + tot + ' itens prontos</b><span class="prog"><i style="width:' + (tot ? Math.round(feitos / tot * 100) : 0) + '%"></i></span><b>' + (tot ? Math.round(feitos / tot * 100) : 0) + '%</b></div>' + secs;
    } else if (subAba === 'refs') {
      corpo = '<div class="refs">' + (B.REFERENCIAS || []).map((r, i) => '<button class="ref" data-ref="' + i + '"><div class="capa cor-' + esc(r.cor) + '"><span>' + esc(r.emoji) + '</span><small>' + esc(r.estilo) + '</small></div><div class="inf"><b>' + esc(r.titulo) + '</b><span>' + esc(r.duracao) + ' · ' + esc(r.marca) + '</span></div></button>').join('') + '</div>';
    } else if (subAba === 'rot') {
      corpo = (B.TIPOS || []).map((t) => acc('t:' + t.id, '<span class="em">' + esc(t.emoji) + '</span><span class="tt"><b>' + esc(t.nome) + '</b><span>' + esc(t.duracao) + '</span></span>', '<div class="porque"><b>Quando usar: </b>' + esc(t.porque) + '</div>' + beats(t.beats) + ((t.erros || []).length ? '<div class="ficha"><h3>Erros comuns</h3><p>' + (t.erros || []).map(esc).join('<br>') + '</p></div>' : ''))).join('');
    } else if (subAba === 'nic') {
      corpo = (B.NICHOS || []).map((n) => acc('n:' + n.id, '<span class="em">' + esc(n.emoji) + '</span><span class="tt"><b>' + esc(n.nome) + '</b><span>' + plural((n.ideias || []).length, 'ideia', 'ideias') + '</span></span>', (n.ideias || []).map((x) => '<div class="ideia"><b>' + esc(x.t) + '</b><i>Gancho: ' + esc(x.gancho) + '</i></div>').join(''))).join('');
    } else {
      const marc = (() => { try { return JSON.parse(lerLocal('admin.revisao', '{}')) || {}; } catch (e) { return {}; } })();
      let f = 0, tot = 0;
      const blocos = (B.REVISAO || []).map((b, bi) => {
        const its = (b.itens || []).map((x, i) => { const k = bi + ':' + i, on = !!marc[k]; tot++; if (on) f++; return '<label class="chk' + (on ? ' ok' : '') + '"><input type="checkbox" data-rev="' + k + '"' + (on ? ' checked' : '') + '><div><b>' + esc(x.t) + '</b><span>' + esc(x.d) + '</span></div></label>'; }).join('');
        return '<section class="caixa" style="padding-bottom:10px"><h2>' + esc(b.emoji) + ' ' + esc(b.bloco) + '</h2><div style="padding:6px 16px 0">' + its + '</div></section>';
      }).join('');
      corpo = '<label class="sec-h" for="rotTxt" style="padding:0;display:block;margin-bottom:6px">Cole aqui o seu roteiro</label><textarea class="roteiro" id="rotTxt" placeholder="Cole ou escreva o roteiro do vídeo e confira os itens abaixo. O texto fica salvo só neste navegador.">' + esc(lerLocal('admin.roteiro', '')) + '</textarea><div class="geral"><b>' + f + ' de ' + tot + ' conferidos</b><span class="prog"><i style="width:' + (tot ? Math.round(f / tot * 100) : 0) + '%"></i></span><button class="btn sec mini" id="revLimpa">Limpar</button></div>' + blocos;
    }
    painel().innerHTML = abas + corpo;

    $$('[data-sub]').forEach((b) => { b.onclick = () => { subAba = b.dataset.sub; render(); }; });
    $$('[data-acc] .acc-h').forEach((h) => { h.onclick = () => { const a = h.parentNode, id = a.dataset.acc; if (abertos.has(id)) abertos.delete(id); else abertos.add(id); a.classList.toggle('aberto'); h.setAttribute('aria-expanded', abertos.has(id)); }; });
    $$('[data-chk]').forEach((c) => { c.onchange = () => marcar(c.dataset.chk, c.checked); });
    $$('[data-ref]').forEach((b) => { b.onclick = () => fichaRef(B.REFERENCIAS[+b.dataset.ref]); });
    const t = $('#rotTxt'); if (t) t.oninput = () => gravaLocal('admin.roteiro', t.value);
    $$('[data-rev]').forEach((c) => { c.onchange = () => { let m = {}; try { m = JSON.parse(lerLocal('admin.revisao', '{}')) || {}; } catch (e) { /* recomeça */ } if (c.checked) m[c.dataset.rev] = 1; else delete m[c.dataset.rev]; gravaLocal('admin.revisao', JSON.stringify(m)); const y = window.scrollY; render(); window.scrollTo(0, y); }; });
    const l = $('#revLimpa'); if (l) l.onclick = () => { gravaLocal('admin.revisao', '{}'); render(); };
  }
  function fichaRef(r) {
    const url = seguroUrl(r.youtube);
    const ov = abrirJanela('<div class="fx"><h2>' + esc(r.emoji) + ' ' + esc(r.titulo) + '</h2><button class="btn sec mini" data-fechar>Fechar</button></div><div class="ficha"><p class="mut">' + esc(r.estilo) + ' · ' + esc(r.audiencia) + ' · ' + esc(r.duracao) + ' · ' + esc(r.marca) + '</p><h3>Gancho</h3><p>' + esc(r.gancho) + '</p><h3>Por que funciona</h3><p>' + esc(r.porque) + '</p><h3>O diferencial</h3><p>' + esc(r.diferencial) + '</p><h3>Erro comum</h3><p>' + esc(r.erro) + '</p><h3>Roteiro em blocos de tempo</h3>' + beats(r.roteiro) + '</div>' + (url ? '<div class="jan-bt"><a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener" style="text-decoration:none">Assistir</a></div>' : ''), true);
    $('[data-fechar]', ov).onclick = fecharJanela;
  }

  /* =========================================================
     NAVEGAÇÃO
     ========================================================= */
  const ABAS = { portfolio: ['Portfólio', renderPortfolio], marcas: ['Marcas', renderMarcas], calendario: ['Calendário', renderCalendario], campanhas: ['Campanhas', renderCampanhas], checklist: ['Checklist portfólio', renderChecklist] };
  let aba = 'portfolio';
  function render() {
    try { ABAS[aba][1](); }
    catch (e) { console.error(e); painel().innerHTML = '<div class="caixa">' + vazio('Não consegui montar esta aba (' + esc(e.message) + '). O resto do painel continua funcionando, é só trocar de aba.') + '</div>'; }
    mostrarAvisos();
  }
  function irPara(a) {
    if (!ABAS[a]) a = 'portfolio'; aba = a;
    $$('.item').forEach((b) => { const on = b.dataset.aba === a; b.classList.toggle('ativo', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('#titulo').textContent = ABAS[a][0]; document.title = ABAS[a][0] + ' | Painel';
    try { history.replaceState(null, '', '#' + a); } catch (e) { /* ok */ }
    fecharMenu(); render(); window.scrollTo(0, 0);
  }
  function fecharMenu() { $('#menu').classList.remove('aberto'); $('#fundo').classList.remove('aberto'); $('#hamb').setAttribute('aria-expanded', 'false'); }
  $$('.item').forEach((b) => { b.onclick = () => irPara(b.dataset.aba); });
  $('#hamb').onclick = () => { const a = $('#menu').classList.toggle('aberto'); $('#fundo').classList.toggle('aberto', a); $('#hamb').setAttribute('aria-expanded', a); };
  $('#fundo').onclick = fecharMenu;
  $('#sair').onclick = async () => { try { await sb.auth.signOut(); } catch (e) { /* segue */ } location.replace('../login/'); };
  window.addEventListener('unhandledrejection', () => toast('Algo não saiu como esperado. Tente de novo.', true));

  /* ---------- começa ---------- */
  painel().innerHTML = vazio('Carregando seus dados...');
  const [v, m, c, k, mk, vi] = await Promise.all(['videos', 'marcas', 'cal', 'camp', 'marcados', 'visitas'].map(carregar));
  S.videos = v; S.marcas = m; S.cal = c; S.camp = k; S.marcados = new Set(mk.map((x) => x.chave)); S.visitas = vi;
  irPara(location.hash.replace('#', ''));
})();
