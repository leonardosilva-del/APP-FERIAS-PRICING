// alerta-global-pricing.js
// Monitoramento global de Vendas Pontuais e Timers Extrapolados em qualquer tela da Intranet

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

(function () {
    // Evita duplicar se carregado na tela de chamados (que já possui seu próprio loop nativo completo)
    const isTelaChamados = window.location.pathname.endsWith("chamados.html");
    if (isTelaChamados) return;

    let perfilUsuarioGlobal = null;
    let usuarioUidGlobal = null;
    let chamadosTimerNotificados = new Set();
    let audioCtxMonitor = null;

    // Injeta CSS dos toasts e animações globais caso a tela não possua
    const styleId = "style-alerta-global-pricing";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = `
            #toast-global-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                max-width: 420px;
                width: calc(100vw - 48px);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .toast-global {
                pointer-events: auto;
                padding: 16px 20px;
                border-radius: 12px;
                color: #ffffff;
                box-shadow: 0 12px 24px -4px rgba(0,0,0,0.25);
                animation: slideInGlobal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                font-size: 0.92rem;
                line-height: 1.45;
            }
            @keyframes slideInGlobal {
                from { transform: translateX(110%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .toast-global-urgente {
                background-color: #ef4444;
                border: 2px solid #ffffff;
                animation: slideInGlobal 0.35s forwards, pulsarForteGlobal 1.5s infinite !important;
            }
            @keyframes pulsarForteGlobal {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); box-shadow: 0 0 18px rgba(239, 68, 68, 0.9); }
                100% { transform: scale(1); }
            }
            .toast-global-timer {
                background-color: #ea580c;
                border: 2px solid #fed7aa;
                animation: slideInGlobal 0.35s forwards, pulsarTimerGlobal 1.6s infinite !important;
            }
            @keyframes pulsarTimerGlobal {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); box-shadow: 0 0 18px rgba(234, 88, 12, 0.9); }
                100% { transform: scale(1); }
            }
            .btn-ir-chamados {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #ffffff;
                color: #ea580c;
                font-weight: 800;
                border: none;
                border-radius: 8px;
                padding: 10px 14px;
                width: 100%;
                margin-top: 10px;
                text-decoration: none;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 0.85rem;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transition: transform 0.15s ease, background 0.15s ease;
            }
            .btn-ir-chamados:hover {
                transform: translateY(-1px);
                background: #fff7ed;
            }
            .btn-ir-analisar {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #ffffff;
                color: #ef4444;
                font-weight: 800;
                border: none;
                border-radius: 8px;
                padding: 10px 14px;
                width: 100%;
                margin-top: 10px;
                text-decoration: none;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 0.85rem;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transition: transform 0.15s ease, background 0.15s ease;
            }
            .btn-ir-analisar:hover {
                transform: translateY(-1px);
                background: #fef2f2;
            }
        `;
        document.head.appendChild(style);
    }

    function getContainer() {
        let container = document.getElementById("toast-global-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-global-container";
            document.body.appendChild(container);
        }
        return container;
    }

    async function getAudioContext() {
        try {
            if (!audioCtxMonitor) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) audioCtxMonitor = new AudioCtx();
            }
            if (audioCtxMonitor && audioCtxMonitor.state === "suspended") {
                await audioCtxMonitor.resume();
            }
        } catch (err) {
            console.warn("Aviso áudio global:", err);
        }
        return audioCtxMonitor;
    }

    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(evt => {
        window.addEventListener(evt, () => getAudioContext(), { passive: true });
    });

    // Sirene / Bip agudo para NOVA VENDA PONTUAL
    async function tocarAlarmeNovaVendaPontual() {
        try {
            const ctx = await getAudioContext();
            if (!ctx) return;
            if (ctx.state === "suspended") {
                await ctx.resume();
            }
            const agora = ctx.currentTime;
            [0, 0.22, 0.44, 0.70, 0.92, 1.14].forEach((t, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = i % 2 === 0 ? "sine" : "triangle";
                osc.frequency.setValueAtTime(i % 2 === 0 ? 980 : 1250, agora + t);
                gain.gain.setValueAtTime(0.45, agora + t);
                gain.gain.exponentialRampToValueAtTime(0.001, agora + t + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(agora + t);
                osc.stop(agora + t + 0.19);
            });
        } catch (e) {
            console.warn("Áudio nova venda pontual global:", e);
        }
    }

    // Alarme para TIMER EXTRAPOLADO (Preço a derrubar)
    async function tocarAlarmeTimerExtrapolado() {
        try {
            const ctx = await getAudioContext();
            if (!ctx) return;
            if (ctx.state === "suspended") {
                await ctx.resume();
            }
            const agora = ctx.currentTime;
            [0, 0.25, 0.50, 0.75].forEach((t, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(i % 2 === 0 ? 650 : 880, agora + t);
                gain.gain.setValueAtTime(0.35, agora + t);
                gain.gain.exponentialRampToValueAtTime(0.001, agora + t + 0.20);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(agora + t);
                osc.stop(agora + t + 0.21);
            });
        } catch (e) {
            console.warn("Áudio timer global:", e);
        }
    }

    function notificarDesktop(titulo, corpo) {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") {
            new Notification(titulo, { body: corpo, icon: "/favicon.png" });
        } else if (Notification.permission === "default") {
            Notification.requestPermission().then(perm => {
                if (perm === "granted") {
                    new Notification(titulo, { body: corpo, icon: "/favicon.png" });
                }
            });
        }
    }

    // Dispara toast e bip de NOVA VENDA PONTUAL (Aguardando Aprovação)
    function dispararAlertaNovaVendaPontual(chamado) {
        tocarAlarmeNovaVendaPontual();

        const container = getContainer();
        const idExistente = document.getElementById(`toast-global-nova-${chamado.id}`);
        if (idExistente) return;

        const toast = document.createElement("div");
        toast.id = `toast-global-nova-${chamado.id}`;
        toast.className = "toast-global toast-global-urgente";
        toast.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <strong style="font-size: 1.05rem; display: block; margin-bottom: 6px;">🚨 NOVA VENDA PONTUAL NA LOJA!</strong>
                <button onclick="this.closest('.toast-global').remove()" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 1.3rem; font-weight: bold; line-height: 1;">×</button>
            </div>
            <div style="font-size: 0.88rem; line-height: 1.45; margin-bottom: 8px;">
                <strong>Comprador:</strong> ${chamado.solicitante || 'Comercial'}<br>
                <strong>Loja:</strong> ${chamado.lojas || '-'}<br>
                <strong>Produto:</strong> ${chamado.produtoCod || ''} - ${chamado.produtoDesc || ''}
            </div>
            <a href="/chamados.html" class="btn-ir-analisar">ANALISAR AGORA</a>
        `;
        container.appendChild(toast);

        notificarDesktop("🚨 Nova Venda Pontual Solicitada!", `Comprador: ${chamado.solicitante || 'Comercial'} | Loja: ${chamado.lojas || '-'}\n${chamado.produtoDesc || chamado.produtoCod || ''}`);
    }

    // Dispara toast e bip de TIMER ESGOTADO (Derrubar Preço)
    function dispararAlertaTimer(chamado) {
        tocarAlarmeTimerExtrapolado();

        const container = getContainer();
        const idExistente = document.getElementById(`toast-global-timer-${chamado.id}`);
        if (idExistente) return;

        const toast = document.createElement("div");
        toast.id = `toast-global-timer-${chamado.id}`;
        toast.className = "toast-global toast-global-timer";
        toast.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <strong style="font-size: 1.05rem; display: block; margin-bottom: 6px;">⏱️ TEMPO ESGOTADO - DERRUBAR PREÇO!</strong>
                <button onclick="this.closest('.toast-global').remove()" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 1.3rem; font-weight: bold; line-height: 1;">×</button>
            </div>
            <div style="font-size: 0.88rem; line-height: 1.45; margin-bottom: 8px;">
                <strong>Produto:</strong> ${chamado.produtoCod || ''} - ${chamado.produtoDesc || ''}<br>
                <strong>Loja:</strong> ${chamado.lojas || '-'}<br>
                <strong>Aprovado por:</strong> ${chamado.aprovadoPor || 'Pricing/Gestor'}
            </div>
            <a href="/chamados.html" class="btn-ir-chamados">IR PARA CHAMADOS E DERRUBAR</a>
        `;
        container.appendChild(toast);

        notificarDesktop("⏱️ TEMPO ESGOTADO - Venda Pontual!", `Produto: ${chamado.produtoCod} - ${chamado.produtoDesc}\nDerrubar preço imediatamente no sistema!`);
    }

    function isVendaPontual(tipo) {
        if (!tipo) return false;
        const t = String(tipo).toLowerCase();
        return t.includes("3") || t.includes("pontual");
    }

    let chamadosNovosNotificados = new Set();
    let primeiraCargaFeita = false;

    function verificarChamados(chamadosObj) {
        if (!chamadosObj || !perfilUsuarioGlobal) return;
        const perfilNorm = perfilUsuarioGlobal.trim().toLowerCase();
        const ehGestorOuPricing = perfilNorm === "gestor" || perfilNorm === "pricing";
        const agora = Date.now();

        Object.keys(chamadosObj).forEach(id => {
            const c = { id, ...chamadosObj[id] };
            const ehPontual = isVendaPontual(c.tipo);

            // 1. CHECA SE CHEGOU NOVA VENDA PONTUAL (Aguardando Aprovação) -> Para Gestor e Pricing
            if (ehGestorOuPricing && ehPontual && c.status === "Aberto") {
                if (primeiraCargaFeita) {
                    if (!chamadosNovosNotificados.has(c.id)) {
                        chamadosNovosNotificados.add(c.id);
                        dispararAlertaNovaVendaPontual(c);
                    }
                } else {
                    // Na primeira carga, apenas marca para não bipar em massa de chamados antigos
                    chamadosNovosNotificados.add(c.id);
                }
            }

            // 2. CHECA SE O TIMER FOI EXTRAPOLADO -> Para Gestor/Pricing e para quem aprovou
            const estaExpirado = c.status === "Aprovado" && c.timerExpiraEm && !c.timerResolvido && agora > c.timerExpiraEm;
            if (ehPontual && estaExpirado) {
                const ehQuemAprovou = c.aprovadoPorUid === usuarioUidGlobal;
                if (ehGestorOuPricing || ehQuemAprovou) {
                    if (!chamadosTimerNotificados.has(c.id)) {
                        chamadosTimerNotificados.add(c.id);
                        dispararAlertaTimer(c);
                    }
                }
            }
        });

        if (!primeiraCargaFeita) {
            primeiraCargaFeita = true;
        }
    }

    let cacheChamados = null;

    onAuthStateChanged(auth, (user) => {
        if (!user) return;
        usuarioUidGlobal = user.uid;

        get(ref(db, "usuarios/" + user.uid)).then((snapshot) => {
            const dados = snapshot.exists() ? snapshot.val() : {};
            perfilUsuarioGlobal = dados.perfil || "Colaborador";

            // Se for gestor, pricing ou colaborador que tenha acessado, ouve os chamados
            onValue(ref(db, "chamados_comercial"), (snap) => {
                cacheChamados = snap.exists() ? snap.val() : {};
                verificarChamados(cacheChamados);
            });

            // Timer de checagem periódica a cada 10 segundos caso o timer expire com a tela aberta
            setInterval(() => {
                if (cacheChamados) {
                    verificarChamados(cacheChamados);
                }
            }, 10000);
        });
    });
})();

