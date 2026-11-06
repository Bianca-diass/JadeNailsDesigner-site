/* =====================================================
   JADE NAILS DESIGNER – JavaScript
   Cada bloco é independente: se der problema em um,
   os outros continuam funcionando.
   ===================================================== */

// Troque pelo número real (código do país + DDD + número, só dígitos)
const WHATSAPP = '5567999999999';

document.addEventListener('DOMContentLoaded', () => {
  menuMobile();
  menuAtivoEMenuSombra();
  revelarAoRolar();
  galeriaToque();
  statusHorarios();
  formularioAgendamento();
  botaoTopo();
});

/* 1. MENU MOBILE ---------------------------------- */
function menuMobile() {
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('menuLinks');
  if (!toggle || !links) return;

  const fechar = () => {
    links.classList.remove('aberto');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    const aberto = links.classList.toggle('aberto');
    toggle.setAttribute('aria-expanded', aberto);
  });

  // fecha ao clicar num link, fora do menu ou apertar ESC
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', fechar));
  document.addEventListener('click', e => {
    if (!e.target.closest('.menu')) fechar();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fechar();
  });
}

/* 2. LINK ATIVO NO MENU + SOMBRA AO ROLAR --------- */
function menuAtivoEMenuSombra() {
  const menu = document.querySelector('.menu');
  const linksMenu = document.querySelectorAll('#menuLinks a:not(.menu-btn)');

  // sombra do menu só aparece depois de rolar um pouco
  const aoRolar = () => menu && menu.classList.toggle('rolou', window.scrollY > 20);
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  if (!('IntersectionObserver' in window)) return;

  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      linksMenu.forEach(a =>
        a.classList.toggle('ativo', a.getAttribute('href') === '#' + e.target.id)
      );
    });
  }, { rootMargin: '-45% 0px -50% 0px' }); // seção que está no meio da tela

  linksMenu.forEach(a => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) observador.observe(sec);
  });
}

/* 3. ANIMAÇÃO: ELEMENTOS APARECEM AO ROLAR -------- */
function revelarAoRolar() {
  const itens = document.querySelectorAll(
    '.titulo, .sobre, .card, .preco-linha, .curso, .cuidado, .local, .horario-card, .form-agenda'
  );
  if (!('IntersectionObserver' in window)) return;

  itens.forEach((el, i) => {
    el.classList.add('revelar');
    // pequeno atraso em cascata para irmãos (cards, linhas...)
    el.style.transitionDelay = (i % 3) * 0.08 + 's';
  });

  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visivel');
        o.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  itens.forEach(el => obs.observe(el));
}

/* 4. GALERIA: TOQUE VIRA A CARTA NO CELULAR ------- */
function galeriaToque() {
  const cartas = document.querySelectorAll('.carta');
  cartas.forEach(carta => {
    carta.addEventListener('click', () => carta.classList.toggle('vira'));
  });
}

/* 5. STATUS ABERTO / FECHADO EM TEMPO REAL -------- */
// 0 = domingo ... 6 = sábado. Horas em formato 24h.
const FUNCIONAMENTO = {
  0: null,
  1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19],
  6: [9, 16]
};

// Hora atual no fuso da Jade (Mato Grosso do Sul), mesmo que o visitante esteja em outro lugar
function agoraNaJade() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Campo_Grande',
    weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
  }).formatToParts(new Date());
  const get = t => partes.find(p => p.type === t).value;
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    dia: dias.indexOf(get('weekday')),
    hora: Number(get('hour')) % 24 + Number(get('minute')) / 60
  };
}

function statusHorarios() {
  const cards = document.querySelectorAll('.horario-card');
  if (!cards.length) return;

  // cada card diz a que dias pertence (data-dias no HTML)
  const atualizar = () => {
    const { dia, hora } = agoraNaJade();
    const expediente = FUNCIONAMENTO[dia];
    const aberto = !!expediente && hora >= expediente[0] && hora < expediente[1];

    cards.forEach(card => {
      const dias = card.dataset.dias.split(',').map(Number);
      const hoje = dias.includes(dia);
      const badge = card.querySelector('.status');

      card.classList.toggle('hoje', hoje);

      if (dias.includes(0) && dias.length === 1) return; // domingo: sempre fechado

      if (hoje) {
        badge.textContent = aberto ? 'Aberto agora' : 'Fechado agora';
        badge.className = 'status ' + (aberto ? 'aberto' : 'fechado');
      } else {
        badge.textContent = 'Aberto';
        badge.className = 'status aberto';
      }
    });
  };

  atualizar();
  setInterval(atualizar, 60 * 1000); // confere a cada minuto
}

/* 6. FORMULÁRIO DE AGENDAMENTO → WHATSAPP --------- */
function formularioAgendamento() {
  const form = document.getElementById('formAgenda');
  if (!form) return;

  const campoData = document.getElementById('agData');
  const campoHora = document.getElementById('agHora');
  const erro = document.getElementById('agErro');

  // não deixa escolher datas passadas
  const hoje = new Date();
  campoData.min = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0')
  ].join('-');

  // monta os horários disponíveis conforme o dia da semana escolhido
  campoData.addEventListener('change', () => {
    erro.textContent = '';
    campoHora.innerHTML = '';
    if (!campoData.value) return;

    // "T12:00" evita bug de fuso que mudaria o dia
    const dia = new Date(campoData.value + 'T12:00').getDay();
    const expediente = FUNCIONAMENTO[dia];

    if (!expediente) {
      erro.textContent = 'Aos domingos não há atendimento. Escolha outro dia 💕';
      campoHora.innerHTML = '<option value="">Escolha outro dia</option>';
      return;
    }

    campoHora.innerHTML = '<option value="">Escolha o horário</option>';
    for (let h = expediente[0]; h < expediente[1]; h++) {
      const txt = String(h).padStart(2, '0') + ':00';
      campoHora.insertAdjacentHTML('beforeend', `<option value="${txt}">${txt}</option>`);
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    erro.textContent = '';

    const nome = form.nome.value.trim();
    const servico = form.servico.value;
    const data = campoData.value;
    const hora = campoHora.value;
    const obs = form.obs.value.trim();

    if (!nome || !servico || !data || !hora) {
      erro.textContent = 'Preencha nome, serviço, data e horário.';
      return;
    }

    const dataBR = data.split('-').reverse().join('/');
    let msg = `Olá, Jade! Meu nome é ${nome}.\n` +
              `Gostaria de agendar: ${servico}\n` +
              `Dia: ${dataBR}\n` +
              `Horário: ${hora}`;
    if (obs) msg += `\nObservação: ${obs}`;

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
}

/* 7. BOTÃO VOLTAR AO TOPO -- */
function botaoTopo() {
  const btn = document.getElementById('btnTopo');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('mostrar', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}