try{const t=localStorage.getItem('abk-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}


    (() => {
      const root = document.documentElement;
      const themeButton = document.querySelector('#theme-toggle');
      const scheme = window.matchMedia('(prefers-color-scheme: dark)');
      const getTheme = () => root.getAttribute('data-theme') || 'light';
      const updateThemeLabel = () => { const dark = getTheme() === 'dark'; themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); themeButton.title = dark ? 'Switch to light theme' : 'Switch to dark theme'; themeButton.querySelector('.theme-icon').textContent = dark ? '☼' : '☾'; };
      themeButton.addEventListener('click', () => { const next = getTheme() === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', next); try { localStorage.setItem('abk-theme', next); } catch(e) {} updateThemeLabel(); });
      if (scheme.addEventListener) scheme.addEventListener('change', updateThemeLabel);
      updateThemeLabel();

      const menu = document.querySelector('#nav-links');
      const mobileButton = document.querySelector('#mobile-toggle');
      const setMenu = (open) => { menu.classList.toggle('open', open); mobileButton.setAttribute('aria-expanded', String(open)); mobileButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu'); document.querySelector('#menu-icon').textContent = open ? '×' : '☰'; };
      mobileButton.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
      menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
      document.addEventListener('click', (e) => { if(!e.target.closest('.site-nav')) setMenu(false); });
      window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

      const buttons = [...document.querySelectorAll('.filter-button')];
      const projects = [...document.querySelectorAll('.project')];
      buttons.forEach(button => button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        projects.forEach(p => { p.hidden = filter !== 'all' && !p.dataset.category.split(' ').includes(filter); });
      }));

      const revealed = document.querySelectorAll('[data-reveal]');
      if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealed.forEach(el => el.classList.add('is-visible'));
      } else {
        const observer = new IntersectionObserver((entries, obs) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); } }); }, { threshold: .07, rootMargin: '0px 0px 50px 0px' });
        revealed.forEach(el => observer.observe(el));
      }
      document.querySelector('#year').textContent = String(new Date().getFullYear());
    })();
  

(() => {
  const form = document.querySelector('#data-quality-form');
  if (!form) return;
  const result = document.querySelector('#demo-result');
  const button = form.querySelector('button[type="submit"]');
  const fields = ['ph', 'turbidity', 'tds', 'temperature'];
  const labels = {'ph':'pH','turbidity':'Turbidity','tds':'TDS','temperature':'Temperature'};
  const locallyCheck = (obj) => {
    const missing_fields = fields.filter(k=>obj[k]===null).map(k=>labels[k]);
    const flags=[];
    if(obj.ph!==null && (obj.ph<0 || obj.ph>14))flags.push('pH outside the physical 0–14 scale.');
    if(obj.turbidity!==null && obj.turbidity<0)flags.push('Turbidity cannot be negative.');
    if(obj.tds!==null && obj.tds<0)flags.push('TDS cannot be negative.');
    if(obj.temperature!==null && (obj.temperature< -20 || obj.temperature>100))flags.push('Temperature outside the illustrative observation range (−20 to 100 °C); check units or input.');
    return {provided_count:4-missing_fields.length, missing_fields, flags, disclaimer:'Basic input plausibility only — not an ML prediction, water-safety assessment, or validated sensor test.'};
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();button.disabled=true;
    const values={};for(const k of fields){const raw=form.elements[k].value.trim();values[k]=raw===''?null:Number(raw);}
    let data=null;let engine='Browser-only demonstration';
    try {
      if(document.body.dataset.backend==='python') {
        const r=await fetch('/api/data-quality',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
        if(!r.ok) throw new Error('API unavailable');
        data=await r.json();engine='Python API';
      }
    } catch(e) { engine='Browser fallback (Python API unavailable)'; }
    if(!data)data=locallyCheck(values);
    result.hidden=false;
    // No innerHTML with user values: append only trusted fixed text via textContent.
    result.replaceChildren();
    const h=document.createElement('strong');h.textContent='Checked by '+engine;result.append(h);
    const summary=document.createElement('p');summary.textContent=`${data.provided_count}/4 readings entered. ${data.missing_fields.length?'Missing: '+data.missing_fields.join(', ')+'.':'No missing inputs.'}`;result.append(summary);
    if(data.flags.length){const ul=document.createElement('ul');data.flags.forEach(flag=>{const li=document.createElement('li');li.textContent=flag;ul.append(li)});result.append(ul)}
    else {const p=document.createElement('p');p.textContent='No basic input-range flags in the supplied values.';result.append(p)}
    const small=document.createElement('p');small.textContent=data.disclaimer;result.append(small);
    button.disabled=false;
  });
})();
