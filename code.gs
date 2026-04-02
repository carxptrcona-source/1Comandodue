(function(){
  const STORAGE_KEY = "yt_content_os_lite_v2";

  const state = loadState();

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "today", icon: "📅", label: "Hoy" },
    { id: "calendar", icon: "🗓️", label: "Calendario" },
    { id: "library", icon: "📚", label: "Biblioteca" },
    { id: "create", icon: "✨", label: "Crear Contenido" },
    { id: "pipeline", icon: "🧩", label: "Pipeline" },
    { id: "ai", icon: "🤖", label: "AI Studio" },
    { id: "settings", icon: "⚙️", label: "Settings" }
  ];

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayNames = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

  init();

  function init(){
    if(!state.contentItems.length){
      seedInitialData();
      saveState();
    }
    renderNav();
    bindGlobalEvents();
    hydrateAIConfigInputs();
    render();
  }

  function loadState(){
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = {
      currentView: "dashboard",
      selectedLibraryChannel: "ERB",
      selectedPipelineFilter: "all",
      selectedCalendarMonth: 3,
      selectedCalendarYear: 2026,
      aiConfig: {
        mode: "manual",
        proxyUrl: "",
        model: "gemini-1.5-flash"
      },
      ui: {
        createChannel: "ERB",
        createFormat: "long",
        createIdea: "",
        createTone: "",
        createDuration: "",
        createObjective: ""
      },
      aiRuntime: {
        targetItemId: null,
        targetField: "script",
        output: ""
      },
      contentItems: [],
      generatedOutputs: []
    };

    if(!raw) return base;

    try{
      const parsed = JSON.parse(raw);
      return {
        ...base,
        ...parsed,
        aiConfig: { ...base.aiConfig, ...(parsed.aiConfig || {}) },
        ui: { ...base.ui, ...(parsed.ui || {}) },
        aiRuntime: { ...base.aiRuntime, ...(parsed.aiRuntime || {}) }
      };
    }catch{
      return base;
    }
  }

  function saveState(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid(prefix="CNT"){
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  }

  function hydrateAIConfigInputs(){
    const mode = document.getElementById("aiMode");
    const proxy = document.getElementById("aiProxyUrl");
    const model = document.getElementById("aiModel");
    if(mode) mode.value = state.aiConfig.mode || "manual";
    if(proxy) proxy.value = state.aiConfig.proxyUrl || "";
    if(model) model.value = state.aiConfig.model || "gemini-1.5-flash";
  }

  function renderNav(){
    const nav = document.getElementById("sideNav");
    nav.innerHTML = navItems.map(item => `
      <button class="nav-btn ${state.currentView===item.id ? "active" : ""}" data-nav="${item.id}">
        <span>${item.icon}</span>
        <span>${item.label}</span>
      </button>
    `).join("");
  }

  function bindGlobalEvents(){
    document.getElementById("sideNav").addEventListener("click", e=>{
      const btn = e.target.closest("[data-nav]");
      if(!btn) return;
      state.currentView = btn.dataset.nav;
      renderNav();
      render();
      saveState();
    });

    document.getElementById("saveBtn").onclick = ()=>{
      saveState();
      alert("✅ Estado guardado");
    };

    document.getElementById("exportBtn").onclick = exportJSON;

    document.getElementById("importBtn").onclick = ()=>{
      document.getElementById("importFile").click();
    };

    document.getElementById("importFile").addEventListener("change", importJSON);

    document.getElementById("resetBtn").onclick = ()=>{
      const ok = confirm("⚠️ Esto borrará todo el sistema local. ¿Continuar?");
      if(!ok) return;
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    };

    document.getElementById("saveAiConfigBtn").onclick = saveAIConfig;
    document.getElementById("testAiBtn").onclick = testAI;
    document.getElementById("modalClose").onclick = closeModal;
    document.getElementById("modal").addEventListener("click", e=>{
      if(e.target.id==="modal") closeModal();
    });
  }

  function saveAIConfig(){
    state.aiConfig.mode = document.getElementById("aiMode").value;
    state.aiConfig.proxyUrl = document.getElementById("aiProxyUrl").value.trim();
    state.aiConfig.model = document.getElementById("aiModel").value.trim() || "gemini-1.5-flash";
    saveState();
    alert("✅ Config IA guardada");
  }

  async function testAI(){
    if(state.aiConfig.mode==="manual"){
      state.aiRuntime.output = "✅ Modo manual activo.";
      saveState();
      alert("Modo manual activo");
      return;
    }
    if(!state.aiConfig.proxyUrl){
      alert("⚠️ Falta URL del proxy");
      return;
    }
    try{
      const out = await callAI("Responde solo: PROXY OK");
      state.aiRuntime.output = out;
      saveState();
      openOutputModal("Test IA", out);
    }catch(err){
      alert("❌ " + (err.message || err));
    }
  }

  function render(){
    const main = document.getElementById("main");
    const views = {
      dashboard: renderDashboard,
      today: renderToday,
      calendar: renderCalendar,
      library: renderLibrary,
      create: renderCreate,
      pipeline: renderPipeline,
      ai: renderAIStudio,
      settings: renderSettings
    };
    document.getElementById("topbarSub").textContent = getHeaderSub();
    main.innerHTML = views[state.currentView]();
    bindViewEvents();
  }

  function getHeaderSub(){
    const total = state.contentItems.length;
    const published = state.contentItems.filter(x=>x.status==="published").length;
    return `${total} piezas · ${published} publicadas · modo IA: ${state.aiConfig.mode}`;
  }

  function renderDashboard(){
    const byChannel = {
      ERB: state.contentItems.filter(x=>x.channel==="ERB").length,
      ISM: state.contentItems.filter(x=>x.channel==="ISM").length
    };
    const ready = state.contentItems.filter(x=>x.status==="ready").length;
    const scheduled = state.contentItems.filter(x=>x.status==="scheduled").length;
    const nextItems = [...state.contentItems]
      .filter(x=>x.scheduledAt)
      .sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt))
      .slice(0,6);

    return `
      <div class="hero">
        <div class="card">
          <div class="big-title">Sistema operativo de contenido ligero</div>
          <div class="muted small">
            Crea ideas, guiones, títulos, visuales, descripciones y hashtags con apoyo de Gemini.
          </div>
          <div class="row-wrap" style="margin-top:12px">
            <span class="badge erb">🩸 ERB</span>
            <span class="badge ism">🔵 ISM</span>
            <span class="badge or">🤖 Gemini</span>
            <span class="badge pu">💾 JSON Backup</span>
          </div>
          <hr class="sep">
          <div class="small muted">
            Consejo: entra en <span class="kbd">Crear Contenido</span> y luego usa IA dentro de la ficha.
          </div>
        </div>

        <div class="card">
          <div class="card-title">⚡ Flujo recomendado</div>
          <div class="checklist">
            <div class="check"><input type="checkbox"> <div>Crear ficha</div></div>
            <div class="check"><input type="checkbox"> <div>Generar guion</div></div>
            <div class="check"><input type="checkbox"> <div>Generar títulos y visuales</div></div>
            <div class="check"><input type="checkbox"> <div>Programar y publicar</div></div>
          </div>
        </div>
      </div>

      <div class="grid grid-4">
        <div class="stat">
          <div class="stat-num" style="color:var(--erb2)">${byChannel.ERB}</div>
          <div class="stat-label">ERB</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color:var(--ism2)">${byChannel.ISM}</div>
          <div class="stat-label">ISM</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color:var(--gr)">${ready}</div>
          <div class="stat-label">Listas</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color:var(--pu)">${scheduled}</div>
          <div class="stat-label">Programadas</div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <div class="card">
          <div class="card-title">📆 Próximas piezas</div>
          ${nextItems.length ? `
            <div class="list">${nextItems.map(renderItemCard).join("")}</div>
          ` : `<div class="empty">No hay piezas programadas.</div>`}
        </div>

        <div class="card">
          <div class="card-title">🧠 Último output IA</div>
          ${state.aiRuntime.output
            ? `<div class="output-box">${escapeHtml(state.aiRuntime.output)}</div>`
            : `<div class="empty">Sin resultados IA recientes.</div>`}
        </div>
      </div>
    `;
  }

  function renderToday(){
    const today = toYmd(new Date());
    const items = state.contentItems.filter(x=>x.scheduledAt && toYmd(new Date(x.scheduledAt))===today);

    return `
      <div class="section-head">
        <div>
          <div class="big-title">Hoy</div>
          <div class="muted small">Publicaciones y foco del día</div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">📌 Programadas hoy</div>
          ${items.length ? `<div class="list">${items.map(renderItemCard).join("")}</div>` : `<div class="empty">No hay piezas hoy.</div>`}
        </div>
        <div class="card">
          <div class="card-title">✅ Checklist del día</div>
          <div class="checklist">
            <div class="check"><input type="checkbox"> <div>Avanzar al menos 1 pieza</div></div>
            <div class="check"><input type="checkbox"> <div>Generar títulos o visuales con IA</div></div>
            <div class="check"><input type="checkbox"> <div>Actualizar pipeline</div></div>
            <div class="check"><input type="checkbox"> <div>Guardar backup si hubo muchos cambios</div></div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCalendar(){
    const year = state.selectedCalendarYear;
    const month = state.selectedCalendarMonth;
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells = [];
    for(let i=0;i<startDay;i++){
      cells.push({ out:true, date:new Date(year, month-1, prevDays-startDay+i+1) });
    }
    for(let d=1; d<=daysInMonth; d++){
      cells.push({ out:false, date:new Date(year, month, d) });
    }
    while(cells.length % 7 !== 0){
      const extra = cells.length - (startDay + daysInMonth) + 1;
      cells.push({ out:true, date:new Date(year, month+1, extra) });
    }

    return `
      <div class="section-head">
        <div>
          <div class="big-title">Calendario editorial</div>
          <div class="muted small">Base activa desde 2 abril 2026</div>
        </div>
        <div class="row-wrap">
          <button class="btn btn-ghost" id="prevMonthBtn">← Mes</button>
          <span class="badge gray">${monthNames[month]} ${year}</span>
          <button class="btn btn-ghost" id="nextMonthBtn">Mes →</button>
          <button class="btn btn-success" id="autoPlanBtn">Auto-planificar</button>
        </div>
      </div>

      <div class="row-wrap" style="margin-bottom:10px">
        ${dayNames.map(d=>`<span class="badge gray">${d.slice(0,3)}</span>`).join("")}
      </div>

      <div class="calendar-grid">
        ${cells.map(cell=>{
          const items = state.contentItems.filter(x=>x.scheduledAt && toYmd(new Date(x.scheduledAt))===toYmd(cell.date));
          return `
            <div class="calendar-day ${cell.out?'out':''}">
              <div class="calendar-date">
                <span>${cell.date.getDate()}</span>
                ${!cell.out ? `<button class="icon-btn" data-add-date="${toYmd(cell.date)}">＋</button>` : ""}
              </div>
              <div class="cal-items">
                ${items.map(item=>`
                  <div class="cal-item ${item.channel==='ERB'?'erb':'ism'}" data-open-item="${item.id}">
                    <strong>${item.channel}</strong><br>
                    ${escapeHtml((item.title || item.idea || "Sin título").slice(0,52))}
                  </div>
                `).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderLibrary(){
    const ch = state.selectedLibraryChannel;
    const ideas = ch==="ERB" ? APP_DATA.erbIdeas : APP_DATA.ismIdeas;

    return `
      <div class="section-head">
        <div>
          <div class="big-title">Biblioteca</div>
          <div class="muted small">Ideas semilla para arrancar rápido</div>
        </div>
        <div class="row-wrap">
          <button class="pill ${ch==='ERB'?'active':''}" data-lib="ERB">ERB</button>
          <button class="pill ${ch==='ISM'?'active':''}" data-lib="ISM">ISM</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📦 Ideas disponibles</div>
        <div class="list">
          ${ideas.map((idea,i)=>`
            <div class="item">
              <div class="row-wrap">
                <span class="badge ${ch==='ERB'?'erb':'ism'}">${ch}</span>
                <span class="badge gray">Idea ${i+1}</span>
              </div>
              <div class="item-title">${escapeHtml(idea)}</div>
              <div class="row-wrap" style="margin-top:8px">
                <button class="btn ${ch==='ERB'?'btn-erb':'btn-ism'}" data-use-idea="${encodeURIComponent(idea)}" data-use-channel="${ch}">Usar</button>
                <button class="btn btn-ghost" data-copy-text="${encodeURIComponent(idea)}">Copiar</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderCreate(){
    const ui = state.ui;
    return `
      <div class="section-head">
        <div>
          <div class="big-title">Crear contenido desde cero</div>
          <div class="muted small">Ficha rápida y lista para IA</div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">Datos base</div>

          <label class="label">Canal</label>
          <select class="input" id="createChannel">
            <option value="ERB" ${ui.createChannel==="ERB"?"selected":""}>ERB</option>
            <option value="ISM" ${ui.createChannel==="ISM"?"selected":""}>ISM</option>
          </select>

          <label class="label">Formato</label>
          <select class="input" id="createFormat">
            <option value="long" ${ui.createFormat==="long"?"selected":""}>Video largo</option>
            <option value="short" ${ui.createFormat==="short"?"selected":""}>Short</option>
            <option value="post" ${ui.createFormat==="post"?"selected":""}>Post</option>
          </select>

          <label class="label">Idea</label>
          <textarea class="textarea" id="createIdea">${escapeHtml(ui.createIdea || "")}</textarea>

          <label class="label">Tono</label>
          <input class="input" id="createTone" value="${escapeHtml(ui.createTone || "")}" placeholder="oscuro, útil, directo..." />

          <label class="label">Duración objetivo</label>
          <input class="input" id="createDuration" value="${escapeHtml(ui.createDuration || "")}" placeholder="6-8 min / 30-45 s" />

          <label class="label">Objetivo</label>
          <textarea class="textarea" id="createObjective">${escapeHtml(ui.createObjective || "")}</textarea>

          <div class="row-wrap">
            <button class="btn btn-primary" id="createContentBtn">Crear ficha</button>
            <button class="btn btn-success" id="previewPromptBtn">Ver prompt</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Qué genera</div>
          <div class="checklist">
            <div class="check"><input type="checkbox" checked disabled> <div>Ficha editable completa</div></div>
            <div class="check"><input type="checkbox" checked disabled> <div>Checklist según canal</div></div>
            <div class="check"><input type="checkbox" checked disabled> <div>Fecha sugerida automática</div></div>
            <div class="check"><input type="checkbox" checked disabled> <div>Prompt listo para Gemini</div></div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPipeline(){
    const filter = state.selectedPipelineFilter;
    const items = filter==="all" ? state.contentItems : state.contentItems.filter(x=>x.channel===filter);
    const cols = ["idea","research","script","visual","edit","ready","scheduled","published"];

    return `
      <div class="section-head">
        <div>
          <div class="big-title">Pipeline</div>
          <div class="muted small">Estado de producción</div>
        </div>
        <div class="row-wrap">
          <button class="pill ${filter==='all'?'active':''}" data-pipe="all">Todos</button>
          <button class="pill ${filter==='ERB'?'active':''}" data-pipe="ERB">ERB</button>
          <button class="pill ${filter==='ISM'?'active':''}" data-pipe="ISM">ISM</button>
        </div>
      </div>

      <div class="kanban">
        ${cols.map(col=>{
          const colItems = items.filter(x=>x.status===col);
          return `
            <div class="kanban-col">
              <div class="kanban-head">
                <span>${labelStatus(col)}</span>
                <span class="badge gray">${colItems.length}</span>
              </div>
              <div class="kanban-items">
                ${colItems.length ? colItems.map(item=>`
                  <div class="kanban-card" data-open-item="${item.id}">
                    <div class="row-wrap">
                      <span class="badge ${item.channel==='ERB'?'erb':'ism'}">${item.channel}</span>
                      <span class="badge gray">${item.format}</span>
                    </div>
                    <div class="item-title">${escapeHtml((item.title || item.idea || "Sin título").slice(0,70))}</div>
                    <div class="item-meta">${item.scheduledAt ? formatDateTime(item.scheduledAt) : "Sin fecha"}</div>
                  </div>
                `).join("") : `<div class="empty">vacío</div>`}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderAIStudio(){
    const recent = [...state.generatedOutputs].reverse().slice(0,8);

    return `
      <div class="section-head">
        <div>
          <div class="big-title">AI Studio</div>
          <div class="muted small">Prompts rápidos y resultados recientes</div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">Generadores rápidos</div>

          <label class="label">Canal</label>
          <select class="input" id="studioChannel">
            <option value="ERB">ERB</option>
            <option value="ISM">ISM</option>
          </select>

          <label class="label">Tema / Input</label>
          <textarea class="textarea" id="studioTopic" placeholder="Escribe un tema o pega una idea..."></textarea>

          <div class="row-wrap">
            <button class="btn btn-primary" id="studioTitlesBtn">Títulos</button>
            <button class="btn btn-primary" id="studioVisualsBtn">Visuales</button>
            <button class="btn btn-primary" id="studioRepurposeBtn">Reutilizar</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Historial IA</div>
          ${recent.length ? `
            <div class="list">
              ${recent.map(r=>`
                <div class="item">
                  <div class="row-wrap">
                    <span class="badge gray">${escapeHtml(r.type)}</span>
                    <span class="badge ${r.channel==='ERB'?'erb':r.channel==='ISM'?'ism':'gray'}">${escapeHtml(r.channel || "General")}</span>
                  </div>
                  <div class="item-title">${escapeHtml((r.title || "Salida IA").slice(0,80))}</div>
                  <div class="item-meta">${new Date(r.createdAt).toLocaleString("es-ES")}</div>
                  <div class="row-wrap" style="margin-top:8px">
                    <button class="btn btn-ghost" data-open-output="${r.id}">Ver</button>
                    <button class="btn btn-ghost" data-copy-output="${r.id}">Copiar</button>
                  </div>
                </div>
              `).join("")}
            </div>
          ` : `<div class="empty">No hay outputs todavía.</div>`}
        </div>
      </div>
    `;
  }

  function renderSettings(){
    return `
      <div class="section-head">
        <div>
          <div class="big-title">Settings</div>
          <div class="muted small">Configuración actual</div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">IA</div>
          <table class="table">
            <tbody>
              <tr><td>Modo</td><td>${escapeHtml(state.aiConfig.mode)}</td></tr>
              <tr><td>Proxy</td><td>${escapeHtml(state.aiConfig.proxyUrl || "No configurado")}</td></tr>
              <tr><td>Modelo</td><td>${escapeHtml(state.aiConfig.model || "-")}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title">Datos</div>
          <table class="table">
            <tbody>
              <tr><td>Piezas</td><td>${state.contentItems.length}</td></tr>
              <tr><td>Outputs IA</td><td>${state.generatedOutputs.length}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function bindViewEvents(){
    bindDashboardEvents();
    bindTodayEvents();
    bindCalendarEvents();
    bindLibraryEvents();
    bindCreateEvents();
    bindPipelineEvents();
    bindGeneralItemEvents();
    bindAIStudioEvents();
  }

  function bindDashboardEvents(){}
  function bindTodayEvents(){}

  function bindCalendarEvents(){
    const prev = document.getElementById("prevMonthBtn");
    const next = document.getElementById("nextMonthBtn");
    const auto = document.getElementById("autoPlanBtn");

    if(prev) prev.onclick = ()=>{
      state.selectedCalendarMonth--;
      if(state.selectedCalendarMonth < 0){
        state.selectedCalendarMonth = 11;
        state.selectedCalendarYear--;
      }
      saveState();
      render();
    };

    if(next) next.onclick = ()=>{
      state.selectedCalendarMonth++;
      if(state.selectedCalendarMonth > 11){
        state.selectedCalendarMonth = 0;
        state.selectedCalendarYear++;
      }
      saveState();
      render();
    };

    if(auto) auto.onclick = ()=>{
      autoPlanifyMissing();
      saveState();
      render();
      alert("✅ Piezas sin fecha auto-planificadas");
    };

    document.querySelectorAll("[data-add-date]").forEach(btn=>{
      btn.onclick = ()=> openQuickCreateForDate(btn.dataset.addDate);
    });
  }

  function bindLibraryEvents(){
    document.querySelectorAll("[data-lib]").forEach(btn=>{
      btn.onclick = ()=>{
        state.selectedLibraryChannel = btn.dataset.lib;
        saveState();
        render();
      };
    });

    document.querySelectorAll("[data-use-idea]").forEach(btn=>{
      btn.onclick = ()=>{
        state.ui.createChannel = btn.dataset.useChannel;
        state.ui.createIdea = decodeURIComponent(btn.dataset.useIdea);
        state.currentView = "create";
        saveState();
        renderNav();
        render();
      };
    });

    document.querySelectorAll("[data-copy-text]").forEach(btn=>{
      btn.onclick = async ()=>{
        await navigator.clipboard.writeText(decodeURIComponent(btn.dataset.copyText));
        alert("✅ Copiado");
      };
    });
  }

  function bindCreateEvents(){
    const elChannel = document.getElementById("createChannel");
    const elFormat = document.getElementById("createFormat");
    const elIdea = document.getElementById("createIdea");
    const elTone = document.getElementById("createTone");
    const elDuration = document.getElementById("createDuration");
    const elObjective = document.getElementById("createObjective");
    const createBtn = document.getElementById("createContentBtn");
    const previewBtn = document.getElementById("previewPromptBtn");

    if(!elChannel) return;

    elChannel.onchange = ()=>{ state.ui.createChannel = elChannel.value; saveState(); };
    elFormat.onchange = ()=>{ state.ui.createFormat = elFormat.value; saveState(); };
    elIdea.oninput = ()=>{ state.ui.createIdea = elIdea.value; saveState(); };
    elTone.oninput = ()=>{ state.ui.createTone = elTone.value; saveState(); };
    elDuration.oninput = ()=>{ state.ui.createDuration = elDuration.value; saveState(); };
    elObjective.oninput = ()=>{ state.ui.createObjective = elObjective.value; saveState(); };

    createBtn.onclick = ()=>{
      if(!state.ui.createIdea.trim()) return alert("⚠️ Escribe una idea");
      const item = createItem({
        channel: state.ui.createChannel,
        format: state.ui.createFormat,
        idea: state.ui.createIdea.trim(),
        tone: state.ui.createTone.trim(),
        duration: state.ui.createDuration.trim(),
        objective: state.ui.createObjective.trim()
      });
      state.contentItems.unshift(item);
      saveState();
      render();
      openItemModal(item.id);
    };

    previewBtn.onclick = ()=>{
      if(!state.ui.createIdea.trim()) return alert("⚠️ Escribe una idea");
      const tempItem = {
        channel: state.ui.createChannel,
        idea: state.ui.createIdea.trim(),
        title: "",
        tone: state.ui.createTone.trim(),
        duration: state.ui.createDuration.trim(),
        objective: state.ui.createObjective.trim(),
        script: ""
      };
      const prompt = APP_DATA.prompts.main(tempItem.channel, tempItem);
      saveOutput("create-prompt", tempItem.channel, tempItem.idea, prompt);
      openPromptModal(prompt, "Prompt principal", null, null);
    };
  }

  function bindPipelineEvents(){
    document.querySelectorAll("[data-pipe]").forEach(btn=>{
      btn.onclick = ()=>{
        state.selectedPipelineFilter = btn.dataset.pipe;
        saveState();
        render();
      };
    });
  }

  function bindGeneralItemEvents(){
    document.querySelectorAll("[data-open-item]").forEach(btn=>{
      btn.onclick = ()=> openItemModal(btn.dataset.openItem);
    });
  }

  function bindAIStudioEvents(){
    const titlesBtn = document.getElementById("studioTitlesBtn");
    const visualsBtn = document.getElementById("studioVisualsBtn");
    const repurposeBtn = document.getElementById("studioRepurposeBtn");

    if(titlesBtn) titlesBtn.onclick = ()=>{
      const ch = document.getElementById("studioChannel").value;
      const topic = document.getElementById("studioTopic").value.trim();
      if(!topic) return alert("⚠️ Escribe un tema");
      const prompt = APP_DATA.prompts.titles(APP_DATA.channels[ch].label, topic);
      saveOutput("titles-tool", ch, topic, prompt);
      openPromptModal(prompt, "Prompt Títulos", null, null);
    };

    if(visualsBtn) visualsBtn.onclick = ()=>{
      const ch = document.getElementById("studioChannel").value;
      const topic = document.getElementById("studioTopic").value.trim();
      if(!topic) return alert("⚠️ Escribe un tema");
      const prompt = APP_DATA.prompts.visuals(APP_DATA.channels[ch].label, topic);
      saveOutput("visuals-tool", ch, topic, prompt);
      openPromptModal(prompt, "Prompt Visuales", null, null);
    };

    if(repurposeBtn) repurposeBtn.onclick = ()=>{
      const ch = document.getElementById("studioChannel").value;
      const topic = document.getElementById("studioTopic").value.trim();
      if(!topic) return alert("⚠️ Escribe un tema");
      const fake = { script: topic, title: topic, idea: topic };
      const prompt = APP_DATA.prompts.repurpose(APP_DATA.channels[ch].label, fake);
      saveOutput("repurpose-tool", ch, topic, prompt);
      openPromptModal(prompt, "Prompt Reutilización", null, null);
    };

    document.querySelectorAll("[data-open-output]").forEach(btn=>{
      btn.onclick = ()=>{
        const found = state.generatedOutputs.find(x=>x.id===btn.dataset.openOutput);
        if(!found) return;
        openOutputModal(found.title || "Output IA", found.content);
      };
    });

    document.querySelectorAll("[data-copy-output]").forEach(btn=>{
      btn.onclick = async ()=>{
        const found = state.generatedOutputs.find(x=>x.id===btn.dataset.copyOutput);
        if(!found) return;
        await navigator.clipboard.writeText(found.content);
        alert("✅ Copiado");
      };
    });
  }

  function createItem({channel, format, idea, tone, duration, objective, scheduledAt}){
    return {
      id: uid(channel),
      channel,
      format,
      idea,
      title: "",
      tone: tone || "",
      duration: duration || "",
      objective: objective || "",
      status: "idea",
      scheduledAt: scheduledAt || suggestNextDate(channel),
      script: "",
      titles: "",
      visuals: "",
      description: "",
      hashtags: "",
      notes: "",
      checklist: APP_DATA.checklists[channel].map(text => ({ text, done:false })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function suggestNextDate(channel){
    const cfg = APP_DATA.channels[channel].schedule;
    const now = new Date();
    for(let i=0;i<45;i++){
      const d = new Date(now);
      d.setDate(now.getDate()+i);
      if(cfg.days.includes(d.getDay())){
        const [hh,mm] = cfg.time.split(":").map(Number);
        d.setHours(hh,mm,0,0);
        const occupied = state.contentItems.some(x=>x.channel===channel && x.scheduledAt && toYmd(new Date(x.scheduledAt))===toYmd(d));
        if(!occupied) return d.toISOString();
      }
    }
    return now.toISOString();
  }

  function autoPlanifyMissing(){
    state.contentItems.forEach(item=>{
      if(!item.scheduledAt) item.scheduledAt = suggestNextDate(item.channel);
    });
  }

  function openQuickCreateForDate(dateStr){
    const body = `
      <div class="grid grid-2">
        <div>
          <label class="label">Canal</label>
          <select class="input" id="quickChannel">
            <option value="ERB">ERB</option>
            <option value="ISM">ISM</option>
          </select>
        </div>
        <div>
          <label class="label">Formato</label>
          <select class="input" id="quickFormat">
            <option value="long">Video largo</option>
            <option value="short">Short</option>
            <option value="post">Post</option>
          </select>
        </div>
      </div>
      <label class="label">Idea</label>
      <textarea class="textarea" id="quickIdea"></textarea>
      <div class="row-wrap">
        <button class="btn btn-primary" id="quickCreateSubmit">Crear</button>
      </div>
    `;
    openModal("Nueva pieza", body);

    document.getElementById("quickCreateSubmit").onclick = ()=>{
      const channel = document.getElementById("quickChannel").value;
      const format = document.getElementById("quickFormat").value;
      const idea = document.getElementById("quickIdea").value.trim();
      if(!idea) return alert("⚠️ Escribe una idea");

      const d = new Date(dateStr);
      const [hh,mm] = APP_DATA.channels[channel].schedule.time.split(":").map(Number);
      d.setHours(hh,mm,0,0);

      const item = createItem({
        channel, format, idea,
        scheduledAt: d.toISOString()
      });

      state.contentItems.unshift(item);
      saveState();
      closeModal();
      render();
      openItemModal(item.id);
    };
  }

  function openItemModal(itemId){
    const item = state.contentItems.find(x=>x.id===itemId);
    if(!item) return;

    const statusOptions = APP_DATA.statuses.map(s=>`
      <option value="${s.id}" ${item.status===s.id?"selected":""}>${s.label}</option>
    `).join("");

    const body = `
      <div class="grid grid-2">
        <div>
          <label class="label">Canal</label>
          <input class="input" value="${escapeHtml(item.channel)}" disabled />
        </div>
        <div>
          <label class="label">Estado</label>
          <select class="input" id="itemStatus">${statusOptions}</select>
        </div>
      </div>

      <label class="label">Idea</label>
      <textarea class="textarea" id="itemIdea">${escapeHtml(item.idea || "")}</textarea>

      <label class="label">Título</label>
      <input class="input" id="itemTitle" value="${escapeHtml(item.title || "")}" placeholder="Título final o provisional" />

      <div class="grid grid-2">
        <div>
          <label class="label">Tono</label>
          <input class="input" id="itemTone" value="${escapeHtml(item.tone || "")}" />
        </div>
        <div>
          <label class="label">Duración</label>
          <input class="input" id="itemDuration" value="${escapeHtml(item.duration || "")}" />
        </div>
      </div>

      <label class="label">Objetivo</label>
      <textarea class="textarea" id="itemObjective">${escapeHtml(item.objective || "")}</textarea>

      <label class="label">Fecha programada</label>
      <input class="input" type="datetime-local" id="itemDate" value="${toDateTimeLocal(item.scheduledAt)}" />

      <label class="label">Guion</label>
      <textarea class="textarea" id="itemScript">${escapeHtml(item.script || "")}</textarea>

      <label class="label">Títulos</label>
      <textarea class="textarea" id="itemTitles">${escapeHtml(item.titles || "")}</textarea>

      <label class="label">Visuales</label>
      <textarea class="textarea" id="itemVisuals">${escapeHtml(item.visuals || "")}</textarea>

      <label class="label">Descripción</label>
      <textarea class="textarea" id="itemDescription">${escapeHtml(item.description || "")}</textarea>

      <label class="label">Hashtags</label>
      <textarea class="textarea" id="itemHashtags">${escapeHtml(item.hashtags || "")}</textarea>

      <label class="label">Notas</label>
      <textarea class="textarea" id="itemNotes">${escapeHtml(item.notes || "")}</textarea>

      <div class="card" style="padding:12px;margin-top:12px">
        <div class="card-title">Checklist</div>
        <div class="checklist">
          ${item.checklist.map((c,idx)=>`
            <label class="check">
              <input type="checkbox" data-check="${idx}" ${c.done?"checked":""}>
              <div>${escapeHtml(c.text)}</div>
            </label>
          `).join("")}
        </div>
      </div>

      <hr class="sep">

      <div class="row-wrap">
        <button class="btn btn-success" id="saveItemBtn">Guardar</button>
        <button class="btn btn-primary" id="mainPromptBtn">Guion IA</button>
        <button class="btn btn-ghost" id="titlesPromptBtn">Títulos IA</button>
        <button class="btn btn-ghost" id="visualsPromptBtn">Visuales IA</button>
        <button class="btn btn-ghost" id="descPromptBtn">Descripción IA</button>
        <button class="btn btn-ghost" id="tagsPromptBtn">Hashtags IA</button>
        <button class="btn btn-ghost" id="repurposePromptBtn">Reutilizar IA</button>
        <button class="btn btn-danger" id="deleteItemBtn">Eliminar</button>
      </div>
    `;

    openModal(`Ficha: ${item.id}`, body);

    document.getElementById("saveItemBtn").onclick = ()=>{
      saveItemForm(item.id);
      alert("✅ Guardado");
    };

    document.getElementById("mainPromptBtn").onclick = ()=>{
      saveItemForm(item.id, false);
      const fresh = getItem(item.id);
      const prompt = APP_DATA.prompts.main(fresh.channel, fresh);
      saveOutput("main-prompt", fresh.channel, fresh.title || fresh.idea, prompt);
      openPromptModal(prompt, "Guion IA", item.id, "script");
    };

    document.getElementById("titlesPromptBtn").onclick = ()=>{
      saveItemForm(item.id, false);
      const fresh = getItem(item.id);
      const prompt = APP_DATA.prompts.titles(APP_DATA.channels[fresh.channel].label, fresh.title || fresh.idea);
      saveOutput("titles-prompt", fresh.channel, fresh.title || fresh.idea, prompt);
      openPromptModal(prompt, "Títulos IA", item.id, "titles");
    };

    document.getElementById("visualsPromptBtn").onclick = ()=>{
      saveItemForm(item.id, false);
      const fresh = getItem(item.id);
      const prompt = APP_DATA.prompts.visuals(APP_DATA.channels[fresh.channel].label, fresh.title || fresh.idea);
      saveOutput("visuals-prompt", fresh.channel, fresh.title || fresh.idea, prompt);
      openPromptModal(prompt, "Visuales IA", item.id, "visuals");
    };

    document.getElementById("descPromptBtn").onclick = ()=>{
      saveItemForm(item.id, false);
      const fresh = getItem(item.id);
      const prompt = APP_DATA.prompts.description(APP_DATA.channels[fresh.channel].label, fresh);
      saveOutput("description-prompt", fresh.channel, fresh.title || fresh.idea, prompt);
      openPromptModal(prompt, "Descripción IA", item.id, "description");
    };

    document.getElementById("tagsPromptBtn").onclick = ()=>{
      saveItemForm(item.id, false);
      const fresh = getItem(item.id);
      const prompt = APP_DATA.prompts.hashtags(APP_DATA.channels[fresh.channel].label, fresh.title || fresh.idea);
      saveOutput("hashtags-prompt", fresh.channel, fresh.title || fresh.idea, prompt);
      openPromptModal(prompt, "Hashtags IA", item.id, "hashtags");
    };

    document.getElementById("repurposePromptBtn").onclick = ()=>{
      saveItemForm(item.id, false);
      const fresh = getItem(item.id);
      const prompt = APP_DATA.prompts.repurpose(APP_DATA.channels[fresh.channel].label, fresh);
      saveOutput("repurpose-prompt", fresh.channel, fresh.title || fresh.idea, prompt);
      openPromptModal(prompt, "Reutilización IA", item.id, "notes");
    };

    document.getElementById("deleteItemBtn").onclick = ()=>{
      const ok = confirm("¿Eliminar esta pieza?");
      if(!ok) return;
      state.contentItems = state.contentItems.filter(x=>x.id!==item.id);
      saveState();
      closeModal();
      render();
    };
  }

  function saveItemForm(itemId, keepModal=true){
    const item = getItem(itemId);
    if(!item) return;

    item.status = document.getElementById("itemStatus").value;
    item.idea = document.getElementById("itemIdea").value.trim();
    item.title = document.getElementById("itemTitle").value.trim();
    item.tone = document.getElementById("itemTone").value.trim();
    item.duration = document.getElementById("itemDuration").value.trim();
    item.objective = document.getElementById("itemObjective").value.trim();
    item.scheduledAt = fromDateTimeLocal(document.getElementById("itemDate").value);
    item.script = document.getElementById("itemScript").value;
    item.titles = document.getElementById("itemTitles").value;
    item.visuals = document.getElementById("itemVisuals").value;
    item.description = document.getElementById("itemDescription").value;
    item.hashtags = document.getElementById("itemHashtags").value;
    item.notes = document.getElementById("itemNotes").value;

    document.querySelectorAll("[data-check]").forEach(ch=>{
      item.checklist[+ch.dataset.check].done = ch.checked;
    });

    item.updatedAt = new Date().toISOString();
    saveState();
    if(!keepModal){
      // mantener modal
    }
  }

  function getItem(id){
    return state.contentItems.find(x=>x.id===id);
  }

  function openPromptModal(prompt, title, itemId=null, targetField=null){
    const body = `
      <div class="row-wrap" style="margin-bottom:10px">
        <button class="btn btn-primary" id="copyPromptBtn">Copiar prompt</button>
        <button class="btn btn-success" id="runPromptBtn">Usar IA</button>
      </div>

      <div class="output-box">${escapeHtml(prompt)}</div>
      <div id="promptResultWrap" style="margin-top:14px"></div>
    `;
    openModal(title, body);

    document.getElementById("copyPromptBtn").onclick = async ()=>{
      await navigator.clipboard.writeText(prompt);
      alert("✅ Prompt copiado");
    };

    document.getElementById("runPromptBtn").onclick = async ()=>{
      if(state.aiConfig.mode==="manual"){
        await navigator.clipboard.writeText(prompt);
        alert("✅ Prompt copiado. Pégalo en Gemini manualmente.");
        return;
      }

      if(!state.aiConfig.proxyUrl){
        alert("⚠️ Configura el proxy IA.");
        return;
      }

      const wrap = document.getElementById("promptResultWrap");
      wrap.innerHTML = `<div class="output-box">⏳ Generando...</div>`;

      try{
        const result = await callAI(prompt);
        state.aiRuntime.output = result;
        saveState();

        wrap.innerHTML = `
          <div class="row-wrap" style="margin-bottom:10px">
            <button class="btn btn-primary" id="copyResultBtn">Copiar resultado</button>
            ${itemId && targetField ? `<button class="btn btn-success" id="replaceFieldBtn">Reemplazar en ${targetField}</button>` : ""}
            ${itemId && targetField ? `<button class="btn btn-ghost" id="appendFieldBtn">Anexar en ${targetField}</button>` : ""}
          </div>
          <div class="output-box">${escapeHtml(result)}</div>
        `;

        document.getElementById("copyResultBtn").onclick = async ()=>{
          await navigator.clipboard.writeText(result);
          alert("✅ Copiado");
        };

        const replaceBtn = document.getElementById("replaceFieldBtn");
        if(replaceBtn){
          replaceBtn.onclick = ()=>{
            saveAIResultIntoItem(itemId, targetField, result, "replace");
            alert(`✅ Guardado en ${targetField}`);
            closeModal();
            render();
            openItemModal(itemId);
          };
        }

        const appendBtn = document.getElementById("appendFieldBtn");
        if(appendBtn){
          appendBtn.onclick = ()=>{
            saveAIResultIntoItem(itemId, targetField, result, "append");
            alert(`✅ Anexado en ${targetField}`);
            closeModal();
            render();
            openItemModal(itemId);
          };
        }

        saveOutput("ai-response", itemId ? getItem(itemId)?.channel || "General" : "General", title, result);
      }catch(err){
        wrap.innerHTML = `<div class="output-box">❌ ${escapeHtml(err.message || err)}</div>`;
      }
    };
  }

  function saveAIResultIntoItem(itemId, field, result, mode="replace"){
    const item = getItem(itemId);
    if(!item) return;
    const allowed = ["script","titles","visuals","description","hashtags","notes"];
    if(!allowed.includes(field)) return;
    item[field] = mode==="replace"
      ? result
      : (item[field] ? `${item[field]}\n\n${result}` : result);
    item.updatedAt = new Date().toISOString();
    saveState();
  }

  async function callAI(prompt){
    if(!prompt || !prompt.trim()) throw new Error("Prompt vacío");

    const res = await fetch(state.aiConfig.proxyUrl, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        prompt,
        model: state.aiConfig.model || "gemini-1.5-flash"
      })
    });

    if(!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if(!data.ok && !data.text && !data.output){
      throw new Error(data.error || "Error IA");
    }

    return data.text || data.output || "";
  }

  function saveOutput(type, channel, title, content){
    state.generatedOutputs.push({
      id: uid("OUT"),
      type,
      channel,
      title,
      content,
      createdAt: new Date().toISOString()
    });
    saveState();
  }

  function openOutputModal(title, content){
    const body = `
      <div class="row-wrap" style="margin-bottom:10px">
        <button class="btn btn-primary" id="copyOutBtn">Copiar</button>
      </div>
      <div class="output-box">${escapeHtml(content)}</div>
    `;
    openModal(title, body);
    document.getElementById("copyOutBtn").onclick = async ()=>{
      await navigator.clipboard.writeText(content);
      alert("✅ Copiado");
    };
  }

  function renderItemCard(item){
    return `
      <div class="item">
        <div class="row-wrap">
          <span class="badge ${item.channel==='ERB'?'erb':'ism'}">${item.channel}</span>
          <span class="badge gray">${labelStatus(item.status)}</span>
        </div>
        <div class="item-title">${escapeHtml(item.title || item.idea || "Sin título")}</div>
        <div class="item-meta">${item.scheduledAt ? formatDateTime(item.scheduledAt) : "Sin fecha"} · ${item.format}</div>
        <div class="row-wrap" style="margin-top:8px">
          <button class="btn btn-ghost" data-open-item="${item.id}">Abrir</button>
        </div>
      </div>
    `;
  }

  function seedInitialData(){
    const initial = [
      { channel:"ERB", format:"long", idea:APP_DATA.erbIdeas[0], date:"2026-04-02T19:30:00" },
      { channel:"ISM", format:"short", idea:APP_DATA.ismIdeas[0], date:"2026-04-03T18:00:00" },
      { channel:"ISM", format:"short", idea:APP_DATA.ismIdeas[1], date:"2026-04-04T18:00:00" },
      { channel:"ERB", format:"short", idea:"Short derivado del ERB principal", date:"2026-04-04T20:00:00" },
      { channel:"ERB", format:"long", idea:APP_DATA.erbIdeas[1], date:"2026-04-07T19:30:00" },
      { channel:"ISM", format:"short", idea:APP_DATA.ismIdeas[2], date:"2026-04-08T18:00:00" },
      { channel:"ERB", format:"long", idea:APP_DATA.erbIdeas[2], date:"2026-04-09T19:30:00" },
      { channel:"ISM", format:"short", idea:APP_DATA.ismIdeas[3], date:"2026-04-10T18:00:00" }
    ];

    state.contentItems = initial.map(x=>{
      const item = createItem({
        channel:x.channel,
        format:x.format,
        idea:x.idea,
        scheduledAt:new Date(x.date).toISOString()
      });
      item.status = "scheduled";
      return item;
    });
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `yt-content-os-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJSON(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        alert("✅ Importado correctamente");
        location.reload();
      }catch{
        alert("❌ Archivo inválido");
      }
    };
    reader.readAsText(file);
  }

  function openModal(title, html){
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalBody").innerHTML = html;
    document.getElementById("modal").classList.remove("hidden");
  }

  function closeModal(){
    document.getElementById("modal").classList.add("hidden");
  }

  function labelStatus(status){
    const found = APP_DATA.statuses.find(s=>s.id===status);
    return found ? found.label : status;
  }

  function formatDateTime(iso){
    if(!iso) return "-";
    return new Date(iso).toLocaleString("es-ES", {
      day:"2-digit",
      month:"short",
      year:"numeric",
      hour:"2-digit",
      minute:"2-digit"
    });
  }

  function toYmd(date){
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  }

  function toDateTimeLocal(iso){
    if(!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    const hh = String(d.getHours()).padStart(2,"0");
    const mi = String(d.getMinutes()).padStart(2,"0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  function fromDateTimeLocal(val){
    if(!val) return "";
    return new Date(val).toISOString();
  }

  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
})();
