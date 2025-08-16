
import supabase from './supabase.js';

const chat = document.getElementById('chat');
const input = document.getElementById('userInput');
const horaSelect = document.getElementById('horaSelect');
const sendButton = document.getElementById('sendButton');

let step = 0;
let agendamento = {};

// Gera horários de 30 em 30 minutos
function gerarHorarios() {
  horaSelect.innerHTML = '';
  
  // Adiciona opção padrão
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Selecione um Horário...';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  horaSelect.appendChild(defaultOption);
  
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      // Não filtra mais por horário atual - mostra todos os horários
      const option = document.createElement('option');
      option.value = hora;
      option.textContent = hora;
      horaSelect.appendChild(option);
    }
  }
}
// Inicializa os horários quando a página carrega
gerarHorarios();

// Função removida pois não usaremos mais o campo data

const perguntas = [
  "🙏 Olá! Vamos agendar sua oração. Qual é o seu nome?",
  "⏰ Qual o horário para sua oração? (formato: HH:MM)"
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
          // Exibe mensagem de carregamento
          addMessage("⏳ Verificando horários disponíveis...");
          
          // Gera todos os horários
          gerarHorarios();
          
          // Busca horários ocupados
          const horariosCompletamenteOcupados = await buscarHorariosOcupados();
          
          // Remove horários completamente ocupados do dropdown
          Array.from(horaSelect.options).forEach(option => {
            if (horariosCompletamenteOcupados.includes(option.value)) {
              option.disabled = true;
              option.textContent = `${option.value} (Ocupado)`;
            }
          });
          
          // Adiciona listener para controlar o botão de envio
          horaSelect.addEventListener('change', function() {
            const selectedOption = horaSelect.options[horaSelect.selectedIndex];
            if (selectedOption && selectedOption.disabled) {
              // Horário ocupado selecionado - bloquear botão
              sendButton.disabled = true;
              sendButton.classList.remove('btn-success');
              sendButton.classList.add('btn-secondary');
            } else if (horaSelect.value) {
              // Horário válido selecionado - liberar botão
              sendButton.disabled = false;
              sendButton.classList.remove('btn-secondary');
              sendButton.classList.add('btn-success');
            } else {
              // Nenhum horário selecionado - bloquear botão
              sendButton.disabled = true;
              sendButton.classList.remove('btn-success');
              sendButton.classList.add('btn-secondary');
            }
          });
          
          // Inicialmente bloquear o botão até que um horário válido seja selecionado
          sendButton.disabled = true;
          sendButton.classList.remove('btn-success');
          sendButton.classList.add('btn-secondary');
          
          // Reexibe o dropdown de horários
          horaSelect.style.display = 'block';
          input.style.display = 'none';
          setTimeout(() => {
            addMessage(perguntas[step]);
            atualizarEtapaInfo();
          }, 1000);
        } else {
          input.value = text;
          horaSelect.style.display = 'none';
          input.style.display = 'block';
          // Reabilitar o botão para outras etapas
          sendButton.disabled = false;
          sendButton.classList.remove('btn-secondary');
          sendButton.classList.add('btn-success');
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

// Número máximo de pessoas por horário
const MAX_NOMES_POR_HORARIO = 3; // Podemos ajustar conforme necessário (nome1, nome2, nome3)

async function buscarHorariosOcupados() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('horario, nome1, nome2, nome3');

  if (error) {
    console.error('Erro ao buscar horários ocupados:', error);
    return [];
  }

  // Contar quantos agendamentos existem para cada coluna
  const contadores = {
    nome1: 0,
    nome2: 0,
    nome3: 0
  };
  
  data.forEach(agendamento => {
    if (agendamento.nome1 && agendamento.nome1.trim() !== '') contadores.nome1++;
    if (agendamento.nome2 && agendamento.nome2.trim() !== '') contadores.nome2++;
    if (agendamento.nome3 && agendamento.nome3.trim() !== '') contadores.nome3++;
  });
  
  console.log('Contadores:', contadores);
  
  const horariosOcupados = [];
  
  // Lógica de liberação progressiva:
  // 1. Se nome1 não está completo (< 48), só permite agendamentos em horários que já têm nome1 vazio
  // 2. Se nome1 está completo mas nome2 não (< 48), só permite agendamentos em horários que já têm nome2 vazio
  // 3. Se nome1 e nome2 estão completos mas nome3 não (< 48), só permite agendamentos em horários que já têm nome3 vazio
  
  data.forEach(agendamento => {
    let horarioOcupado = false;
    
    if (contadores.nome1 < 48) {
      // Fase 1: Preenchendo nome1 - bloquear horários que já têm nome1
      if (agendamento.nome1 && agendamento.nome1.trim() !== '') {
        horarioOcupado = true;
      }
    } else if (contadores.nome2 < 48) {
      // Fase 2: Preenchendo nome2 - bloquear horários que já têm nome2 ou não têm nome1
      if (!agendamento.nome1 || agendamento.nome1.trim() === '' || 
          (agendamento.nome2 && agendamento.nome2.trim() !== '')) {
        horarioOcupado = true;
      }
    } else if (contadores.nome3 < 48) {
      // Fase 3: Preenchendo nome3 - bloquear horários que já têm nome3 ou não têm nome1 e nome2
      if (!agendamento.nome1 || agendamento.nome1.trim() === '' ||
          !agendamento.nome2 || agendamento.nome2.trim() === '' ||
          (agendamento.nome3 && agendamento.nome3.trim() !== '')) {
        horarioOcupado = true;
      }
    } else {
      // Todas as fases completas - todos os horários estão ocupados
      horarioOcupado = true;
    }
    
    if (horarioOcupado) {
      horariosOcupados.push(agendamento.horario);
    }
  });
  
  // Adicionar horários que não existem no banco ainda
  const horariosExistentes = data.map(a => a.horario);
  const todosHorarios = [
    '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00', '00:30',
    '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30'
  ];
  
  // Se estamos na fase 2 ou 3, horários que não existem no banco devem ser bloqueados
  if (contadores.nome1 >= 48) {
    todosHorarios.forEach(horario => {
      if (!horariosExistentes.includes(horario)) {
        horariosOcupados.push(horario);
      }
    });
  }
  
  return horariosOcupados;
}


async function handleInput() {
  let value;

  // Captura o valor dependendo da etapa
  if (step === 1) {
    value = horaSelect.value;
    if (!value) return;
    
    // Verifica se o horário selecionado está ocupado
    const selectedOption = horaSelect.options[horaSelect.selectedIndex];
    if (selectedOption && selectedOption.disabled) {
      // Não permite enviar horário ocupado
      return;
    }
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
      agendamento.nome1 = value;
      break;

    case 1:
      agendamento.horario = value.slice(0, 5);
      break;
  }

  step++;

  // Após o nome, mostrar seleção de horário
  if (step === 1) {
    // Exibe mensagem de carregamento
    addMessage("⏳ Verificando horários disponíveis...");
    
    // Gera todos os horários
    gerarHorarios();
    
    // Busca horários ocupados
    const horariosCompletamenteOcupados = await buscarHorariosOcupados();
    
    // Remove horários completamente ocupados do dropdown
    Array.from(horaSelect.options).forEach(option => {
      if (horariosCompletamenteOcupados.includes(option.value)) {
        option.disabled = true;
        option.textContent = `${option.value} (Ocupado)`;
      }
    });
    
    // Adiciona listener para controlar o botão de envio
    horaSelect.addEventListener('change', function() {
      const selectedOption = horaSelect.options[horaSelect.selectedIndex];
      if (selectedOption && selectedOption.disabled) {
        // Horário ocupado selecionado - bloquear botão
        sendButton.disabled = true;
        sendButton.classList.remove('btn-success');
        sendButton.classList.add('btn-secondary');
      } else if (horaSelect.value) {
        // Horário válido selecionado - liberar botão
        sendButton.disabled = false;
        sendButton.classList.remove('btn-secondary');
        sendButton.classList.add('btn-success');
      } else {
        // Nenhum horário selecionado - bloquear botão
        sendButton.disabled = true;
        sendButton.classList.remove('btn-success');
        sendButton.classList.add('btn-secondary');
      }
    });
    
    // Inicialmente bloquear o botão até que um horário válido seja selecionado
    sendButton.disabled = true;
    sendButton.classList.remove('btn-success');
    sendButton.classList.add('btn-secondary');
    
    // Exibe o dropdown de horários
    horaSelect.style.display = 'block';
    input.style.display = 'none';

    // Exibe a próxima pergunta (horário)
    setTimeout(() => {
      addMessage(perguntas[step]);
      atualizarEtapaInfo();
    }, 500);

    return;
  } else {
    horaSelect.style.display = 'none';
    input.style.display = 'block';
  }

  // Verifica se todas as perguntas foram respondidas
  if (step < perguntas.length) {
    setTimeout(() => {
      addMessage(perguntas[step]);
      atualizarEtapaInfo();
    }, 500);
  } else {
    setTimeout(() => {
      addMessage("📤 Enviando agendamento...");
      enviarAgendamento();
    }, 500);
  }
}

async function enviarAgendamento() {
  const horarioSelecionado = agendamento.horario;
  const nomeUsuario = agendamento.nome1;
  
  if (!horarioSelecionado || !nomeUsuario) {
    addMessage('Por favor, forneça todas as informações necessárias.', 'bot');
    return;
  }

  try {
    // Primeiro, vamos verificar a fase atual do sistema
    const { data: todosAgendamentos, error: errorContagem } = await supabase
      .from('agendamentos')
      .select('nome1, nome2, nome3');
      
    if (errorContagem) {
      console.error('Erro ao contar agendamentos:', errorContagem);
      addMessage('Erro ao verificar disponibilidade.', 'bot');
      return;
    }
    
    // Contar quantos agendamentos existem para cada coluna
    const contadores = {
      nome1: 0,
      nome2: 0,
      nome3: 0
    };
    
    todosAgendamentos.forEach(agendamento => {
      if (agendamento.nome1 && agendamento.nome1.trim() !== '') contadores.nome1++;
      if (agendamento.nome2 && agendamento.nome2.trim() !== '') contadores.nome2++;
      if (agendamento.nome3 && agendamento.nome3.trim() !== '') contadores.nome3++;
    });
    
    // Determinar qual coluna deve ser preenchida
    let colunaParaPreencher = null;
    let posicao = 0;
    
    if (contadores.nome1 < 48) {
      colunaParaPreencher = 'nome1';
      posicao = 1;
    } else if (contadores.nome2 < 48) {
      colunaParaPreencher = 'nome2';
      posicao = 2;
    } else if (contadores.nome3 < 48) {
      colunaParaPreencher = 'nome3';
      posicao = 3;
    } else {
      addMessage('Todos os horários estão completamente ocupados.', 'bot');
      return;
    }
    
    // Buscar se já existe um agendamento para este horário
    const { data: agendamentoExistente, error: errorBusca } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('horario', horarioSelecionado)
      .single();

    if (errorBusca && errorBusca.code !== 'PGRST116') {
      console.error('Erro ao buscar agendamento:', errorBusca);
      addMessage('Erro ao verificar disponibilidade do horário.', 'bot');
      return;
    }

    if (agendamentoExistente) {
       // Horário já existe, vamos atualizar com a coluna apropriada
       if (agendamentoExistente[colunaParaPreencher]) {
         addMessage('Este horário já está ocupado para a fase atual.', 'bot');
         // Volta para a seleção de horário
         perguntaAtual = 1;
         agendamento.horario = null;
         setTimeout(() => {
           addMessage(perguntas[perguntaAtual].texto, 'bot');
         }, 1000);
         return;
       }
      
      const { error } = await supabase
        .from('agendamentos')
        .update({ [colunaParaPreencher]: nomeUsuario })
        .eq('horario', horarioSelecionado);
        
      if (error) {
        console.error('Erro ao atualizar agendamento:', error);
        addMessage('Erro ao salvar agendamento.', 'bot');
        return;
      }
      
    } else {
      // Horário não existe, vamos criar um novo registro
       if (colunaParaPreencher !== 'nome1') {
         addMessage('Este horário não está disponível para a fase atual.', 'bot');
         // Volta para a seleção de horário
         perguntaAtual = 1;
         agendamento.horario = null;
         setTimeout(() => {
           addMessage(perguntas[perguntaAtual].texto, 'bot');
         }, 1000);
         return;
       }
      
      const novoAgendamento = {
        horario: agendamento.horario,
        [colunaParaPreencher]: nomeUsuario
      };
      
      const { error } = await supabase
        .from('agendamentos')
        .insert([novoAgendamento]);
      
      if (error) {
        console.error('Erro ao criar agendamento:', error);
        addMessage('Erro ao salvar agendamento.', 'bot');
        return;
      }
    }
    
    agendamento.coluna_usada = colunaParaPreencher;
    agendamento.posicao = posicao;

    // Sucesso!
    finalizarAgendamento();
    
  } catch (error) {
    console.error('Erro geral:', error);
    addMessage('Erro inesperado ao processar agendamento.', 'bot');
  }
}

function finalizarAgendamento() {
  input.style.display = 'none';
  document.querySelector('#input-container button').style.display = 'none';

  // Determina a posição do agendamento (1ª, 2ª ou 3ª pessoa)
  let posicaoTexto = "";
  if (agendamento.posicao === 1) {
    posicaoTexto = "(1ª pessoa)";
  } else if (agendamento.posicao === 2) {
    posicaoTexto = "(2ª pessoa)";
  } else if (agendamento.posicao === 3) {
    posicaoTexto = "(3ª pessoa)";
  }

  addMessage(`✅ Seu agendamento foi realizado com sucesso! ⏰ Horário: ${agendamento.horario} ${posicaoTexto}.`);
  
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