// Vercel Serverless Function — Chat API con IA directa
// No necesita gateway local — conecta directo con NVIDIA/llama

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { mensaje, sessionId } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'Mensaje requerido' });

    // Sistema: Lupe, asistente de la municipalidad de El Colorado, Formosa
    const SYSTEM_PROMPT = `Sos Lupe, el asistente virtual de la Municipalidad de El Colorado, Formosa, Argentina.

Tu rol: IA conversacional que atiende ciudadanos.
Personalidad: Profesional, cálida, directa, sin corporate speak.
Contexto: Pueblo de 18.000 habitantes, municipio de 2ª categoría, zona rural/agroquícola.
Tu jefe: Darío Rial, el creador.
Idiomas: Español (principal), entendés guaraní básico.

Capacidades:
- Responder preguntas sobre trámites municipales
- Guiar sobre requisitos de habilitaciones, reclamos, turnos
- Información sobre horarios, servicios, eventos
- Contexto del proyecto ColoradoIA de modernización municipal

Reglas:
- Respondé en español, de manera concisa y útil
- No inventés datos que no conocés — decí que consultés en la muni
- Si alguien pregunta algo fuera de contexto, redirigí amablemente
- Mantené el tono amigable de pueblo, no burocrático
- Respondé como WhatsApp: mensajes cortos, no párrafos largos

Datos reales de El Colorado:
- 18.201 habitantes (Censo 2022)
- Municipio de 2ª categoría, intendencia de Mario Brignole
- Actividades: agro, ganadería, apicultura, metalurgia
- INTA con estación experimental desde 1981
- E.P.E.T. N.º 4 (escuela técnica)
- Portal: elcolorado.gob.ar
- Ubicado al sureste de Formosa, departamento Pirané
- Acceso por Rutas Provinciales 1, 3 y 9
- Puente Libertad sobre Río Bermejo`;

    if (!global.chatMemory) global.chatMemory = {};
    const sid = sessionId || 'default';
    if (!global.chatMemory[sid]) global.chatMemory[sid] = [];
    global.chatMemory[sid].push({ role: 'user', content: mensaje });

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...global.chatMemory[sid].slice(-10)
    ];

    try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
            },
            body: JSON.stringify({
                model: 'nvidia/llama-3.3-nemotron-70b-instruct',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('NVIDIA API error:', err);
            throw new Error('NVIDIA API error');
        }

        const data = await response.json();
        const respuesta = data.choices?.[0]?.message?.content || 'Recibí tu mensaje. ¿En qué puedo ayudarte?';

        global.chatMemory[sid].push({ role: 'assistant', content: respuesta });

        return res.status(200).json({ respuesta, sessionId: sid });

    } catch (error) {
        console.error('Error completo:', error);

        // Fallback inteligente
        const msg = mensaje.toLowerCase();

        let respuesta = '';

        if (msg.includes('horario') || msg.includes('hora')) {
            respuesta = 'La muni atiende de lunes a viernes de 7:00 a 13:00. ¿Necesitás saber algo más?';
        } else if (msg.includes('trámite') || msg.includes('tramite')) {
            respuesta = 'Los trámites más comunes son: habilitación comercial, permiso de obra, reclamo por servicios. ¿Cuál necesitás? Te digo qué docs necesitás.';
        } else if (msg.includes('reclamo') || msg.includes('queja')) {
            respuesta = 'Podés hacer un reclamo en la muni directamente o por teléfono al 03704. ¿De qué se trata el reclamo?';
        } else if (msg.includes('habilit') || msg.includes('negocio') || msg.includes('comercio')) {
            respuesta = 'Para abrir un negocio necesitás: DNI, comprobante de domicilio, habilitación del local (inspección), y según el rubro maybe algo extra. ¿Qué vas a abrir?';
        } else if (msg.includes('turno') || msg.includes('cita')) {
            respuesta = 'Los turnos se gestionan personalmente en la muni o llamando al 03704. ¿Qué trámite necesitás?';
        } else if (msg.includes('hola') || msg.includes('buenos') || msg.includes('buenas')) {
            respuesta = '¡Hola! Soy Lupe, la asistente virtual de la municipalidad de El Colorado. ¿En qué puedo ayudarte hoy? 😊';
        } else if (msg.includes('intendente') || msg.includes('brignole')) {
            respuesta = 'El/intendente de El Colorado es Mario Brignole. La muni está en Av. 25 de Mayo y Tucumán. ¿Necesitás contactarlos?';
        } else {
            respuesta = 'Recibí tu mensaje. Para consultas específicas sobre trámites, servicios o la muni, estoy para ayudarte. ¿Qué necesitás saber? 🏛️';
        }

        global.chatMemory[sid].push({ role: 'assistant', content: respuesta });

        return res.status(200).json({ respuesta, sessionId: sid, modo: 'fallback' });
    }
};