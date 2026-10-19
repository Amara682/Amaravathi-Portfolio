(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const boot = $('#bootScreen'), shell = $('#siteShell'), enter = $('#enterRealm');
  const bar = $('#loadingBar'), label = $('#loadingLabel');
  let progress = 0;
  const loading = setInterval(() => {
    progress = Math.min(100, progress + Math.ceil(Math.random()*9));
    bar.style.width = progress + '%';
    label.textContent = `INITIALIZING DEVELOPER REALM · ${progress}%`;
    if (progress >= 100) { clearInterval(loading); enter.disabled = false; label.textContent = 'REALM READY · PLAYER INPUT REQUIRED'; }
  }, 120);
  function enterSite() {
    boot.classList.add('done'); shell.classList.add('ready'); document.body.classList.remove('is-loading');
    window.setTimeout(() => boot.style.display='none', 800);
    showToast('WELCOME, PLAYER 001. YOUR JOURNEY BEGINS.');
    // Start music from the visitor's explicit ENTER click (browser autoplay policy).
    startSound();
  }
  enter.addEventListener('click', enterSite);
  // If a visitor prefers to skip the intro, Enter key also opens the site once loaded.
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && !enter.disabled && !boot.classList.contains('done')) enterSite(); });

  const menu = $('#menuToggle'), nav = $('#mainNav');
  menu.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(opened));
  });
  $$('#mainNav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); playSfx('collect'); }));

  const motionBtn = $('#motionToggle');
  motionBtn.addEventListener('click', () => {
    const paused = document.body.classList.toggle('motion-paused');
    motionBtn.textContent = paused ? '▶' : 'Ⅱ';
    motionBtn.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
    showToast(paused ? 'ANIMATIONS PAUSED' : 'ANIMATIONS RESUMED');
  });

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (entry.target.classList.contains('skill-card')) entry.target.classList.add('in-view');
      if (entry.target.matches('.stat-card')) animateCounter(entry.target.querySelector('[data-count]'));
      revealObserver.unobserve(entry.target);
    }
  }), {threshold: .13});
  $$('.reveal, .skill-card, .stat-card').forEach(el => revealObserver.observe(el));

  function animateCounter(el) {
    if (!el || el.dataset.counted) return;
    el.dataset.counted = 'true';
    const target = Number(el.dataset.count), start = performance.now(), duration = 1000;
    function frame(now) {
      const p = Math.min(1, (now-start)/duration);
      el.textContent = Math.floor(target * (1-Math.pow(1-p,3)));
      if (p<1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const projects = {
    care: {title:'CareTwin Chennai', desc:'A personalized healthcare navigation concept designed to help people compare facilities, lab services, and likely expenses according to location, needs, and budget. This is a concept description; add only features that are implemented in your current build.', tags:['HEALTH TECH','AI AGENTS','SERVICE MATCHING','STREAMLIT']},
    earth: {title:'Multimodal Land-Cover AI', desc:'A research-oriented land-cover classification project that explores direct-token multimodal fusion for Sentinel-1 and Sentinel-2 inputs, including robustness when modalities are missing or degraded.', tags:['PYTORCH','SENTINEL-1/2','MULTIMODAL LEARNING','REMOTE SENSING']},
    hospital: {title:'MediCare Hospital Platform', desc:'A full-stack hospital management project concept focused on patient registration, appointments, role-aware access, and data-backed workflows. Connect this card to your repository or deployed demo once ready.', tags:['JAVA','SPRING BOOT','THYMELEAF','MYSQL']},
    ml: {title:'Prediction & Sentiment Lab', desc:'Two beginner-friendly machine-learning projects: house-price regression and text sentiment classification. The projects explore data preparation, model training, evaluation, and simple interactive presentation.', tags:['PYTHON','LINEAR REGRESSION','LOGISTIC REGRESSION','NLP']}
  };
  const modal = $('#projectModal');
  function openModal(key) {
    const p = projects[key]; if (!p) return;
    $('#modalTitle').textContent=p.title; $('#modalDescription').textContent=p.desc;
    $('#modalKicker').textContent='MISSION DETAILS / '+key.toUpperCase();
    $('#modalTags').innerHTML=p.tags.map(t=>`<span>${t}</span>`).join('');
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; $('#modalClose').focus();
  }
  function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  $$('.mission-card').forEach(card => card.addEventListener('click',()=>{playSfx('collect');openModal(card.dataset.project);}));
  $('#modalClose').addEventListener('click',closeModal); $('#modalDone').addEventListener('click',closeModal);
  $$('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && modal.classList.contains('open'))closeModal();});

  const backTop = $('#backTop');
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('show', window.scrollY > 500);
    let current = 'home';
    $$('main section[id]').forEach(sec => { if (window.scrollY >= sec.offsetTop - 150) current=sec.id; });
    $$('#mainNav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+current));
  }, {passive:true});
  backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  $('#year').textContent = new Date().getFullYear();

  let toastTimer;
  function showToast(message) {
    const t=$('#toast'); t.textContent=message; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2600);
  }
  window.showToast = showToast;

  // Playable mini-quest: keyboard movement + proximity collection + XP reward.
  const arena=$('#gameArena'), explorer=$('#explorer'), startQuest=$('#startQuest'), arenaMessage=$('#arenaMessage');
  const shardEls=$$('.shard'), xpValue=$('#xpValue'), shardValue=$('#shardValue'), reward=$('#questReward');
  let questActive=false, collected=0, player={x:8,y:67}, claimed=false;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function paintPlayer(){explorer.style.left=player.x+'%';explorer.style.top=player.y+'%';}
  function resetQuest(){questActive=false;collected=0;claimed=false;player={x:8,y:67};paintPlayer();shardEls.forEach(s=>s.classList.remove('collected'));shardValue.textContent='0 / 5';xpValue.textContent='000';reward.classList.remove('show');arenaMessage.classList.remove('hidden');arenaMessage.innerHTML='<span>✦</span><b>QUEST OBJECTIVE</b><small>Collect all 5 energy shards</small><button id="startQuest">START QUEST <i>↗</i></button>';$('#startQuest').addEventListener('click',beginQuest);}
  function beginQuest(){questActive=true;arenaMessage.classList.add('hidden');arena.focus();playSfx('start');showToast('QUEST STARTED — COLLECT THE SHARDS');}
  function movePlayer(dx,dy){if(!questActive)return;player.x=clamp(player.x+dx,2,94);player.y=clamp(player.y+dy,13,77);paintPlayer();const arenaRect=arena.getBoundingClientRect(), px=(player.x/100)*arenaRect.width, py=(player.y/100)*arenaRect.height;
    shardEls.forEach(shard=>{if(shard.classList.contains('collected'))return;const sx=(parseFloat(shard.style.left)/100)*arenaRect.width, sy=(parseFloat(shard.style.top)/100)*arenaRect.height;if(Math.hypot(px-sx,py-sy)<Math.min(48,arenaRect.width*.065)){shard.classList.add('collected');collected++;shardValue.textContent=collected+' / 5';xpValue.textContent=String(collected*20).padStart(3,'0');playSfx('collect');if(collected===5){questActive=false;reward.classList.add('show');playSfx('win');showToast('QUEST COMPLETE — 100 XP UNLOCKED');}}});}
  function onGameKey(e){if(!questActive)return;const k=e.key.toLowerCase();const keys=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];if(!keys.includes(k))return;e.preventDefault();if(k==='arrowup'||k==='w')movePlayer(0,-4);if(k==='arrowdown'||k==='s')movePlayer(0,4);if(k==='arrowleft'||k==='a')movePlayer(-4,0);if(k==='arrowright'||k==='d')movePlayer(4,0);}
  document.addEventListener('keydown',onGameKey);startQuest.addEventListener('click',beginQuest);$('#resetQuest').addEventListener('click',()=>{resetQuest();showToast('QUEST RESET');});
  $('#claimReward').addEventListener('click',()=>{if(claimed){showToast('REWARD ALREADY CLAIMED');return;}claimed=true;$('#claimReward').textContent='REWARD CLAIMED ✓';$('#claimReward').disabled=true;showToast('100 XP ADDED TO YOUR PLAYER LOG');});

  // Music: plays ONLY the real Pixabay track at assets/epic-violin.mp3 (no synthetic substitute).
  let soundOn=false;
  const soundToggle=$('#soundToggle'), volume=$('#volumeControl'), dockPlay=$('#dockPlay'), dockMute=$('#dockMute'), dockVol=$('#dockVol'), dockMsg=$('#dockMsg'), dock=$('#musicDock');
  const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
  const MISSING='Music file not found. Download the track from Pixabay and save it as assets/epic-violin.mp3, then reload.';
  const music=new Audio();let failed=false;
  music.loop=true;music.preload='auto';
  const savedVol=store.get('bgmVol');const startVol=savedVol===null?50:Math.max(0,Math.min(100,Number(savedVol)||0));
  music.volume=startVol/100;music.muted=store.get('bgmMuted')==='1';
  volume.value=dockVol.value=startVol;
  function setMsg(t,err){dockMsg.textContent=t;dockMsg.classList.toggle('err',!!err);}
  function sync(){
    soundOn=!music.paused&&!music.muted&&!failed;
    dock.classList.toggle('playing',soundOn);
    dockPlay.textContent=music.paused?'▶':'Ⅱ';dockPlay.setAttribute('aria-label',music.paused?'Play music':'Pause music');
    dockMute.textContent=music.muted||music.volume===0?'🔇':'🔊';dockMute.setAttribute('aria-pressed',String(music.muted));dockMute.setAttribute('aria-label',music.muted?'Unmute music':'Mute music');
    soundToggle.textContent=music.paused?'▶ PLAY MUSIC':'Ⅱ PAUSE MUSIC';soundToggle.setAttribute('aria-pressed',String(!music.paused));
  }
  function fail(){failed=true;music.pause();setMsg(MISSING,true);showToast('MUSIC FILE COULD NOT LOAD');sync();}
  music.addEventListener('error',fail);
  ['play','pause','volumechange'].forEach(ev=>music.addEventListener(ev,sync));
  music.src='epic-violin.mp3';
  function startSound(){
    if(failed){setMsg(MISSING,true);return;}
    const p=music.play();
    if(p&&p.then)p.then(()=>{if(!failed)setMsg('Now playing: Epic Violin Cinematic Instrumental');}).catch(err=>{
      if(err&&err.name==='NotAllowedError')setMsg('Your browser blocked playback. Press the play button.',true);else fail();
    });
  }
  function pauseSound(){music.pause();setMsg('Paused');}
  const togglePlay=()=>music.paused?startSound():pauseSound();
  soundToggle.addEventListener('click',togglePlay);dockPlay.addEventListener('click',togglePlay);
  dockMute.addEventListener('click',()=>{music.muted=!music.muted;store.set('bgmMuted',music.muted?'1':'0');if(!failed)setMsg(music.muted?'Muted':(music.paused?'Paused':'Now playing: Epic Violin Cinematic Instrumental'));});
  function setVol(v){v=Number(v);music.volume=v/100;if(v>0&&music.muted){music.muted=false;store.set('bgmMuted','0');}volume.value=dockVol.value=v;store.set('bgmVol',String(v));sync();}
  volume.addEventListener('input',()=>setVol(volume.value));dockVol.addEventListener('input',()=>setVol(dockVol.value));
  sync();
  function playSfx(kind){
    if(!soundOn)return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    if(!window.sfxAudioCtx)window.sfxAudioCtx=new AC();
    const ctx=window.sfxAudioCtx;if(ctx.state==='suspended')ctx.resume();
    const now=ctx.currentTime, osc=ctx.createOscillator(), gain=ctx.createGain();
    const st=kind==='collect'?{f:360,end:820,d:.13,type:'sine'}:kind==='win'?{f:180,end:440,d:.48,type:'triangle'}:kind==='start'?{f:150,end:270,d:.18,type:'triangle'}:{f:150,end:65,d:.12,type:'sine'};
    osc.type=st.type;osc.frequency.setValueAtTime(st.f,now);osc.frequency.exponentialRampToValueAtTime(st.end,now+st.d);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime((kind==='win'?.07:.03)*Math.max(.1,music.volume),now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+st.d);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+st.d+.02);
  }

  $$('[data-move]').forEach(btn=>{const direction=btn.dataset.move;const move=()=>{if(direction==='up')movePlayer(0,-5);if(direction==='down')movePlayer(0,5);if(direction==='left')movePlayer(-5,0);if(direction==='right')movePlayer(5,0);};btn.addEventListener('click',move);btn.addEventListener('touchstart',e=>{e.preventDefault();move();},{passive:false});});

  // User-controlled cinematic slideshow with autoplay, dots, keyboard and touch support.
  const slides=$$('.slide-image'), dots=$$('#slideDots button'), slideCounter=$('#slideCounter');
  let activeSlide=0, slideTimer=null;
  function showSlide(index){
    if(!slides.length)return;
    activeSlide=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>slide.classList.toggle('active',i===activeSlide));
    dots.forEach((dot,i)=>dot.classList.toggle('active',i===activeSlide));
    if(slideCounter)slideCounter.textContent=String(activeSlide+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
  }
  $('#slidePrev')?.addEventListener('click',()=>{showSlide(activeSlide-1);restartSlideTimer();});
  $('#slideNext')?.addEventListener('click',()=>{showSlide(activeSlide+1);restartSlideTimer();});
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{showSlide(i);restartSlideTimer();}));
  function restartSlideTimer(){clearInterval(slideTimer);if(!document.body.classList.contains('motion-paused'))slideTimer=setInterval(()=>showSlide(activeSlide+1),6500);}
  restartSlideTimer();
  const heroSlideshow=$('#heroSlideshow');
  let touchStartX=0;
  heroSlideshow?.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX;},{passive:true});
  heroSlideshow?.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStartX;if(Math.abs(dx)>45){showSlide(activeSlide+(dx<0?1:-1));restartSlideTimer();}},{passive:true});
  $$('.visual-card').forEach(card=>{
    card.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-5px)`;});
    card.addEventListener('pointerleave',()=>{card.style.transform='';});
  });

  // Lightweight animated starfield; respects reduced-motion and the pause button.
  const canvas=$('#starfield'), ctx=canvas.getContext('2d'); let stars=[], raf=0;
  function resizeCanvas(){
    const rect=shell.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.floor(rect.width*dpr)); canvas.height=Math.max(1,Math.floor(rect.height*dpr));
    canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:Math.min(140,Math.floor(rect.width/8))},()=>({x:Math.random()*rect.width,y:Math.random()*Math.max(innerHeight,rect.height),r:Math.random()*1.4+.2,a:Math.random()*.55+.12,s:Math.random()*.16+.025}));
  }
  function drawStars(){
    if(!document.body.classList.contains('motion-paused') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);
      stars.forEach(s=>{s.y-=s.s;if(s.y<0){s.y=h;s.x=Math.random()*w;}ctx.globalAlpha=s.a;ctx.fillStyle='#c7ecff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});
      ctx.globalAlpha=1;
    }
    raf=requestAnimationFrame(drawStars);
  }
  window.addEventListener('resize',resizeCanvas);
  // Wait until entering so the canvas measures the visible page.
  enter.addEventListener('click',()=>{setTimeout(()=>{resizeCanvas();if(!raf)drawStars();},50);},{once:true});
  // Also initialize if site is entered with keyboard.
  setTimeout(()=>{if(!raf){resizeCanvas();drawStars();}},1800);
})();
/* Polish: highlight the nav link of the section in view */
(()=>{const links=[...document.querySelectorAll('#mainNav a')];const map=new Map(links.map(a=>[a.hash.slice(1),a]));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){links.forEach(l=>{l.classList.remove('active');l.removeAttribute('aria-current')});const a=map.get(e.target.id);if(a){a.classList.add('active');a.setAttribute('aria-current','true')}}}),{rootMargin:'-45% 0px -50% 0px'});
map.forEach((_,id)=>{const s=document.getElementById(id);if(s)io.observe(s)});})();


/* Contact form: FormSubmit AJAX */
(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const button = document.getElementById("cfSubmit");
  const label = button?.querySelector(".cf-label");
  const status = document.getElementById("cfStatus");

  let submitting = false;

  function showStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.className = "cf-status " + type;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitting || !form.reportValidity()) return;

    const honeypot = form.querySelector('[name="_honey"]');

    if (honeypot && honeypot.value.trim() !== "") return;

    submitting = true;

    if (button) button.disabled = true;
    if (label) label.textContent = "SENDING...";

    showStatus("Sending your message...", "is-sending");

    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const response = await fetch(
        "https://formsubmit.co/ajax/amara2004ama@gmail.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(data)
        }
      );

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("The email service returned an unreadable response.");
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "The email service could not accept your message."
        );
      }

      showStatus(
        "Your message was submitted successfully. Thank you for contacting me!",
        "is-success"
      );

      form.reset();
    } catch (error) {
      console.error("Contact form submission failed:", error);

      showStatus(
        "Message could not be submitted. Please check your connection or email me directly at amara2004ama@gmail.com.",
        "is-error"
      );
    } finally {
      submitting = false;

      if (button) button.disabled = false;
      if (label) label.textContent = "SEND MESSAGE";
    }
  });
})();






