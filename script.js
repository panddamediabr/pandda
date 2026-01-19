// 1. Configuração do Supabase (Chaves Reais do Projeto Pandda)
const SUPABASE_URL = 'https://ptpdlrlcpdxddqrjpuac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_diYrzfwlDGIAtfRKfHPwIA_X_rwRLjT';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Lógica do Formulário
document.getElementById('formTeste').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btnSubmit');
  const nome = document.getElementById('nome').value;
  // Remove tudo que não for número do WhatsApp
  const whatsapp = document.getElementById('whatsapp').value.replace(/\D/g, ''); 
  // Coloca o cupom em Maiúsculo e remove espaços laterais
  const cupom = document.getElementById('cupom').value.toUpperCase().trim();

  // Feedback de carregamento
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  try {
    // Validação simples
    if (whatsapp.length < 10) {
      alert("Por favor, digite um WhatsApp válido.");
      btn.textContent = 'SOLICITAR ACESSO';
      btn.disabled = false;
      return;
    }

    // Prepara os dados
    const dados = {
      nome: nome,
      whatsapp: whatsapp,
      cupom_usado: cupom === "" ? null : cupom,
    };

    // Envia para o Supabase
    const { error } = await supabase
      .from('solicitacoes_teste')
      .insert([dados]);

    if (error) throw error;

    // Sucesso Visual
    btn.style.backgroundColor = '#00E676';
    btn.style.color = '#000';
    btn.textContent = '✅ Recebido!';
    
    // Alerta de Sucesso
    alert(`Olá, ${nome}! Bem-vindo ao mundo Pandda.\n\nRecebemos sua solicitação.${cupom ? ' Cupom aplicado com sucesso!' : ''}\n\nNossa equipe entrará em contato via WhatsApp em breve para liberar seu acesso.`);
    
    // Limpa o formulário
    document.getElementById('formTeste').reset();
    
    // Restaura o botão após 5 segundos
    setTimeout(() => {
        btn.style.backgroundColor = ''; 
        btn.style.color = '';
        btn.textContent = 'SOLICITAR ACESSO';
        btn.disabled = false;
    }, 5000);

  } catch (erro) {
    console.error('Erro:', erro);
    alert('Erro ao conectar com o servidor Pandda. Tente novamente.');
    btn.textContent = 'SOLICITAR ACESSO';
    btn.disabled = false;
  }
});