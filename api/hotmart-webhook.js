// api/hotmart-webhook.js
// Recebe o webhook da Hotmart e dispara um e-mail transacional IMEDIATO via Resend
// (sem depender do fluxo de e-mail padrão da Hotmart, e sem usar WhatsApp/API paga).
//
// Resend free tier: 3.000 e-mails/mês grátis, 100/dia. Mais que suficiente pra fase de validação.
//
// IMPORTANTE: os nomes de campos abaixo (buyer.email, etc.) seguem o padrão do
// Webhook Hotmart v2.0.0. Use o botão "Testar Webhook" no painel da Hotmart pra
// confirmar o payload real antes de subir pra produção.

export default async function handler(req, res) {
  if (
    process.env.FULLHEAD_ENV !== 'production' ||
    process.env.FULLHEAD_ENABLE_COMMERCE !== 'true'
  ) {
    return res.status(404).json({ error: 'Integração comercial desativada' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // 1. Validação de segurança — o Hottok garante que só a Hotmart pode chamar esse endpoint.
  // Falha fechado: se a variável de ambiente não estiver configurada, rejeita tudo
  // (em vez de deixar passar chamadas sem token por engano).
  if (!process.env.HOTMART_HOTTOK) {
    console.error('HOTMART_HOTTOK não configurado nas variáveis de ambiente');
    return res.status(500).json({ error: 'Webhook mal configurado' });
  }
  const hottokRecebido = req.headers['x-hotmart-hottok'] || req.body?.hottok;
  if (hottokRecebido !== process.env.HOTMART_HOTTOK) {
    console.warn('Hottok inválido recebido');
    return res.status(401).json({ error: 'Hottok inválido' });
  }

  const evento = req.body?.event;

  // 2. Só processa compra aprovada — ignora reembolso, cancelamento, etc.
  if (evento !== 'PURCHASE_APPROVED' && evento !== 'PURCHASE_COMPLETE') {
    return res.status(200).json({ ignored: true, evento });
  }

  const buyer = req.body?.data?.buyer || {};
  const nome = buyer.name || 'Jugador';
  const email = buyer.email;

  if (!email) {
    console.warn('Compra aprovada sem e-mail informado');
    return res.status(200).json({ warning: 'sem email' });
  }

  const linkApp = process.env.APP_LINK; // ex: https://fullhead.app

  // 3. Monta o e-mail (HTML simples, direto ao ponto, sem cara de spam)
  const assunto = '🎯 Tu acceso a FullHead ya está listo';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>¡Hola, ${nome}!</h2>
      <p>Tu compra fue aprobada. Ya puedes entrar a FullHead ahora mismo, directo desde tu navegador — no necesitas descargar nada.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${linkApp}" style="background:#111;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
          ACCEDER AHORA
        </a>
      </p>
      <p><b>Tip:</b> agrega el sitio a tu pantalla de inicio para usarlo como una app.</p>
      <p>Crea tu cuenta con cualquier correo y contraseña para comenzar.</p>
    </div>
  `;

  // 4. Dispara via Resend
  try {
    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM, // ex: 'FullHead <acceso@seudominio.com>'
        to: email,
        subject: assunto,
        html,
      }),
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      console.error('Erro ao enviar e-mail via Resend:', erroTexto);
      return res.status(200).json({ sent: false, error: erroTexto });
    }

    console.log('E-mail de acesso enviado com sucesso para:', email);
    return res.status(200).json({ sent: true, email });
  } catch (err) {
    console.error('Falha na chamada à Resend:', err);
    return res.status(200).json({ sent: false, error: 'Falha na chamada à Resend' });
  }
}
