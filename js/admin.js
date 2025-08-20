import { db } from './firebase.js';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Variáveis globais
let agendamentos = [];
let agendamentosFiltrados = [];
let googleCalendar = null;

// Inicializar Google Calendar Manager
function initializeGoogleCalendar() {
  try {
    if (window.GoogleCalendarManager) {
      googleCalendar = new window.GoogleCalendarManager();
    } else {
      console.warn('GoogleCalendarManager não disponível');
    }
  } catch (error) {
    console.warn('Google Calendar não disponível:', error);
  }
}

// Aguardar carregamento do google-calendar.js
setTimeout(initializeGoogleCalendar, 100);

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  verificarAutenticacao();
  window.carregarAgendamentos();
  configurarEventListeners();
});

// Verificar autenticação
function verificarAutenticacao() {
  const isAuthenticated = localStorage.getItem('adminAuthenticated');
  const authTimestamp = localStorage.getItem('authTimestamp');
  
  if (!isAuthenticated || isAuthenticated !== 'true') {
    window.location.href = 'login.html';
    return;
  }
  
  if (authTimestamp) {
    const now = Date.now();
    const authTime = parseInt(authTimestamp);
    const hoursPassed = (now - authTime) / (1000 * 60 * 60);
    
    // Autenticação válida por 24 horas
    if (hoursPassed >= 24) {
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('authTimestamp');
      window.location.href = 'login.html';
      return;
    }
  }
}

function configurarEventListeners() {
  // Busca por nome
  document.getElementById('searchName').addEventListener('input', filtrarAgendamentos);
  
  // Filtro por horário
  document.getElementById('searchTime').addEventListener('change', filtrarAgendamentos);
  
  // Filtro por finalidade
  document.getElementById('searchFinalidade').addEventListener('input', filtrarAgendamentos);
}

// Carregar todos os agendamentos
window.carregarAgendamentos = async function() {
  try {
    mostrarLoading(true);
    
    const agendamentosRef = collection(db, 'secretaria', 'sala', 'agSala');
    const q = query(agendamentosRef, orderBy('data'), orderBy('hora'));
    const querySnapshot = await getDocs(q);
    
    agendamentos = [];
    querySnapshot.forEach((doc) => {
      agendamentos.push({ id: doc.id, ...doc.data() });
    });
    
    agendamentosFiltrados = [...agendamentos];
    
  
    renderizarTabela();
    mostrarLoading(false);
    
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
    mostrarErro('Erro inesperado ao carregar dados');
    mostrarLoading(false);
  }
};



// Renderizar tabela
function renderizarTabela() {
  const tbody = document.getElementById('agendamentosTable');
  const tableContainer = document.getElementById('tableContainer');
  const emptyContainer = document.getElementById('emptyContainer');
  
  if (agendamentosFiltrados.length === 0) {
    tableContainer.style.display = 'none';
    emptyContainer.style.display = 'block';
    return;
  }
  
  tableContainer.style.display = 'block';
  emptyContainer.style.display = 'none';
  
  tbody.innerHTML = '';
  
  agendamentosFiltrados.forEach(agendamento => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td><strong>${agendamento.nome || 'N/A'}</strong></td>
      <td>${agendamento.data || 'N/A'}</td>
      <td>${agendamento.hora || 'N/A'}</td>
      <td>${agendamento.finalidade || 'N/A'}</td>
      <td><span class="badge bg-success">${agendamento.sala || 'N/A'}</span></td>
      <td>
        <button class="btn-clean-action" onclick="editarAgendamento('${agendamento.id}')" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn-clean-action" onclick="excluirAgendamento('${agendamento.id}')" title="Excluir">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Filtrar agendamentos
function filtrarAgendamentos() {
  const searchName = document.getElementById('searchName').value.toLowerCase();
  const searchTime = document.getElementById('searchTime').value;
  const searchFinalidade = document.getElementById('searchFinalidade').value.toLowerCase();
  
  // Obter data e hora atuais
  const agora = new Date();
  const dataAtual = agora.toLocaleDateString('pt-BR');
  const horaAtual = agora.toTimeString().slice(0, 5); // HH:MM
  
  agendamentosFiltrados = agendamentos.filter(agendamento => {
    const matchName = !searchName ||
      (agendamento.nome && agendamento.nome.toLowerCase().includes(searchName));
    
    const matchTime = !searchTime || agendamento.hora === searchTime;
    
    const matchFinalidade = !searchFinalidade ||
      (agendamento.finalidade && agendamento.finalidade.toLowerCase().includes(searchFinalidade));
    
    // Filtro para mostrar apenas agendamentos a partir de hoje (independente do horário)
    const isHojeOuFuturo = () => {
      if (!agendamento.data) return false;
      
      // Converter data do agendamento (DD/MM/AAAA) para objeto Date
      const [dia, mes, ano] = agendamento.data.split('/');
      const dataAgendamento = new Date(ano, mes - 1, dia);
      
      // Obter data atual sem horário (apenas data)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Definir horário do agendamento como 00:00 para comparar apenas datas
      dataAgendamento.setHours(0, 0, 0, 0);
      
      // Retornar true se o agendamento é hoje ou futuro
      return dataAgendamento >= hoje;
    };
    
    return matchName && matchTime && matchFinalidade && isHojeOuFuturo();
  });
  
  renderizarTabela();
}

// Editar agendamento
window.editarAgendamento = function(id) {
  const agendamento = agendamentos.find(a => a.id === id);
  if (!agendamento) return;
  
  // Converter data do formato brasileiro DD/MM/AAAA para formato do input date AAAA-MM-DD
  let dataFormatada = agendamento.data || '';
  if (dataFormatada && dataFormatada.includes('/')) {
    const [dia, mes, ano] = dataFormatada.split('/');
    dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  document.getElementById('editId').value = id;
  document.getElementById('editNome').value = agendamento.nome || '';
  document.getElementById('editData').value = dataFormatada;
  document.getElementById('editHora').value = agendamento.hora || '';
  document.getElementById('editFinalidade').value = agendamento.finalidade || '';
  document.getElementById('editSala').value = agendamento.sala || '';
  
  const modalElement = document.getElementById('editModal');
  const modal = new bootstrap.Modal(modalElement);
  
  // Corrigir problema de acessibilidade: remover aria-hidden quando modal estiver aberto
  modalElement.addEventListener('shown.bs.modal', function() {
    modalElement.removeAttribute('aria-hidden');
  });
  
  modalElement.addEventListener('hidden.bs.modal', function() {
    modalElement.setAttribute('aria-hidden', 'true');
  });
  
  modal.show();
};

// Salvar edição
window.salvarEdicao = async function() {
  const id = document.getElementById('editId').value;
  const nome = document.getElementById('editNome').value.trim();
  const dataInput = document.getElementById('editData').value.trim();
  const hora = document.getElementById('editHora').value.trim();
  const finalidade = document.getElementById('editFinalidade').value.trim();
  const sala = document.getElementById('editSala').value.trim();
  
  // Converter data do formato do input date AAAA-MM-DD para formato brasileiro DD/MM/AAAA
  let dataFormatada = dataInput;
  if (dataInput && dataInput.includes('-')) {
    const [ano, mes, dia] = dataInput.split('-');
    dataFormatada = `${dia}/${mes}/${ano}`;
  }
  
  try {
    // Buscar o agendamento atual para obter o googleCalendarEventId
    const agendamentoAtual = agendamentos.find(ag => ag.id === id);
    
    const docRef = doc(db, 'secretaria/sala/agSala', id);
    await updateDoc(docRef, {
      nome: nome,
      data: dataFormatada,
      hora: hora,
      finalidade: finalidade,
      sala: sala
    });
    
    // Atualizar evento no Google Calendar se existir googleCalendarEventId
    if (googleCalendar && agendamentoAtual && agendamentoAtual.googleCalendarEventId) {
      console.log('Atualizando evento no Google Calendar...');
      const dadosAgendamento = {
        nome: nome,
        data: dataFormatada,
        hora: hora,
        finalidade: finalidade,
        sala: sala
      };
      
      const resultado = await googleCalendar.atualizarEvento(agendamentoAtual.googleCalendarEventId, dadosAgendamento);
      
      if (resultado.success) {
        console.log('Evento atualizado no Google Calendar com sucesso!');
      } else {
        console.warn('Falha ao atualizar evento no Google Calendar:', resultado.error);
        // Não bloqueia a operação, apenas avisa
      }
    }
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    modal.hide();
    
    // Recarregar dados
    await window.carregarAgendamentos();
    mostrarSucesso('Agendamento atualizado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao salvar:', error);
    mostrarErro('Erro inesperado ao salvar');
  }
};

// Excluir agendamento
window.excluirAgendamento = async function(id) {
  const agendamento = agendamentos.find(a => a.id === id);
  if (!agendamento) return;
  
  if (!confirm(`Tem certeza que deseja excluir o agendamento de ${agendamento.nome} para ${agendamento.data} às ${agendamento.hora}?`)) {
    return;
  }
  
  try {
    // Deletar evento no Google Calendar se existir googleCalendarEventId
    if (googleCalendar && agendamento.googleCalendarEventId) {
      console.log('Deletando evento no Google Calendar...');
      const resultado = await googleCalendar.deletarEvento(agendamento.googleCalendarEventId);
      
      if (resultado.success) {
        console.log('Evento deletado no Google Calendar com sucesso!');
      } else {
        console.warn('Falha ao deletar evento no Google Calendar:', resultado.error);
        // Não bloqueia a operação, apenas avisa
      }
    }
    
    const docRef = doc(db, 'secretaria/sala/agSala', id);
    await deleteDoc(docRef);
    
    // Recarregar dados
    await window.carregarAgendamentos();
    mostrarSucesso('Agendamento excluído com sucesso!');
    
  } catch (error) {
    console.error('Erro ao excluir:', error);
    mostrarErro('Erro ao excluir agendamento');
  }
};

// Função removida - não aplicável à nova estrutura

// Limpar todos os agendamentos
window.limparTodosAgendamentos = async function() {
  if (!confirm('ATENÇÃO: Tem certeza que deseja excluir TODOS os agendamentos? Esta ação não pode ser desfeita!')) {
    return;
  }
  
  if (!confirm('Confirme novamente: Deseja realmente excluir TODOS os agendamentos?')) {
    return;
  }
  
  try {
    // Excluir todos os documentos da coleção
    const promises = agendamentos.map(agendamento => {
      const docRef = doc(db, 'secretaria/sala/agSala', agendamento.id);
      return deleteDoc(docRef);
    });
    
    await Promise.all(promises);
    
    await window.carregarAgendamentos();
    mostrarSucesso('Todos os agendamentos foram excluídos!');
    
  } catch (error) {
    console.error('Erro ao limpar todos:', error);
    mostrarErro('Erro inesperado ao limpar todos');
  }
};

// Exportar dados
window.exportarDados = function() {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Nome,Data,Hora,Finalidade,Sala\n"
    + agendamentos.map(a => 
        `${a.nome || ''},${a.data || ''},${a.hora || ''},${a.finalidade || ''},${a.sala || ''}`
      ).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `agendamentos_oracao_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  mostrarSucesso('Dados exportados com sucesso!');
};

// Funções auxiliares
function mostrarLoading(show) {
  const loadingContainer = document.getElementById('loadingContainer');
  const tableContainer = document.getElementById('tableContainer');
  const emptyContainer = document.getElementById('emptyContainer');
  
  if (show) {
    loadingContainer.style.display = 'block';
    tableContainer.style.display = 'none';
    emptyContainer.style.display = 'none';
  } else {
    loadingContainer.style.display = 'none';
  }
}

function mostrarErro(mensagem) {
  // Criar toast de erro
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-danger border-0';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-exclamation-triangle"></i> ${mensagem}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  document.body.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  toast.addEventListener('hidden.bs.toast', () => {
    document.body.removeChild(toast);
  });
}

function mostrarSucesso(mensagem) {
  // Criar toast de sucesso
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-success border-0';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-check-circle"></i> ${mensagem}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  document.body.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  toast.addEventListener('hidden.bs.toast', () => {
    document.body.removeChild(toast);
  });
}

// Logout
window.logout = function() {
  if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('authTimestamp');
    window.location.href = 'login.html';
  }
};

// Posicionar toasts
const style = document.createElement('style');
style.textContent = `
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
  }
`;
document.head.appendChild(style);