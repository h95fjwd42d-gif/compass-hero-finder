'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const list = $('reply-list'), status = $('reply-status'), filter = $('reply-filter'), refresh = $('reply-refresh'), fallback = $('reply-fallback');
  let entries = [];
  const headers = ['掲載日','分類','ご意見','返信'];
  function csvRows(raw) {
    const s = raw.replace(/^\uFEFF/, '');
    const rows = []; let row = [], cell = '', quoted = false;
    for (let i=0;i<s.length;i++) {
      const c=s[i];
      if(quoted){if(c==='"'){if(s[i+1]==='"'){cell+='"';i++;}else quoted=false;}else cell+=c;}
      else if(c==='"' && cell==='') quoted=true;
      else if(c===','){row.push(cell);cell='';}
      else if(c==='\r'||c==='\n'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
      else cell+=c;
    }
    if(quoted)throw Error('CSV形式エラー');
    if(cell!==''||row.length){row.push(cell);rows.push(row);}
    return rows;
  }
  function readEntries(raw){
    const rows=csvRows(raw);const head=rows.shift()||[];
    if(head.length!==4||headers.some((h,i)=>head[i].trim()!==h))throw Error('列名が一致しません');
    return rows.map((r,i)=>({date:(r[0]||'').trim(),category:(r[1]||'').trim(),opinion:(r[2]||'').trim(),reply:(r[3]||'').trim(),i}))
      .filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&r.category&&r.opinion&&r.reply)
      .sort((a,b)=>b.date.localeCompare(a.date)||b.i-a.i);
  }
  function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
  function render(){
    list.replaceChildren(); const visible=entries.filter(r=>!filter.value||r.category===filter.value);
    status.textContent=visible.length?`${visible.length}件の返信（新着順）`:'掲載された返信はまだありません。';
    for(const r of visible){const card=el('article','reply-entry');const meta=el('div','reply-meta');meta.append(el('span','reply-category',r.category),el('time','',r.date));card.append(meta,el('h2','','匿名ユーザー'),el('p','reply-text',r.opinion));const a=el('div','reply-author');const h=el('h2','','みつを');h.append(el('small','','サイト制作者'));a.append(h,el('p','reply-text',r.reply));card.append(a);list.append(card);}
  }
  function validateUrl(s){const u=new URL(s);if(u.origin!=='https://docs.google.com'||!/^\/spreadsheets\/d\/e\/[A-Za-z0-9_-]+\/pub$/.test(u.pathname)||u.searchParams.get('output')!=='csv'||!/^\d+$/.test(u.searchParams.get('gid')||''))throw Error('公開CSV URLの形式が違います');return u;}
  async function load(){
    const raw=String(window.HERO_FINDER_FEEDBACK_CSV||'').trim();
    entries=[]; list.replaceChildren(); filter.replaceChildren(new Option('すべて','')); fallback.hidden=true;
    if(!raw){status.textContent='返信ページは準備中です。';refresh.disabled=true;filter.disabled=true;return;}
    refresh.disabled=true;filter.disabled=true;status.textContent='読み込み中…';
    try {
      const u=validateUrl(raw);const view=new URL(u);view.pathname=view.pathname.replace(/\/pub$/,'/pubhtml');view.searchParams.delete('output');view.searchParams.set('single','true');fallback.href=view.href;fallback.hidden=false;
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
      try {const res=await fetch(u.href,{credentials:'omit',cache:'no-store',signal:controller.signal,referrerPolicy:'no-referrer'});if(!res.ok)throw Error('取得できません');const text=await res.text();if(text.length>1000000)throw Error('サイズ上限');entries=readEntries(text);}finally{clearTimeout(timer);}
      for(const c of [...new Set(entries.map(r=>r.category))].sort((a,b)=>a.localeCompare(b,'ja')))filter.add(new Option(c,c));
      filter.disabled=false;render();
    } catch(e){status.textContent='返信を取得できませんでした。時間をおいて再読み込みするか、公開一覧をご確認ください。';}
    finally{refresh.disabled=false;}
  }
  filter.addEventListener('change',render);refresh.addEventListener('click',load);load();
})();
