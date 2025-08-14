
import supabase from './supabase.js';

const chat = document.getElementById('chat');
const input = document.getElementById('userInput');
const horaSelect = document.getElementById('horaSelect');

let step = 0;
let agendamento = {};

// Gera horários de 30 em 30 minutos
function gerarHorarios() {
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const option = document.createElement('option');
      option.value = hora;
      option.textContent = hora;
      horaSelect.appendChild(option);
    }
  }
}
gerarHorarios();

function obterDataFormatada(diasAdicionais = 0) {
  const data = new Date();
  data.setDate(data.getDate() + diasAdicionais);

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

const perguntas = [
  "🙏 Olá! Vamos agendar sua oração. Qual é o seu nome?",
  "⏰ Qual o horário para sua oração? (formato: HH:MM)",
  "📝 Alguma observação adicional?"
];

function atualizarEtapaInfo() {
  let etapaInfo = document.getElementById('etapaInfo');
  if (!etapaInfo) {
    etapaInfo = document.createElement('div');
    etapaInfo.id = 'etapaInfo';
    etapaInfo.className = 'text-center text-muted mb-2';
    etapaInfo.style.fontSize = '14px';
    chat.parentNode.insertBefore(etapaInfo, chat.nextSibling);
  }
  etapaInfo.textContent = `Etapa ${step + 1} de ${perguntas.length}`;
}

function addMessage(text, sender = 'bot', etapaRespondida = null) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;

  if (sender === 'bot') {
    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = 'assets/Avatar.png';
    msg.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'text';

  if (sender === 'bot') {
    // Não insere texto diretamente — apenas chama simulateTyping
    simulateTyping(bubble, text);
  } else {
    // Insere texto do usuário com botão de edição
    bubble.innerHTML = `<span>${text}</span>`;

    if (etapaRespondida >= 0 && etapaRespondida <= 2) {
      const editIcon = document.createElement('i');
      editIcon.className = 'bi bi-pencil-square';
      editIcon.style.cursor = 'pointer';
      editIcon.style.marginLeft = '10px';
      editIcon.style.fontSize = '18px';
      editIcon.style.color = '#fff';
      editIcon.title = "Editar resposta";

      editIcon.setAttribute('data-etapa', etapaRespondida); // Adiciona atributo para controle

      editIcon.addEventListener('click', async () => {
        step = etapaRespondida;
        removerMensagensPosteriores(etapaRespondida);
        msg.remove();
        atualizarEtapaInfo();

        if (step === 1) {
          // Reexibe o dropdown de horários
          const mensagemData = await definirDataAgendamento();
          await gerarHorariosDisponiveis(agendamento.data);

          horaSelect.style.display = 'block';
          input.style.display = 'none';

          addMessage(mensagemData);
          setTimeout(() => {
            addMessage(perguntas[step]);
            atualizarEtapaInfo();
          }, 1000);
        } else {
          input.value = text;
          horaSelect.style.display = 'none';
          input.style.display = 'block';
        }
      });

      bubble.appendChild(editIcon);
    }
  }

  msg.appendChild(bubble);
  chat.appendChild(msg);
  scrollToBottom();
}

function simulateTyping(element, text) {
  element.textContent = ''; // Limpa antes de digitar
  let index = 0;
  const interval = setInterval(() => {
    element.textContent += text[index];
    index++;
    if (index === text.length) {
      clearInterval(interval);
    }
  }, 20);
}

function removerMensagensPosteriores(etapaLimite) {
  const mensagens = Array.from(chat.children);
  mensagens.forEach(msg => {
    const span = msg.querySelector('.text span');
    const icone = msg.querySelector('.bi-pencil-square');

    // Verifica se é uma mensagem do usuário com botão de edição
    if (icone) {
      const etapaMsg = parseInt(icone.getAttribute('data-etapa'));
      if (etapaMsg > etapaLimite) {
        msg.remove();
      }
    } else {
      // Mensagem do bot — remove se vier depois da etapa limite
      const index = mensagens.indexOf(msg);
      const etapaBot = index - 1; // Assume que bot vem logo após usuário
      if (etapaBot > etapaLimite) {
        msg.remove();
      }
    }
  });
}

async function buscarHorariosOcupados(data) {
  const { data: resultados, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('data', data);

  if (error) {
    console.error('Erro ao buscar horários:', error);
    return [];
  }

  return resultados || [];
}

async function definirDataAgendamento() {
  const hoje = obterDataFormatada(0);
  const amanha = obterDataFormatada(1);

  const ocupadosHoje = await buscarHorariosOcupados(hoje);
  const totalHorarios = 48;

  if (ocupadosHoje.length < totalHorarios) {
    agendamento.data = hoje;
    return `📅 Agendamento será para hoje: ${hoje}`;
  } else {
    agendamento.data = amanha;
    return `📅 Todos os horários de hoje estão ocupados. Agendamento será para amanhã: ${amanha}`;
  }
}

async function gerarHorariosDisponiveis(data) {
  const ocupados = await buscarHorariosOcupados(data);
  const horariosAgendados = ocupados.map(item => item.horario.slice(0, 5));

  horaSelect.innerHTML = '';

  const agora = new Date();
  const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Se for hoje, pula horários passados
      if (data === obterDataFormatada(0) && hora < horaAtual) continue;

      if (!horariosAgendados.includes(hora)) {
        const option = document.createElement('option');
        option.value = hora;
        option.textContent = hora;
        horaSelect.appendChild(option);
      }
    }
  }

  // Se nenhum horário estiver disponível
  if (horaSelect.options.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '⚠️ Nenhum horário disponível';
    horaSelect.appendChild(option);
  }
}


async function handleInput() {
  let value;

  // Captura o valor dependendo da etapa
  if (step === 1) {
    value = horaSelect.value;
    if (!value) return;
  } else {
    value = input.value.trim();
    if (!value) return;
    input.value = '';
  }

  // Adiciona a mensagem do usuário
  addMessage(value, 'user', step);

  // Salva a resposta no objeto
  switch (step) {
    case 0:
      agendamento.nome_solicitante = value;
      break;

    case 1:
      agendamento.horario = value.slice(0, 5);
      break;

    case 2:
      agendamento.observacoes = value;
      break;
  }

  step++;

  // Etapa 2: definir data e gerar horários disponíveis
  if (step === 1) {
    const mensagemData = await definirDataAgendamento(); // define data e retorna mensagem
    await gerarHorariosDisponiveis(agendamento.data);    // gera horários livres

    horaSelect.style.display = 'block';
    input.style.display = 'none';

    // ✅ Exibe mensagem da data
    addMessage(mensagemData);

    // ✅ Aguarda antes de perguntar o horário
    setTimeout(() => {
      addMessage(perguntas[step]); // pergunta do horário
      atualizarEtapaInfo();
    }, 1000); // tempo suficiente para digitar a mensagem anterior

    return;
  } else {
    horaSelect.style.display = 'none';
    input.style.display = 'block';
  }

  // Exibe próxima pergunta ou envia agendamento
  if (step < perguntas.length && step !== 1) {
    setTimeout(() => {
      addMessage(perguntas[step]);
      atualizarEtapaInfo();
    }, 500);
  } else if (step >= perguntas.length) {
    setTimeout(() => {
    addMessage("📤 Enviando agendamento...");
    enviarAgendamento();
    }, 500);
  }
}

async function enviarAgendamento() {
  const { error } = await supabase
    .from('agendamentos')
    .insert([agendamento]);

  if (error) {
    addMessage(`❌ Erro ao agendar: ${error.message}`, 'bot');
  } else {
    finalizarAgendamento();
  }
}

function finalizarAgendamento() {
  input.style.display = 'none';
  document.querySelector('#input-container button').style.display = 'none';

  addMessage(`✅ Seu agendamento foi realizado com sucesso! 📅 Data: ${agendamento.data} ⏰ Horário: ${agendamento.horario}.`);
  
  setTimeout(() => {
    addMessage(`✨ Que sua oração seja um momento maravilhoso com Deus.`);
  }, 1500);
}

window.handleInput = handleInput;

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleInput();
  }
});

function scrollToBottom() {
  chat.scrollTop = chat.scrollHeight;
}

input.addEventListener('focus', () => {
  setTimeout(() => {
    chat.scrollTop = chat.scrollHeight;
  }, 300);
});

addMessage(perguntas[step]);
atualizarEtapaInfo();