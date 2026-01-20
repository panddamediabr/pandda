// ============================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ============================================
// Substitua pelas suas chaves reais do painel
const SUPABASE_URL = 'https://ptpdlrlcpdxddqrjpuac.supabase.co';
const SUPABASE_KEY = 'sbp_...'; // Use a chave "anon" (public) aqui
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
// 4. ENVIO DO FORMULÁRIO (TESTE)
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
                    codigo_usado: cupomFinal // Agora envia null se estiver vazio
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

function showToast(type, message) {
    if(toast) {
        toast.textContent = message;
        toast.className = `toast ${type} fade-in`; 
        setTimeout(() => { toast.className = 'toast hidden'; }, 4000);
    } else { alert(message); }
}