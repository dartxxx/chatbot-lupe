// Vercel Serverless Function — API de Chat con Lupe
// El HTML llama a /api/chat con { mensaje: "texto" }
// Esta función lo envía al gateway de OpenClaw y devuelve la respuesta de Lupe

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { mensaje, sessionId } = req.body;

    if (!mensaje) {
        return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Guardar mensaje en memoria temporal (sesión simple)
    if (!global.chatSessions) global.chatSessions = {};
    if (!global.chatSessions[sessionId]) global.chatSessions[sessionId] = [];

    const session = global.chatSessions[sessionId];
    session.push({ role: 'user', content: mensaje });

    try {
        // Llamar al gateway de OpenClaw via RPC
        // El gateway corre en 127.0.0.1:18789
        const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:18789';
        const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

        const response = await fetch(`${GATEWAY_URL}/rpc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GATEWAY_TOKEN}`
            },
            body: JSON.stringify({
                method: 'agent.send',
                params: {
                    agentId: 'main',
                    message: mensaje,
                    sessionKey: sessionId || 'web-chat-' + Date.now()
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gateway error: ${response.status}`);
        }

        const data = await response.json();
        const respuesta = data.result?.text || data.result || 'Estoy procesando tu mensaje...';

        // Guardar respuesta en sesión
        session.push({ role: 'assistant', content: respuesta });

        return res.status(200).json({
            respuesta: respuesta,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Error:', error);

        // Fallback: respuesta simulada si el gateway no está accesible
        const respuestasDemo = [
            "Recibí tu mensaje. Estoy aquí para ayudarte con consultas sobre la municipalidad de El Colorado. ¿Qué necesitás saber?",
            "Perfecto, tu mensaje llegó. Podés preguntarme sobre trámites, horarios de atención, cómo hacer reclamos, o información sobre servicios municipales.",
            "¡Hola! Soy Lupe, tu asistente virtual. Estoy en línea y lista para ayudarte. ¿En qué puedo asistirte hoy?",
            "Tu consulta fue recibida. Para información sobre turnos, requisits de trámites o estado de expedientes, estoy a tu disposición."
        ];
        const respuestaDemo = respuestasDemo[Math.floor(Math.random() * respuestasDemo.length)];

        session.push({ role: 'assistant', content: respuestaDemo });

        return res.status(200).json({
            respuesta: respuestaDemo,
            sessionId: sessionId,
            modo: 'demo'
        });
    }
};