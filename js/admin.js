import supabase from './supabase.js';

// Variáveis globais
let agendamentos = [];
let agendamentosFiltrados = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  verificarAutenticacao();
  carregarAgendamentos();
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
}

// Carregar todos os agendamentos
async function carregarAgendamentos() {
  try {
    mostrarLoading(true);
    
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .order('horario');

    if (error) {
      console.error('Erro ao carregar agendamentos:', error);
      mostrarErro('Erro ao carregar agendamentos');
      return;
    }

    agendamentos = data || [];
    agendamentosFiltrados = [...agendamentos];
    
    atualizarEstatisticas();
    renderizarTabela();
    mostrarLoading(false);
    
  } catch (error) {
    console.error('Erro geral:', error);
    mostrarErro('Erro inesperado ao carregar dados');
    mostrarLoading(false);
  }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
  const contadores = {
    nome1: 0,
    nome2: 0,
    nome3: 0
  };
  
  agendamentos.forEach(agendamento => {
    if (agendamento.nome1 && agendamento.nome1.trim() !== '') {
      contadores.nome1++;
    }
    if (agendamento.nome2 && agendamento.nome2.trim() !== '') {
      contadores.nome2++;
    }
    if (agendamento.nome3 && agendamento.nome3.trim() !== '') {
      contadores.nome3++;
    }
  });
  
  const totalAgendamentos = contadores.nome1 + contadores.nome2 + contadores.nome3;
  
  // Calcular percentuais para cada grupo (máximo 48 pessoas por grupo)
  const percentualGrupo1 = Math.round((contadores.nome1 / 48) * 100);
  const percentualGrupo2 = Math.round((contadores.nome2 / 48) * 100);
  const percentualGrupo3 = Math.round((contadores.nome3 / 48) * 100);
  
  // Atualizar interface
  document.getElementById('totalAgendamentos').textContent = totalAgendamentos;
  
  // Atualizar cards dos grupos
  document.getElementById('grupo1Total').textContent = `${contadores.nome1} pessoas`;
  document.getElementById('grupo1Percentual').textContent = `${percentualGrupo1}%`;
  
  document.getElementById('grupo2Total').textContent = `${contadores.nome2} pessoas`;
  document.getElementById('grupo2Percentual').textContent = `${percentualGrupo2}%`;
  
  document.getElementById('grupo3Total').textContent = `${contadores.nome3} pessoas`;
  document.getElementById('grupo3Percentual').textContent = `${percentualGrupo3}%`;
}

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
    
    // Função para capitalizar texto (Title Case)
    const capitalize = (str) => {
      if (!str) return '';
      return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
    };
    
    const nome1 = capitalize(agendamento.nome1) || '';
    const nome2 = capitalize(agendamento.nome2) || '';
    const nome3 = capitalize(agendamento.nome3) || '';
    
    row.innerHTML = `
      <td><strong>${agendamento.horario}</strong></td>
      <td>${nome1 ? `<span>${nome1}</span>` : '<span class="text-muted">Vazio</span>'}</td>
      <td>${nome2 ? `<span>${nome2}</span>` : '<span class="text-muted">Vazio</span>'}</td>
      <td>${nome3 ? `<span>${nome3}</span>` : '<span class="text-muted">Vazio</span>'}</td>
      <td>
        <button class="btn-clean-action" onclick="editarAgendamento('${agendamento.horario}')" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn-clean-action" onclick="excluirAgendamento('${agendamento.horario}')" title="Excluir">
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
  
  agendamentosFiltrados = agendamentos.filter(agendamento => {
    const matchName = !searchName || 
      (agendamento.nome1 && agendamento.nome1.toLowerCase().includes(searchName)) ||
      (agendamento.nome2 && agendamento.nome2.toLowerCase().includes(searchName)) ||
      (agendamento.nome3 && agendamento.nome3.toLowerCase().includes(searchName));
    
    const matchTime = !searchTime || agendamento.horario === searchTime;
    
    return matchName && matchTime;
  });
  
  renderizarTabela();
}

// Editar agendamento
window.editarAgendamento = function(horario) {
  const agendamento = agendamentos.find(a => a.horario === horario);
  if (!agendamento) return;
  
  document.getElementById('editHorario').value = horario;
  document.getElementById('editHorarioDisplay').value = horario;
  document.getElementById('editNome1').value = agendamento.nome1 || '';
  document.getElementById('editNome2').value = agendamento.nome2 || '';
  document.getElementById('editNome3').value = agendamento.nome3 || '';
  
  const modal = new bootstrap.Modal(document.getElementById('editModal'));
  modal.show();
};

// Salvar edição
window.salvarEdicao = async function() {
  const horario = document.getElementById('editHorario').value;
  const nome1 = document.getElementById('editNome1').value.trim();
  const nome2 = document.getElementById('editNome2').value.trim();
  const nome3 = document.getElementById('editNome3').value.trim();
  
  try {
    const { error } = await supabase
      .from('agendamentos')
      .update({
        nome1: nome1 || null,
        nome2: nome2 || null,
        nome3: nome3 || null
      })
      .eq('horario', horario);
    
    if (error) {
      console.error('Erro ao salvar:', error);
      mostrarErro('Erro ao salvar alterações');
      return;
    }
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    modal.hide();
    
    // Recarregar dados
    await carregarAgendamentos();
    mostrarSucesso('Agendamento atualizado com sucesso!');
    
  } catch (error) {
    console.error('Erro geral:', error);
    mostrarErro('Erro inesperado ao salvar');
  }
};

// Excluir agendamento
window.excluirAgendamento = async function(horario) {
  if (!confirm(`Tem certeza que deseja excluir o agendamento do horário ${horario}?`)) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('horario', horario);
    
    if (error) {
      console.error('Erro ao excluir:', error);
      mostrarErro('Erro ao excluir agendamento');
      return;
    }
    
    await carregarAgendamentos();
    mostrarSucesso('Agendamento excluído com sucesso!');
    
  } catch (error) {
    console.error('Erro geral:', error);
    mostrarErro('Erro inesperado ao excluir');
  }
};

// Limpar horário (remover todos os nomes)
window.limparHorario = async function(horario) {
  if (!confirm(`Tem certeza que deseja limpar todos os nomes do horário ${horario}?`)) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('agendamentos')
      .update({
        nome1: null,
        nome2: null,
        nome3: null
      })
      .eq('horario', horario);
    
    if (error) {
      console.error('Erro ao limpar:', error);
      mostrarErro('Erro ao limpar horário');
      return;
    }
    
    await carregarAgendamentos();
    mostrarSucesso('Horário limpo com sucesso!');
    
  } catch (error) {
    console.error('Erro geral:', error);
    mostrarErro('Erro inesperado ao limpar');
  }
};

// Limpar todos os agendamentos
window.limparTodosAgendamentos = async function() {
  if (!confirm('ATENÇÃO: Tem certeza que deseja excluir TODOS os agendamentos? Esta ação não pode ser desfeita!')) {
    return;
  }
  
  if (!confirm('Confirme novamente: Deseja realmente excluir TODOS os agendamentos?')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .neq('horario', 'nunca_vai_existir'); // Deleta todos os registros
    
    if (error) {
      console.error('Erro ao limpar todos:', error);
      mostrarErro('Erro ao limpar todos os agendamentos');
      return;
    }
    
    await carregarAgendamentos();
    mostrarSucesso('Todos os agendamentos foram excluídos!');
    
  } catch (error) {
    console.error('Erro geral:', error);
    mostrarErro('Erro inesperado ao limpar todos');
  }
};

// Exportar dados
window.exportarDados = function() {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Horário,1ª Pessoa,2ª Pessoa,3ª Pessoa\n"
    + agendamentos.map(a => 
        `${a.horario},${a.nome1 || ''},${a.nome2 || ''},${a.nome3 || ''}`
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
