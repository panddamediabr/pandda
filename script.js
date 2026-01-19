// ============================================
// 1. CONFIGURAÇÃO DO SUPABASE (PANDDA)
// ============================================
const SUPABASE_URL = 'https://ptpdlrlcpdxddqrjpuac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_diYrzfwlDGIAtfRKfHPwIA_X_rwRLjT';

// Cliente renomeado para evitar conflito com a biblioteca global
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// 2. CONTROLE DO FORMULÁRIO (ETAPAS)
// ============================================
const stepStart = document.getElementById('step-start');
const stepApps = document.getElementById('step-apps');
const stepForm = document.getElementById('step-form');

const btnIniciar = document.getElementById('btn-iniciar-teste');
const btnJaInstalei = document.getElementById('btn-ja-instalei');

// Se o script carregou, testamos o botão
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

        if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        if (value.length > 9) {
            value = `${value.slice(0, 10)}-${value.slice(10)}`;
        }
        e.target.value = value;
    });
}

// ============================================
// 4. ENVIO PARA O BANCO DE DADOS
// ============================================
const form = document.getElementById('formTeste');
const toast = document.getElementById('toast');

if(form) {
    const btnSubmit = form.querySelector('button[type="submit"]');
    const btnText = document.getElementById('btn-text');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Feedback visual
        const originalText = btnText.textContent;
        btnText.textContent = 'Enviando...';
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = '0.7';

        // Captura os dados
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const ddi = document.getElementById('pais').value;
        const whatsRaw = document.getElementById('whatsapp').value.replace(/\D/g, '');
        const horario = document.getElementById('horario').value;
        
        // Captura e trata o Cupom
        const cupomElem = document.getElementById('cupom');
        const cupomRaw = cupomElem ? cupomElem.value.trim().toUpperCase() : "";
        const cupomFinal = cupomRaw === "" ? null : cupomRaw;

        // Monta o número completo
        const fullWhatsapp = ddi + whatsRaw;

        // Nome com agendamento
        let nomeFinal = nome;
        if(horario !== 'agora') {
            nomeFinal = `${nome} [Agendado: ${horario}]`;
        }

        try {
            // Validações
            if (whatsRaw.length < 10) throw new Error("WhatsApp incompleto.");

            // CORREÇÃO AQUI: mudamos 'cupom_usado' para 'codigo_usado'
            const { error } = await client
                .from('solicitacoes_teste')
                .insert([
                    {
                        nome: nomeFinal,
                        whatsapp: fullWhatsapp,
                        email: email,
                        codigo_usado: cupomFinal // <--- O nome correto da coluna no banco
                    }
                ]);

            if (error) throw error;

            // Sucesso
            showToast('success', '✅ Solicitação recebida! Aguarde no WhatsApp.');
            form.reset();
            
            // Recarrega após 3s
            setTimeout(() => {
                location.reload(); 
            }, 3000);

        } catch (err) {
            console.error(err);
            // Mensagem de erro mais amigável se for problema de cupom inválido
            if(err.code === '23503') { // Erro de Chave Estrangeira (Cupom não existe)
                 showToast('error', 'Erro: O código de indicação não existe.');
            } else {
                 showToast('error', 'Erro ao enviar. Tente novamente.');
            }
            
            btnText.textContent = originalText;
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = '1';
        }
    });
}

function showToast(type, message) {
    if(toast) {
        toast.textContent = message;
        toast.className = `toast ${type} fade-in`; 
        setTimeout(() => {
            toast.className = 'toast hidden';
        }, 4000);
    } else {
        alert(message);
    }
}