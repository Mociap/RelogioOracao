
import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const chat = document.getElementById('chat');
const input = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

let step = 0;
let agendamento = {};

// Função para carregar salas do Firestore
async function carregarSalas() {
  try {
    const salasRef = collection(db, 'secretaria', 'sala', 'CadSala');
    const snapshot = await getDocs(salasRef);
    const salas = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.sala) {
        salas.push(data.sala);
      } else {
        console.log(`⚠️ Documento sem campo 'sala':`, data);
      }
    });
    return salas.sort();
  } catch (error) {
    console.error('❌ Erro ao carregar salas:', error);
    return [];
  }
}

// Função para criar dropdown na área de resposta
function criarDropdownNaResposta(salas) {
  const originalInput = document.getElementById('userInput');
  const sendButton = document.getElementById('sendButton');

  // Substituir input por select
  const selectSala = document.createElement('select');
  selectSala.className = 'form-control';
  selectSala.id = 'salaSelect';

  selectSala.innerHTML = `
    <option value="">Selecione a sala...</option>
    ${salas.map(sala => `
      <option value="${sala}">${sala}</option>
    `).join('')}
  `;

  // Substituir o input pelo select
  originalInput.style.display = 'none';
  originalInput.parentNode.insertBefore(selectSala, originalInput);

  // Modificar botão para confirmar
  sendButton.innerHTML = '<i class="bi bi-check"></i>';
  sendButton.onclick = function () {
    const salaSelecionada = selectSala.value;

    if (!salaSelecionada) {
      alert('Por favor, selecione uma sala!');
      return;
    }

    // Remover select e restaurar input original
    selectSala.remove();
    originalInput.style.display = 'block';
    sendButton.innerHTML = '<i class="bi bi-send"></i>';
    sendButton.onclick = function () { handleInput(); };

    // Adicionar mensagem do usuário
    addMessage(salaSelecionada, 'user', step);

    // Salvar no agendamento
    agendamento.sala = salaSelecionada;

    // Incrementar step e continuar para próxima pergunta
    step++;

    // Verificar se ainda há perguntas
    if (step < perguntas.length) {
      setTimeout(() => {
        addMessage(perguntas[step]);
        atualizarEtapaInfo();
      }, 500);
    } else {
      setTimeout(() => {
        mostrarResumoConfirmacao();
      }, 500);
    }
  };

  // Event listener para Enter no select
  selectSala.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      sendButton.click();
    }
  });
}

function criarSeletorData() {
  // Salvar referências dos elementos originais
  const inputOriginal = input;
  const botaoOriginal = sendButton;
  const textoOriginalBotao = botaoOriginal.innerHTML;

  // Criar input de data
  const inputData = document.createElement('input');
  inputData.type = 'date';
  inputData.lang = 'pt-BR';
  inputData.setAttribute('data-locale', 'pt-BR');
    // Adicionar atributos para forçar formato brasileiro
  inputData.setAttribute('pattern', '[0-9]{2}/[0-9]{2}/[0-9]{4}');
  inputData.setAttribute('placeholder', 'dd/mm/aaaa');
  inputData.style.cssText = `
    width: 100%;
    padding: 5px;
    border: 2px solid #ddd;
    border-radius: 25px;
    font-size: 15px !important;
    background-color: white;
    outline: none;
    font-family: inherit;
  `;

  // Configurar localização para português brasileiro
  inputData.setAttribute('data-locale', 'pt-BR');

  // Definir data mínima como hoje
  const hoje = new Date();
  const dataMinima = hoje.toISOString().split('T')[0];
  inputData.min = dataMinima;

  // Substituir input pelo seletor
  inputOriginal.style.display = 'none';
  inputOriginal.parentNode.insertBefore(inputData, inputOriginal);

  // Modificar botão para confirmação
  botaoOriginal.innerHTML = '✓';
  botaoOriginal.title = 'Confirmar data';

  // Função para processar seleção
  function processarSelecao() {
    const dataSelecionada = inputData.value;

    if (!dataSelecionada) {
      addMessage('❌ Por favor, selecione uma data!', 'bot');
      return;
    }

    // Converter para formato DD/MM/AAAA
    const [ano, mes, dia] = dataSelecionada.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Salvar no objeto agendamento
    agendamento.data = dataFormatada;

    // Adicionar mensagem do usuário
    addMessage(dataFormatada, 'user', step);

    // Restaurar elementos originais
    inputData.remove();
    inputOriginal.style.display = 'block';
    botaoOriginal.innerHTML = textoOriginalBotao;
    botaoOriginal.title = '';

    // Avançar para próxima pergunta
    step++;

    setTimeout(() => {
      addMessage(perguntas[step]);
      atualizarEtapaInfo();
      if (step === 4) {
        criarDropdownHorario(); // Chama o dropdown de horário APÓS confirmação da data
      }
    }, 500);
  }

  // Event listeners
  botaoOriginal.onclick = processarSelecao;

  inputData.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      processarSelecao();
    }
  });

  // Focar no seletor
  inputData.focus();
}

async function criarDropdownHorario() {
  // Salvar referências dos elementos originais
  const inputOriginal = input;
  const botaoOriginal = sendButton;
  const textoOriginalBotao = botaoOriginal.innerHTML;

  // Criar dropdown de horários
  const dropdown = document.createElement('select');
  dropdown.id = 'horarioDropdown';
  dropdown.style.cssText = `
    flex: 1;
    padding: 10px;
    border: 0.1px solid #0d6efd;
    border-radius: 5px 0px 0px 5px;
    font-size: 16px;
    background-color: #f1f1f1;
    cursor: pointer;
    outline: none;
    font-family: inherit;
    height: 40px;
    box-sizing: border-box;
  `;

  // Adicionar opção padrão
  const opcaoPadrao = document.createElement('option');
  opcaoPadrao.value = '';
  opcaoPadrao.textContent = 'Carregando horários...';
  opcaoPadrao.disabled = true;
  opcaoPadrao.selected = true;
  dropdown.appendChild(opcaoPadrao);

  // Buscar agendamentos existentes para a data e sala selecionadas
  const dataEscolhida = agendamento.data;
  const salaEscolhida = agendamento.sala;

  console.log('Dados do agendamento:', agendamento);
  console.log('Data escolhida:', dataEscolhida);
  console.log('Sala escolhida:', salaEscolhida);

  try {
    const agendamentosRef = collection(db, 'secretaria', 'sala', 'agSala');
    const q = query(
      agendamentosRef,
      where('data', '==', dataEscolhida),
      where('sala', '==', salaEscolhida)
    );

    const querySnapshot = await getDocs(q);
    const horariosOcupados = {};

    querySnapshot.forEach((doc) => {
      const dados = doc.data();
      horariosOcupados[dados.hora] = dados.nome;
    });

    // Limpar dropdown e adicionar opção padrão atualizada
    dropdown.innerHTML = '';
    opcaoPadrao.textContent = 'Selecione um horário';
    dropdown.appendChild(opcaoPadrao);

    // Verificar se a data selecionada é hoje
    const hoje = new Date();
    const [diaEscolhido, mesEscolhido, anoEscolhido] = dataEscolhida.split('/');
    const dataSelecionada = new Date(anoEscolhido, mesEscolhido - 1, diaEscolhido);
    const ehHoje = dataSelecionada.toDateString() === hoje.toDateString();
    const horaAtual = ehHoje ? hoje.getHours() : -1;

    // Gerar horários de 00:00 a 23:00
    for (let hora = 0; hora < 24; hora++) {
      const opcao = document.createElement('option');
      const horarioFormatado = hora.toString().padStart(2, '0') + ':00';
      opcao.value = horarioFormatado;

      // Se for hoje, só mostrar horários futuros
      if (ehHoje && hora <= horaAtual) {
        // Horário já passou - não adicionar à lista
        continue;
      }

      if (horariosOcupados[horarioFormatado]) {
        // Horário ocupado - mostrar nome e desabilitar
        opcao.textContent = `${horarioFormatado} - Ocupado por ${horariosOcupados[horarioFormatado]}`;
        opcao.disabled = true;
        opcao.style.color = '#999';
        opcao.style.fontStyle = 'italic';
      } else {
        // Horário disponível
        opcao.textContent = `${horarioFormatado} - Disponível`;
      }

      dropdown.appendChild(opcao);
    }

  } catch (error) {
    console.error('Erro ao carregar horários:', error);
    // Em caso de erro, mostrar horários sem verificação
    dropdown.innerHTML = '';
    opcaoPadrao.textContent = 'Selecione um horário';
    dropdown.appendChild(opcaoPadrao);

    for (let hora = 0; hora < 24; hora++) {
      const opcao = document.createElement('option');
      const horarioFormatado = hora.toString().padStart(2, '0') + ':00';
      opcao.value = horarioFormatado;
      opcao.textContent = horarioFormatado;
      dropdown.appendChild(opcao);
    }
  }

  // Substituir input pelo dropdown
  inputOriginal.style.display = 'none';
  inputOriginal.parentNode.insertBefore(dropdown, inputOriginal);

  // Modificar botão para confirmação
  botaoOriginal.innerHTML = '✓';
  botaoOriginal.title = 'Confirmar horário';

  // Função para processar seleção
  function processarSelecao() {
    const horarioSelecionado = dropdown.value;
    console.log('Horário selecionado:', horarioSelecionado);

    if (!horarioSelecionado) {
      addMessage('❌ Por favor, selecione um horário!', 'bot');
      return;
    }

    // Salvar no objeto agendamento
    agendamento.hora = horarioSelecionado;
    console.log('Agendamento atualizado:', agendamento);

    // Adicionar mensagem do usuário
    addMessage(horarioSelecionado, 'user', step);

    // Restaurar elementos originais
    dropdown.remove();
    inputOriginal.style.display = 'block';
    botaoOriginal.innerHTML = textoOriginalBotao;
    botaoOriginal.title = '';

    // Avançar para próxima pergunta ou finalizar
    step++;

    if (step < perguntas.length) {
      setTimeout(() => {
        addMessage(perguntas[step]);
        atualizarEtapaInfo();
      }, 300);
    } else {
      setTimeout(() => {
        mostrarResumoConfirmacao();
      }, 300);
    }
  }

  // Event listeners
  botaoOriginal.onclick = processarSelecao;

  dropdown.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      processarSelecao();
    }
  });

  // Focar no dropdown
  dropdown.focus();
}

const perguntas = [
  "🙏 <b>Olá!</b>, eu sou <b>Ester</b> sua Secretária vitual. \n Vamos reservar sua sala. \nPrimeiro, me diga seu nome?",
  "🏢 Qual a <b>sala</b> gostaria de reservar?",
  "🎯 Qual será a <b>finalidade</b> da Reserva?\nPor favor, descreva brevemente o motivo da reserva (ex: célula, treinamento, evento, etc.)",
  "📅 Selecione a <b>data</b> da reserva:",
  "⏰ Selecione o <b>horário</b> da reserva?"
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
    // Insere texto do usuário sem botão de edição
    bubble.innerHTML = `<span>${text}</span>`;
  }

  msg.appendChild(bubble);
  chat.appendChild(msg);
  scrollToBottom();
}

function simulateTyping(element, text) {
  element.innerHTML = '';
  let index = 0;
  let buffer = '';
  const interval = setInterval(() => {
    if (text[index] === '\n') {
      buffer += '<br>';
    } else {
      buffer += text[index];
    }
    element.innerHTML = buffer;

    // Auto-scroll para manter o final da página visível durante a digitação
    scrollToBottom();

    index++;
    if (index === text.length) {
      clearInterval(interval);
      // Garantir que o scroll final esteja correto
      scrollToBottom();
    }
  }, 20);
}

async function buscarHorariosOcupados(data, hora, sala) {
  try {
    const agendamentosRef = collection(db, 'secretaria', 'sala', 'agSala');
    const q = query(
      agendamentosRef,
      where('data', '==', data),
      where('hora', '==', hora),
      where('sala', '==', sala)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Retorna true se já existe agendamento
  } catch (error) {
    console.error('Erro ao buscar horários ocupados:', error);
    return false;
  }
}

function mostrarResumoConfirmacao() {
  const { nome, sala, finalidade, data, hora } = agendamento;

  // Formatar data para DD/MM/AAAA
  let dataFormatada = data;
  if (data && data.includes('-')) {
    const partes = data.split('-');
    if (partes.length === 3) {
      dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }

  // Criar mensagem de resumo formatada
  const resumo = `<b>Resumo do Agendamento:</b>\n\n<b>Nome:</b> ${nome}\n<b>Sala:</b> ${sala}\n<b>Finalidade:</b> ${finalidade}\n<b>Data:</b> ${dataFormatada}\n<b>Horário:</b> ${hora}\n\nPor favor, confira os dados acima e escolha uma das opções abaixo:`;

  addMessage(resumo, 'bot');

  // Ocultar input e botão originais
  input.style.display = 'none';
  sendButton.style.display = 'none';

  setTimeout(() => {
    // Criar container para os botões
    const containerBotoes = document.createElement('div');
    containerBotoes.id = 'botoesConfirmacao';
    containerBotoes.style.cssText = `
        display: flex;
        gap: 10px;
        padding: 0px;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        width: 100%;
      `;

    // Botão Confirmar Reserva
    const botaoConfirmar = document.createElement('button');
    botaoConfirmar.textContent = 'Agendar';
    botaoConfirmar.style.cssText = `
        width: 100px;
        padding: 18px 0;
        background: #28a745 !important;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 18px;
        font-weight: 700;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        margin: 0 10px;
        text-align: center;
        display: inline-block;
      `;

    botaoConfirmar.onmouseover = () => {
      botaoConfirmar.style.background = '#218838 !important';
      botaoConfirmar.style.transform = 'translateY(-1px)';
      botaoConfirmar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    };
    botaoConfirmar.onmouseout = () => {
      botaoConfirmar.style.background = '#28a745 !important';
      botaoConfirmar.style.transform = 'translateY(0)';
      botaoConfirmar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    };

    botaoConfirmar.onclick = () => {
      containerBotoes.remove();
      addMessage('Confirmar Reserva', 'user');
      setTimeout(() => {
        addMessage("Enviando agendamento...");
        enviarAgendamento();
      }, 500);
    };

    // Botão Refazer Reserva
    const botaoRefazer = document.createElement('button');
    botaoRefazer.textContent = 'Refazer';
    botaoRefazer.style.cssText = `
        width: 100px;
        padding: 18px 0;
        background: #dc3545 !important;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 18px;
        font-weight: 700;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        margin: 0 10px;
        text-align: center;
        display: inline-block;
      `;

    botaoRefazer.onmouseover = () => {
      botaoRefazer.style.background = '#c82333 !important';
      botaoRefazer.style.transform = 'translateY(-1px)';
      botaoRefazer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    };
    botaoRefazer.onmouseout = () => {
      botaoRefazer.style.background = '#dc3545 !important';
      botaoRefazer.style.transform = 'translateY(0)';
      botaoRefazer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    };

    botaoRefazer.onclick = () => {
      // Reinicializar completamente o objeto agendamento
      agendamento = {
        nome: "",
        sala: "",
        finalidade: "",
        data: "",
        hora: ""
      };
      step = 0;
      containerBotoes.remove();
      chat.innerHTML = '';
      input.style.display = 'block';
      sendButton.style.display = 'flex';
      input.value = '';

      // Limpar qualquer listener de evento antigo do botão
      sendButton.onclick = function () { handleInput(); };

      setTimeout(() => {
        addMessage(perguntas[step]);
        atualizarEtapaInfo();
      }, 300);
    };

    containerBotoes.appendChild(botaoConfirmar);
    containerBotoes.appendChild(botaoRefazer);
    const inputContainer = document.getElementById('input-container');
    inputContainer.appendChild(containerBotoes);
    scrollToBottom();
  }, 5000);
}

async function handleInput() {
  let value;

  // Captura o valor do input
  value = input.value.trim();
  if (!value) return;
  input.value = '';

  // Step 2 (data) e Step 3 (horário) agora são tratados via seletores, não precisam de validação aqui

  // Adiciona a mensagem do usuário
  addMessage(value, 'user', step);

  // Salva a resposta no objeto
  switch (step) {
    case 0:
      agendamento.nome = value;
      break;
    case 1:
      agendamento.sala = value;
      break;
    case 2:
      agendamento.finalidade = value;
      break;
    case 3:
      agendamento.data = value;
      break;
    case 4:
      agendamento.hora = value;
      break;
  }

  step++;

  // Verifica se todas as perguntas foram respondidas
  if (step < perguntas.length) {
    setTimeout(async () => {
      if (step === 1) {
        // Carregar salas e criar dropdown na área de input
        const salas = await carregarSalas();
        if (salas.length > 0) {
          const perguntaPersonalizada = `🏢 A Paz do Senhor <b>${agendamento.nome}</b>! Qual <b>sala</b> gostaria de reservar?`;
          addMessage(perguntaPersonalizada);
          criarDropdownNaResposta(salas);
        } else {
          addMessage('❌ Erro ao carregar salas. Tente novamente.', 'bot');
        }
      } else if (step === 2) {
        // Pergunta sobre finalidade (input de texto simples)
        addMessage(perguntas[step]);
      } else if (step === 3) {
        // Criar seletor de data
        addMessage(perguntas[step]);
        criarSeletorData();
      } else {
        addMessage(perguntas[step]);

      }
      atualizarEtapaInfo();
    }, 1000);
  } else {
    setTimeout(() => {
      mostrarResumoConfirmacao();
    }, 500);
  }
}

async function enviarAgendamento() {
  const { nome, sala, finalidade, data, hora } = agendamento;

  if (!nome || !sala || !finalidade || !data || !hora) {
    addMessage('Por favor, forneça todas as informações necessárias.', 'bot');
    return;
  }

  try {
    // Verificar se já existe um agendamento para esta combinação
    const jaExiste = await buscarHorariosOcupados(data, hora, sala);

    if (jaExiste) {
      addMessage('Este horário já está ocupado para esta sala. Por favor, escolha outro horário.', 'bot');
      return;
    }

    // Criar novo agendamento
    const novoAgendamento = {
      nome: nome,
      sala: sala,
      finalidade: finalidade,
      data: data,
      hora: hora,
      timestamp: new Date().toISOString(),
      status: 'confirmado'
    };

    const agendamentosRef = collection(db, 'secretaria', 'sala', 'agSala');
    const docRef = await addDoc(agendamentosRef, novoAgendamento);
    console.log('Agendamento salvo no Firebase com ID:', docRef.id);

    // Criar evento no Google Calendar automaticamente
    try {
      if (window.googleCalendar) {
        addMessage('📅 Criando evento no Google Calendar...', 'bot');
        const resultado = await window.googleCalendar.criarEventoAutomatico(agendamento);
        
        if (resultado && resultado.success) {
          console.log('✅ Evento criado no Google Calendar:', resultado.eventId);
          
          // Salvar ID do evento no agendamento
          await updateDoc(doc(db, 'secretaria', 'sala', 'agSala', docRef.id), {
            googleCalendarEventId: resultado.eventId,
            googleCalendarLink: resultado.eventLink
          });
          console.log('ID do evento Google Calendar salvo no agendamento');
          addMessage('✅ Evento criado no Google Calendar com sucesso!', 'bot');
        } else {
          console.warn('⚠️ Falha ao criar evento no Google Calendar:', resultado?.error);
          addMessage('⚠️ Agendamento confirmado, mas houve um problema ao criar o evento no Google Calendar. O agendamento foi salvo com sucesso.', 'bot');
        }
      } else {
        console.warn('Google Calendar não está disponível');
        addMessage('⚠️ Google Calendar não disponível. Agendamento salvo apenas no sistema.', 'bot');
      }
    } catch (calendarError) {
      console.error('❌ Erro ao criar evento no Google Calendar:', calendarError);
      addMessage('⚠️ Agendamento confirmado, mas houve um problema ao criar o evento no Google Calendar. O agendamento foi salvo com sucesso.', 'bot');
    }

    // Sucesso!
    finalizarAgendamento();

  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    addMessage('❌ Erro ao confirmar agendamento. Tente novamente.', 'bot');
  }
}

function finalizarAgendamento() {
  input.style.display = 'none';
  document.querySelector('#input-container button').style.display = 'none';

  setTimeout(() => {
    addMessage(`✨ Agendamento confirmado com sucesso!`);
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

// Verificar inicialização do Google Calendar
function verificarGoogleCalendar() {
  if (window.googleCalendar) {
    console.log('✅ Google Calendar Service Account inicializado');
  } else {
    console.error('❌ Erro na inicialização do Google Calendar');
  }
}

// Aguardar carregamento do DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sistema de agendamento carregado');
  
  // Verificar Google Calendar ao carregar a página
  verificarGoogleCalendar();
  
  // Inicializar chat
  addMessage(perguntas[step]);
  atualizarEtapaInfo();
  
  console.log('Sistema inicializado com sucesso');
});