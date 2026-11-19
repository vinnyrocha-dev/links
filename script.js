// =========================================================
// Links · Vinicius Rocha
// =========================================================

// Se a pessoa desativou animações no sistema, a gente respeita
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Só liga os efeitos de mouse em quem tem mouse (no celular não faz sentido)
const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const raiz = document.documentElement;


// 1) Efeito de digitação -----------------------------------
const frases = ['aberto a estágio', 'rio de janeiro, rj', 'sempre aprendendo'];
const alvo = document.getElementById('texto-digitado');

if (alvo && !reduzirMovimento) {
  let indice = 0;                    // qual frase está na tela
  let letras = frases[0].length;     // quantas letras estão visíveis
  let apagando = true;

  function digitar() {
    if (apagando) {
      letras--;
      if (letras === 0) {
        apagando = false;
        indice = (indice + 1) % frases.length;  // próxima frase (volta pro início no fim)
      }
    } else {
      letras++;
      if (letras === frases[indice].length) {
        apagando = true;
        alvo.textContent = frases[indice].slice(0, letras);
        return setTimeout(digitar, 1800);       // pausa com a frase completa
      }
    }
    alvo.textContent = frases[indice].slice(0, letras);
    setTimeout(digitar, apagando ? 35 : 85);
  }

  setTimeout(digitar, 2200);
}


// 2) Luz que segue o mouse dentro de cada botão -------------
if (temMouse) {
  document.querySelectorAll('.link').forEach((botao) => {
    botao.addEventListener('pointermove', (e) => {
      const caixa = botao.getBoundingClientRect();
      botao.style.setProperty('--x', `${e.clientX - caixa.left}px`);
      botao.style.setProperty('--y', `${e.clientY - caixa.top}px`);
    });
  });
}


// 3) Ícones sociais com efeito ímã --------------------------
if (temMouse && !reduzirMovimento) {
  document.querySelectorAll('.social').forEach((icone) => {
    icone.addEventListener('pointermove', (e) => {
      const caixa = icone.getBoundingClientRect();
      const dx = e.clientX - (caixa.left + caixa.width / 2);
      const dy = e.clientY - (caixa.top + caixa.height / 2);
      icone.style.transform = `translate(${dx * 0.35}px, ${dy * 0.35}px)`;
    });
    icone.addEventListener('pointerleave', () => {
      icone.style.transform = '';
    });
  });
}


// 4) Fundos animados ----------------------------------------
// Os fundos em CSS (aurora, mesh, blobs, raios, ondas, perspectiva) não precisam de JS.
// Aqui ficam só os que precisam: pontos (segue o cursor) e os desenhados no <canvas>.

const tela = document.querySelector('.fundo-canvas');
const ctx = tela.getContext('2d');
const mouse = { x: -9999, y: -9999 };
let largura = 0;
let altura = 0;
let quadro = null;   // id do requestAnimationFrame atual
let efeitoAtual = null;

window.addEventListener('pointermove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  raiz.style.setProperty('--mx', `${e.clientX}px`);
  raiz.style.setProperty('--my', `${e.clientY}px`);
});

function ajustarTamanho() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);   // tela retina, mas no máx 2x
  largura = window.innerWidth;
  altura = window.innerHeight;
  tela.width = largura * dpr;
  tela.height = altura * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const efeitos = {

  // Pontos: no celular (sem mouse) a luz passeia sozinha
  pontos: {
    iniciar() {},
    desenhar(t) {
      if (temMouse) return;
      raiz.style.setProperty('--mx', `${largura / 2 + Math.sin(t / 2200) * largura * 0.35}px`);
      raiz.style.setProperty('--my', `${altura * 0.3 + Math.cos(t / 3100) * altura * 0.2}px`);
    },
  },

  // Constelação: pontos andando e se ligando por linhas quando ficam perto
  constelacao: {
    pontos: [],
    iniciar() {
      const quantidade = Math.max(50, Math.min(100, Math.round((largura * altura) / 9000)));
      this.pontos = Array.from({ length: quantidade }, () => ({
        x: Math.random() * largura,
        y: Math.random() * altura,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
    },
    desenhar() {
      ctx.clearRect(0, 0, largura, altura);
      const lista = this.pontos;

      for (const p of lista) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > largura) p.vx *= -1;   // bate na borda e volta
        if (p.y < 0 || p.y > altura) p.vy *= -1;
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < lista.length; i++) {
        for (let j = i + 1; j < lista.length; j++) {
          const d = Math.hypot(lista[i].x - lista[j].x, lista[i].y - lista[j].y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(77, 141, 255, ${(1 - d / 130) * 0.45})`;
            ctx.beginPath();
            ctx.moveTo(lista[i].x, lista[i].y);
            ctx.lineTo(lista[j].x, lista[j].y);
            ctx.stroke();
          }
        }
        // linha até o cursor
        const dm = Math.hypot(lista[i].x - mouse.x, lista[i].y - mouse.y);
        if (dm < 170) {
          ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - dm / 170) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(lista[i].x, lista[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = 'rgba(77, 141, 255, 0.85)';
      for (const p of lista) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },

  // Chuva de código: letras de código Java caindo (estilo Matrix, bem discreto)
  codigo: {
    letras: 'publicstaticvoidmain(String[]args){}return;newclass@Override=>'.split(''),
    tamanho: 16,
    gotas: [],
    ultimo: 0,
    iniciar() {
      const colunas = Math.ceil(largura / this.tamanho);
      this.gotas = Array.from({ length: colunas }, () => Math.floor(Math.random() * -40));
      ctx.clearRect(0, 0, largura, altura);
    },
    desenhar(t) {
      if (t - this.ultimo < 70) return;       // cai devagar: 1 passo a cada 70ms
      this.ultimo = t;
      ctx.fillStyle = 'rgba(10, 11, 16, 0.14)'; // apaga um pouco => deixa rastro
      ctx.fillRect(0, 0, largura, altura);
      ctx.font = `${this.tamanho - 2}px 'JetBrains Mono', monospace`;
      this.gotas.forEach((linha, i) => {
        const letra = this.letras[Math.floor(Math.random() * this.letras.length)];
        ctx.fillStyle = Math.random() < 0.05 ? '#EDF1F7' : '#4D8DFF';
        ctx.fillText(letra, i * this.tamanho, linha * this.tamanho);
        if (linha * this.tamanho > altura && Math.random() > 0.975) this.gotas[i] = 0;
        this.gotas[i]++;
      });
    },
  },
};

function loop(t) {
  efeitoAtual.desenhar(t);
  quadro = requestAnimationFrame(loop);
}

function trocarFundo(nome) {
  document.body.dataset.fundo = nome;
  cancelAnimationFrame(quadro);
  efeitoAtual = efeitos[nome] || null;
  if (!efeitoAtual) return;              // fundo só de CSS

  ajustarTamanho();
  efeitoAtual.iniciar();
  if (reduzirMovimento) {
    // sem animação: desenha alguns quadros e para
    for (let i = 0; i < 60; i++) efeitoAtual.desenhar(i * 100);
  } else {
    quadro = requestAnimationFrame(loop);
  }
}

window.addEventListener('resize', () => {
  if (efeitoAtual) {
    ajustarTamanho();
    efeitoAtual.iniciar();
  }
});

window.trocarFundo = trocarFundo;
trocarFundo(document.body.dataset.fundo || 'aurora');


// 5) Ano do rodapé sempre atualizado ------------------------
document.getElementById('ano').textContent = new Date().getFullYear();
