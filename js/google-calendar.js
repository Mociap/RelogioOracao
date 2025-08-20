// google-calendar.js
// Integração com Google Calendar API (Automática)

class GoogleCalendarIntegration {
  constructor() {
    this.TARGET_CALENDAR_ID = 'seccelulas.iebi@gmail.com';
    this.API_KEY = 'AIzaSyBHPa1JkACf6PJwc-M1iEKzT65r3BmhYWI';
    this.SERVICE_ACCOUNT_EMAIL = 'calendario@fleet-blend-465020-g3.iam.gserviceaccount.com';
    this.SCOPES = 'https://www.googleapis.com/auth/calendar';
    this.accessToken = null;
    this.tokenExpiry = null;
    
    this.isInitialized = false;
  }

  // Inicializar a integração (simplificada)
  async initialize() {
    try {
      console.log('🔧 Inicializando integração Google Calendar com Service Account...');
      await this.obterTokenServiceAccount();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar Google Calendar integration:', error);
      return false;
    }
  }

  async obterTokenServiceAccount() {
    try {
      // Carrega as credenciais da Service Account
      const response = await fetch('/contaservico.json');
      const serviceAccount = await response.json();
      
      // Cria o JWT para autenticação
      const jwt = await this.criarJWT(serviceAccount);
      
      // Solicita o access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          'assertion': jwt
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        this.accessToken = tokenData.access_token;
        this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
        console.log('✅ Token da Service Account obtido com sucesso');
        return this.accessToken;
      } else {
        throw new Error('Falha ao obter token: ' + JSON.stringify(tokenData));
      }
    } catch (error) {
      console.error('❌ Erro ao obter token da Service Account:', error);
      return null;
    }
  }
  
  async criarJWT(serviceAccount) {
    // Cria o header do JWT
    const header = {
      "alg": "RS256",
      "typ": "JWT"
    };
    
    // Cria o payload do JWT
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      "iss": serviceAccount.client_email,
      "scope": this.SCOPES,
      "aud": "https://oauth2.googleapis.com/token",
      "exp": now + 3600, // 1 hora
      "iat": now
    };
    
    // Codifica em base64url
    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(payload));
    
    // Cria a assinatura usando Web Crypto API
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.assinarJWT(signatureInput, serviceAccount.private_key);
    
    return `${signatureInput}.${signature}`;
  }
  
  base64urlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  async assinarJWT(data, privateKey) {
    try {
      // Remove headers e footers da chave privada
      const pemKey = privateKey
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
      
      // Converte para ArrayBuffer
      const keyData = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
      
      // Importa a chave
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      );
      
      // Assina os dados
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        new TextEncoder().encode(data)
      );
      
      // Converte para base64url
      return this.base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));
    } catch (error) {
      console.error('❌ Erro ao assinar JWT:', error);
      throw error;
    }
  }
  
  async verificarTokenValido() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    
    // Verifica se o token ainda é válido (com margem de 5 minutos)
    const margemSeguranca = 5 * 60 * 1000; // 5 minutos
    return Date.now() < (this.tokenExpiry - margemSeguranca);
  }
  
  async renovarTokenSeNecessario() {
    if (!await this.verificarTokenValido()) {
      console.log('🔄 Renovando token da Service Account...');
      return await this.obterTokenServiceAccount();
    }
    return this.accessToken;
  }
  
  // Criar evento automaticamente (integração real)
  async criarEventoAutomatico(agendamento) {
    try {
      console.log('Iniciando criação de evento no Google Calendar...');
      
      // Garante que temos um token válido
      const token = await this.renovarTokenSeNecessario();
      
      if (!token) {
        throw new Error('Não foi possível obter token de acesso');
      }
      
      // Dados do agendamento
      const { nome, sala, finalidade, data, hora } = agendamento;
      
      // Formatar data e hora para o formato ISO 8601
      const dataHoraInicio = this.formatarDataHora(data, hora);
      const dataHoraFim = this.formatarDataHora(data, hora, 60); // 60 minutos de duração
      
      // Criar objeto do evento
      const evento = {
        summary: `${finalidade} - ${nome} (${sala})`,
        description: `Reserva de Sala Confirmada\n\nNome: ${nome}\nSala: ${sala}\nFinalidade: ${finalidade}\nData: ${data}\nHorário: ${hora}\n\nAgendamento criado automaticamente pelo sistema.`,
        start: {
          dateTime: dataHoraInicio,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: dataHoraFim,
          timeZone: 'America/Sao_Paulo'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 30 } // 30 minutos antes
          ]
        }
      };
      
      console.log('Dados do evento preparados:', {
        summary: evento.summary,
        start: evento.start.dateTime,
        end: evento.end.dateTime
      });
      
      // Fazer chamada real para a API do Google Calendar
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.TARGET_CALENDAR_ID)}/events?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evento)
      });
      
      if (response.status === 401) {
        // Token inválido - renova automaticamente
        console.log('🔄 Token inválido, renovando...');
        const novoToken = await this.obterTokenServiceAccount();
        if (novoToken) {
          // Tenta novamente com o novo token
          return await this.criarEventoAutomatico(agendamento);
        }
        throw new Error('Falha na renovação do token');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro da API do Google Calendar: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const eventoCreated = await response.json();
      
      console.log('Evento criado com sucesso no Google Calendar!');
      console.log('ID do evento:', eventoCreated.id);
      console.log('Link do evento:', eventoCreated.htmlLink);
      
      return {
        success: true,
        eventId: eventoCreated.id,
        eventLink: eventoCreated.htmlLink,
        isSimulation: false
      };
      
    } catch (error) {
      console.error('Erro ao criar evento no Google Calendar:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }



  // Formatar data e hora para ISO 8601
  formatarDataHora(data, hora, duracaoMinutos = 0) {
    // data está no formato DD/MM/AAAA (formato brasileiro)
    // hora está no formato HH:00
    
    const [dia, mes, ano] = data.split('/');
    const [horas, minutos] = hora.split(':');
    
    // Criar objeto Date (mês é 0-indexado no JavaScript)
    const dataObj = new Date(ano, mes - 1, dia, parseInt(horas), parseInt(minutos));
    
    // Adicionar duração se especificada
    if (duracaoMinutos > 0) {
      dataObj.setMinutes(dataObj.getMinutes() + duracaoMinutos);
    }
    
    // Retornar no formato ISO para Google Calendar API
    return dataObj.toISOString();
  }

  // Calcular hora de fim (1 hora após o início)
  calcularHoraFim(dataHoraInicio) {
    const dataInicio = new Date(dataHoraInicio);
    const dataFim = new Date(dataInicio.getTime() + (60 * 60 * 1000)); // +1 hora
    return dataFim.toISOString();
  }

  // Atualizar evento no Google Calendar
  async atualizarEvento(eventId, agendamento) {
    try {
      console.log('Atualizando evento no Google Calendar...', eventId);
      
      // Garante que temos um token válido
      const token = await this.renovarTokenSeNecessario();
      
      if (!token) {
        throw new Error('Não foi possível obter token de acesso');
      }
      
      // Dados do agendamento
      const { nome, sala, finalidade, data, hora } = agendamento;
      
      // Formatar data e hora para o formato ISO 8601
      const dataHoraInicio = this.formatarDataHora(data, hora);
      const dataHoraFim = this.formatarDataHora(data, hora, 60); // 60 minutos de duração
      
      // Criar objeto do evento atualizado
      const eventoAtualizado = {
        summary: `${finalidade} - ${nome} (${sala})`,
        description: `Reserva de Sala Atualizada\n\nNome: ${nome}\nSala: ${sala}\nFinalidade: ${finalidade}\nData: ${data}\nHorário: ${hora}\n\nAgendamento atualizado automaticamente pelo sistema.`,
        start: {
          dateTime: dataHoraInicio,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: dataHoraFim,
          timeZone: 'America/Sao_Paulo'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 30 } // 30 minutos antes
          ]
        }
      };
      
      // Fazer chamada para a API do Google Calendar
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.TARGET_CALENDAR_ID)}/events/${eventId}?key=${this.API_KEY}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventoAtualizado)
      });
      
      if (response.status === 401) {
        // Token inválido - renova automaticamente
        console.log('🔄 Token inválido, renovando...');
        const novoToken = await this.obterTokenServiceAccount();
        if (novoToken) {
          // Tenta novamente com o novo token
          return await this.atualizarEvento(eventId, agendamento);
        }
        throw new Error('Falha na renovação do token');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro da API do Google Calendar: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const eventoAtualizado_response = await response.json();
      
      console.log('Evento atualizado com sucesso no Google Calendar!');
      console.log('ID do evento:', eventoAtualizado_response.id);
      
      return {
        success: true,
        eventId: eventoAtualizado_response.id,
        eventLink: eventoAtualizado_response.htmlLink
      };
      
    } catch (error) {
      console.error('Erro ao atualizar evento no Google Calendar:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Deletar evento no Google Calendar
  async deletarEvento(eventId) {
    try {
      console.log('Deletando evento no Google Calendar...', eventId);
      
      // Garante que temos um token válido
      const token = await this.renovarTokenSeNecessario();
      
      if (!token) {
        throw new Error('Não foi possível obter token de acesso');
      }
      
      // Fazer chamada para a API do Google Calendar
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.TARGET_CALENDAR_ID)}/events/${eventId}?key=${this.API_KEY}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        // Token inválido - renova automaticamente
        console.log('🔄 Token inválido, renovando...');
        const novoToken = await this.obterTokenServiceAccount();
        if (novoToken) {
          // Tenta novamente com o novo token
          return await this.deletarEvento(eventId);
        }
        throw new Error('Falha na renovação do token');
      }
      
      if (!response.ok && response.status !== 410) { // 410 = Gone (já deletado)
        const errorData = await response.text();
        throw new Error(`Erro da API do Google Calendar: ${response.status} - ${errorData}`);
      }
      
      console.log('Evento deletado com sucesso no Google Calendar!');
      
      return {
        success: true,
        eventId: eventId
      };
      
    } catch (error) {
      console.error('Erro ao deletar evento no Google Calendar:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

}

// Instância global
const googleCalendar = new GoogleCalendarIntegration();

// Exportar para uso em outros arquivos
window.googleCalendar = googleCalendar;
window.GoogleCalendarManager = GoogleCalendarIntegration;

// Inicializar automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    googleCalendar.initialize();
  });
} else {
  googleCalendar.initialize();
}