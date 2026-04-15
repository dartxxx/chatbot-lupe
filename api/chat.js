// Vercel Serverless Function — Chat API con NVIDIA LLaMA
// El HTML llama a /api/chat con { mensaje: "texto", sessionId: "xxx" }
// La función responde con texto de IA directamente (no necesita gateway local)

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { mensaje, sessionId } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'Mensaje requerido' });

    // Sistema: Lupe, asistente de la municipalidad de El Colorado, Formosa
    const SYSTEM = `Sos Lupe, el asistente virtual de la Municipalidad de El Colorado, Formosa, Argentina.

Información del municipio:
- 18.201 habitantes (Censo 2022), +27,9% desde 2010
- Municipio de 2ª categoría, Departamento Pirané
- Intendente: Mario Brignole
- Portal: elcolorado.gob.ar
- Atención: Lunes a viernes 7:00 a 13:00
- Ubicación: Sureste de Formosa, Rutas Provinciales 1, 3 y 9
- Economía: agro, ganadería, apicultura, metalurgia
- INTA estación experimental (desde 1981)
- E.P.E.T. N.º 4 (escuela técnica)
- Puente Libertad sobre Río Bermejo

Tu rol: IA conversacional que atiende ciudadanos del pueblo.
Tono: Cálido, directo, pueblo, sin hablar como burócrata.
Reglas: respondé corto tipo WhatsApp, no párrafos largos.
Si no sabés algo, decí que consulten en la munidirectamente.
Tu creador: Darío Rial, técnico en redes e IA.`;

    // Memoria de conversación por sesión
    if (!global.chatMemory) global.chatMemory = {};
    const sid = sessionId || 'default';
    if (!global.chatMemory[sid]) global.chatMemory[sid] = [];

    global.chatMemory[sid].push({ role: 'user', content: mensaje });

    const messages = [
        { role: 'system', content: SYSTEM },
        ...global.chatMemory[sid].slice(-8)
    ];

    try {
        // Llamar a NVIDIA LLaMA directamente
        const apiKey = process.env.NVIDIA_API_KEY;
        if (!apiKey) {
            throw new Error('NVIDIA_API_KEY no configurada');
        }

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'meta/llama-3.3-70b-instruct',
                messages: messages,
                max_tokens: 400,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('NVIDIA error:', err);
            throw new Error('NVIDIA API error');
        }

        const data = await response.json();
        const respuesta = data.choices?.[0]?.message?.content?.trim() || 'Recibí tu mensaje. ¿En qué puedo ayudarte?';

        global.chatMemory[sid].push({ role: 'assistant', content: respuesta });

        return res.status(200).json({ respuesta, sessionId: sid });

    } catch (error) {
        console.error('Error:', error.message);

        // Fallback inteligente si NVIDIA falla
        const msg = mensaje.toLowerCase();
        let respuesta = '';

        if (msg.includes('hola') || msg.includes('buenos') || msg.includes('buenas') || msg.includes('buen día')) {
            respuesta = '¡Hola! Soy Lupe, la asistente virtual de la muni de El Colorado 😊 ¿En qué te puedo ayudar?';
        } else if (msg.includes('horario') || msg.includes('hora') || msg.includes('atienden')) {
            respuesta = 'La muni atiende de lunes a viernes de 7:00 a 13:00. ¿Necesitás algo más?';
        } else if (msg.includes('trámite') || msg.includes('tramite') || msg.includes('documento')) {
            respuesta = 'Los trámites más comunes son: habilitación comercial, permiso de obra, y reclamos. ¿Cuál necesitás? Te digo quédocs necesitás.';
        } else if (msg.includes('reclamo') || msg.includes('queja') || msg.includes('problema')) {
            respuesta = 'Podés hacer un reclamo yendo a la muni o llamando. ¿De qué se trata el problema?';
        } else if (msg.includes('habilit') || msg.includes('negocio') || msg.includes('comercio') || msg.includes('abrir')) {
            respuesta = 'Para abrir un negocio necesitás: DNI, comprobante de domicilio, habilitación del local. ¿Qué vas a abrir?';
        } else if (msg.includes('turno') || msg.includes('cita') || msg.includes('agenda')) {
            respuesta = 'Los turnos se gestionan personalmente en la muni o llamando. ¿Qué trámite necesitás?';
        } else if (msg.includes('intendente') || msg.includes('brignole')) {
            respuesta = 'El/intendente de El Colorado es Mario Brignole. La muni está en Av. 25 de Mayo y Tucumán.';
        } else if (msg.includes('dirección') || msg.includes('ubicación') || msg.includes('donde queda')) {
            respuesta = 'La muni está en Av. 25 de Mayo y Tucumán, El Colorado. También podés llamar por teléfono.';
        } else if (msg.includes('teléfono') || msg.includes('telefono') || msg.includes('llamar')) {
            respuesta = 'Podés llamar a la muni por teléfono. ¿Necesitás el número? Consultá en el 03704 o en elcolorado.gob.ar';
        } else if (msg.includes('población') || msg.includes('habitantes') || msg.includes('cuántos')) {
            respuesta = 'El Colorado tiene 18.201 habitantes según el censo 2022. Es el municipio más grande del dpto. Pirané.';
        } else {
            respuesta = 'Recibí tu mensaje. Para consultas sobre trámites, horarios o servicios de la muni, estoy para ayudarte. ¿Qué necesitás saber? 🏛️';
        }

        global.chatMemory[sid].push({ role: 'assistant', content: respuesta });

        return res.status(200).json({ respuesta, sessionId: sid, modo: 'fallback' });
    }
};