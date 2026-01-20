// ============================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ============================================
// Substitua pelas suas chaves reais do painel Supabase
const SUPABASE_URL = 'https://ptpdlrlcpdxddqrjpuac.supabase.co';
const SUPABASE_KEY = 'SUA_CHAVE_AQUI_AQUELA_QUE_COMECA_COM_sbp_OU_eyJ'; 
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// 2. CONTROLE DO FORMULÁRIO (ETAPAS)
// ============================================
const stepStart = document.getElementById('step-start');
const stepApps = document.getElementById('step-apps');
const stepForm = document.getElementById('step-form');

const btnIniciar = document.getElementById('btn-iniciar-teste');
const btnJaInstalei = document.getElementById('btn-ja-instalei');

if(btnIniciar) {
    btnIniciar.addEventListener('click', () => {
        stepStart.classList.add('hidden');
        stepApps.classList.remove('hidden');
        stepApps.classList.add('fade-in');
    });
}

if(btnJaInstalei) {
    btnJaInstalei.addEventListener('click', () => {
        stepApps.classList.add('hidden');
        stepForm.classList.remove('hidden');
        stepForm.classList.add('fade-in');
    });
}

// ============================================
// 3. MÁSCARA DE WHATSAPP
// ============================================
const whatsappInput = document.getElementById('whatsapp');

if(whatsappInput) {
    whatsappInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); 
        if (value.length > 11) value = value.slice(0, 11); 
        if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        if (value.length > 9) value = `${value.slice(0, 10)}-${value.slice(10)}`;
        e.target.value = value;
    });
}

// ============================================
// 4. ENVIO DO FORMULÁRIO DE TESTE
// ============================================
const form = document.getElementById('formTeste');
const toast = document.getElementById('toast');

if(form) {
    const btnSubmit = form.querySelector('button[type="submit"]');
    const btnText = document.getElementById('btn-text');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const originalText = btnText.textContent;
        btnText.textContent = 'Processando...';
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = '0.7';

        // Coleta dados
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const ddi = document.getElementById('pais').value;
        const whatsRaw = document.getElementById('whatsapp').value.replace(/\D/g, '');
        const horario = document.getElementById('horario').value;
        
        // Tratamento do Cupom (Vazio vira NULL para não dar erro no banco)
        const cupomElem = document.getElementById('cupom');
        let cupomFinal = null;
        if (cupomElem && cupomElem.value.trim() !== "") {
            cupomFinal = cupomElem.value.trim().toUpperCase();
        }

        const fullWhatsapp = ddi + whatsRaw;
        
        let nomeFinal = nome;
        if(horario !== 'agora') {
            nomeFinal = `${nome} [Agendado: ${horario}]`;
        }

        try {
            if (whatsRaw.length < 10) throw new Error("WhatsApp inválido.");

            // Envia para o Supabase
            const { error } = await client
                .from('solicitacoes_teste')
                .insert([{
                    nome: nomeFinal,
                    whatsapp: fullWhatsapp,
                    email: email,
                    codigo_usado: cupomFinal
                }]);

            if (error) throw error;

            showToast('success', '✅ Solicitação enviada! Verifique seu WhatsApp.');
            form.reset();
            setTimeout(() => { location.reload(); }, 4000);

        } catch (err) {
            console.error(err);
            // Erro específico de chave estrangeira (código não existe)
            if(err.code === '23503') {
                 showToast('error', '❌ Erro: O código de parceiro informado não existe.');
            } else {
                 showToast('error', '❌ Erro ao processar. Tente novamente.');
            }
            btnText.textContent = originalText;
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = '1';
        }
    });
}

// ============================================
// 5. CHECKOUT INTELIGENTE (NOVO)
// ============================================
const btnComprar = document.getElementById('btn-comprar');

if (btnComprar) {
    btnComprar.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // 1. Tenta pegar o email do formulário de teste (se o cliente já preencheu)
        // Isso é inteligente: se ele já digitou lá em cima, não perguntamos de novo.
        let emailUsuario = "";
        let nomeUsuario = "Cliente Novo";
        
        const inputEmail = document.getElementById('email');
        const inputNome = document.getElementById('nome');

        if (inputEmail && inputEmail.value) emailUsuario = inputEmail.value;
        if (inputNome && inputNome.value) nomeUsuario = inputNome.value;

        // 2. Se estiver vazio, pede pro usuário agora
        if (!emailUsuario) {
            emailUsuario = prompt("Para gerar seu acesso, precisamos do seu E-mail:");
            if (!emailUsuario) return; // Se ele cancelar, para tudo.
        }

        // Efeito visual (Carregando...)
        const originalHTML = btnComprar.innerHTML;
        btnComprar.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Gerando Cobrança...';
        btnComprar.disabled = true;
        btnComprar.style.opacity = "0.7";

        try {
            // 3. Chama o Robô Gerador de Links
            const response = await fetch('https://ptpdlrlcpdxddqrjpuac.supabase.co/functions/v1/mp-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: emailUsuario,
                    nome: nomeUsuario
                })
            });

            const data = await response.json();

            if (data.url) {
                // 4. Redireciona para o Mercado Pago
                window.location.href = data.url;
            } else {
                alert('Ocorreu um erro ao gerar o link. Tente novamente.');
                console.error(data);
            }

        } catch (error) {
            console.error(error);
            alert('Erro de conexão. Verifique sua internet.');
        } finally {
            // Restaura o botão ao normal
            btnComprar.innerHTML = originalHTML;
            btnComprar.disabled = false;
            btnComprar.style.opacity = "1";
        }
    });
}

function showToast(type, message) {
    if(toast) {
        toast.textContent = message;
        toast.className = `toast ${type} fade-in`; 
        setTimeout(() => { toast.className = 'toast hidden'; }, 4000);
    } else { alert(message); }
}