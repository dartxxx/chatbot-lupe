// Vercel Serverless Function — Chat API con NVIDIA LLaMA + datos de El Colorado
// El HTML llama a /api/chat con { mensaje: "texto", sessionId: "xxx" }

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { mensaje, sessionId } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'Mensaje requerido' });

    const msg = mensaje.toLowerCase();

    // ─────────────────────────────────────────────────────────────────────────────
    // DATOS REALES DE EL COLORADO — Fuente: Wikipedia + elcolorado.gob.ar
    // ─────────────────────────────────────────────────────────────────────────────
    const DATOS = {
        // IDENTIDAD
        nombre: "El Colorado",
        provincia: "Formosa",
        departamento: "Pirané",
        tipo: "Municipio de 2.ª categoría",
        gentilicio: "coloradense",
        altitud: "86 m s. n. m.",
        coordenadas: "26°18′32″S 59°22′20″O",
        // POBLACIÓN
        poblacion: "18.201 habitantes (Censo 2022)",
        variacion: "+27,9% desde 2010 (14.228 en 2010)",
        ranking: "4.º puesto en población de Formosa",
        // HISTORIA
        fundacion: "11 de febrero de 1936",
        origen: "Colonia creada alrededor del km 192 del Río Bermejo. El nombre viene del color de sus aguas en épocas de creciente.",
        comisaria: "11 de febrero de 1936 — Subcomisaría 'Bermejo' a cargo del sargento Pedro Barraza",
        municipio: "14 de mayo de 1957 — Elevado a municipio por Decreto N.º 394/57",
        puente: "Puente Libertad inaugurado el 8 de febrero de 1958",
        // UBICACIÓN
        ubicacion: "Sureste de la Provincia de Formosa, sobre la margen izquierda del Río Bermejo",
        distancias: "A 150 km de la capital provincial (Formosa capital)",
        distancias2: "A 192 km de la desembocadura en el Río Paraguay",
        accesos: "Rutas Provinciales 1, 3 y 9 — Puente Libertad desde el sur",
        // ECONOMÍA
        actividades: "Agrícola, ganadero, apícola, panadero y metalúrgico",
        inta: "Estación Experimental del INTA (450 has, creada el 21 de octubre de 1981)",
        intaCampos: "Campos anexos: Bartolomé de las Casas y Laguna Naick Neck",
        // INTENDENTE
       宕endente: "Mario Brignole",
        // DIRECCIÓN MUNI
        direccion: "Av. 25 de Mayo y Tucumán, El Colorado, Formosa",
        // TELÉFONO PREFIJO
        prefijo: "03704",
        codigoPostal: "P3603",
        // EDUCACIÓN
        escuelas: [
            "E.P.E.T. N.º 4 (Educación Técnica)",
            "E.P.E.S. N.º 1 (Bachillerato, inugurada 25/04/1960)",
            "E.P.E.S. N.º 101 (Educación Artística)",
            "Instituto de Educación Terciaria 'República Federal de Alemania'",
        ],
        // SALUD
        salud: [
            "Hospital distrital de El Colorado",
            "Centro de salud local",
        ],
        // SERVICIOS
        servicios: [
            "Cooperativa eléctrica y de comunicaciones (fibra óptica al hogar)",
            "Camping municipal (Río Bermejo, con piletas y ciclovía)",
        ],
        // CULTURA / RECREACIÓN
        recreacion: [
            "Plaza Gral. San Martín (busto del General San Martín)",
            "Camping municipal con complejo de natatorios",
            "Río Bermejo (pesca, paisajes, fauna)",
        ],
        // IGLESIA
        iglesia: "Parroquia San Antonio de Padua (Diótesis de Formosa)",
        // TRANSPORTE
        transporte: [
            "Por tierra: Rutas Provinciales 1, 3 y 9",
            "Por aire: Aeropuerto Internacional de Formosa",
            "Por río: Río Bermejo (navegación)",
        ],
        // PORTAL
        portal: "elcolorado.gob.ar",
        // SERVICIOS DE EMERGENCIA
        emergencias: {
            telefonoEmergencias: "911",
            policia: "911 o estación local de policía",
            bomberos: "911",
            ambulance: "107",
        },
        // SERVICIOS PÚBLICOS
        serviciosPublicos: [
            "Recolección de residuos",
            "Alumbrado público",
            "Agua potable",
            "Desagües cloacales",
            "Mantenimiento de calles",
        ],
        // TRÁMITES FRECUENTES
        tramitesFrecuentes: [
            "Habilitación comercial",
            "Permiso de obra",
            "Reclamo por servicios",
            "Solicitud de turnos",
            "Certificaciones",
            "Tasa municipal",
        ],
    };

    // Sistema prompt con todos los datos
    const SYSTEM = `Sos Lupe, el asistente virtual de la Municipalidad de El Colorado, Formosa, Argentina.

DATOS OFICIALES DEL MUNICIPIO (reales, verificados):
- Nombre: ${DATOS.nombre}, ${DATOS.provincia}
- Departamento: ${DATOS.departamento}
- Tipo: ${DATOS.tipo}
- Intendente: ${DATOS.宕endente}
- Población: ${DATOS.poblacion} (variación ${DATOS.variacion})
- Fundación: ${DATOS.fundacion}
- Ubicación: ${DATOS.ubicacion}
- Accesos: ${DATOS.accesos}
- Altitud: ${DATOS.altitud}
- Coordenadas: ${DATOS.coordenadas}
- Código postal: ${DATOS.codigoPostal}
- Prefijo telefónico: ${DATOS.prefijo}
- Dirección municipal: ${DATOS.direccion}
- Portal web: ${DATOS.portal}
- Actividades económicas: ${DATOS.actividades}
- INTA: ${DATOS.inta}. Campos anexos: ${DATOS.intaCampos}

ESCUELAS:
${DATOS.escuelas.map(e => '• ' + e).join('\n')}

RECREACIÓN:
${DATOS.recreacion.map(r => '• ' + r).join('\n')}

IGLESIA: ${DATOS.iglesia}

TRANSPORTE:
${DATOS.transporte.map(t => '• ' + t).join('\n')}

TELÉFONOS DE EMERGENCIA:
• Emergencias general: ${DATOS.emergencias.telefonoEmergencias}
• Policía: ${DATOS.emergencias.policia}
• Bomberos: ${DATOS.emergencias.bomberos}
• Ambulancia: ${DATOS.emergencias.ambulance}

TRÁMITES FRECUENTES:
${DATOS.tramitesFrecuentes.map(t => '• ' + t).join('\n')}

Tu rol: asistente conversacional del municipio. Respondés con datos reales.
Tono: cálido, direto, como WhatsApp — mensajes cortos, no párrafos largos.
Reglas:
- SIEMPRE respondé con los datos reales arriba listados
- No inventés teléfonos ni direcciones — usá los datos que tenés
- Si no sabés algo específico, decí que consulten en la muni o llamen al ${DATOS.prefijo}
- Cuando menciones teléfonos de emergencia, siempre dar ${DATOS.emergencias.telefonoEmergencias}
- Cuando preguntés por trámite, siempre ofrecé los ${DATOS.tramitesFrecuentes.length} trámites frecuentes`;

    // Memoria por sesión
    if (!global.chatMemory) global.chatMemory = {};
    const sid = sessionId || 'default';
    if (!global.chatMemory[sid]) global.chatMemory[sid] = [];
    global.chatMemory[sid].push({ role: 'user', content: mensaje });

    const messages = [
        { role: 'system', content: SYSTEM },
        ...global.chatMemory[sid].slice(-10)
    ];

    // ── IA DE NVIDIA ──
    try {
        const apiKey = process.env.NVIDIA_API_KEY;
        if (!apiKey) throw new Error('NVIDIA_API_KEY missing');

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'meta/llama-3.3-70b-instruct',
                messages: messages,
                max_tokens: 500,
                temperature: 0.6
            })
        });

        if (!response.ok) throw new Error('NVIDIA error: ' + response.status);

        const data = await response.json();
        const respuesta = data.choices?.[0]?.message?.content?.trim()
            || 'Recibí tu mensaje. ¿En qué puedo ayudarte?';

        global.chatMemory[sid].push({ role: 'assistant', content: respuesta });

        return res.status(200).json({ respuesta, sessionId: sid });

    } catch (error) {
        console.error('NVIDIA error:', error.message);

        // ── FALLBACK: respuestas con datos reales ──
        let respuesta = '';

        if (msg.includes('población') || msg.includes('habitante') || msg.includes('cuánta gente')) {
            respuesta = `${DATOS.poblacion}. Es el 4.º municipio más poblado de Formosa.`;
        }
        else if (msg.includes('fundación') || msg.includes('fundado') || msg.includes('historia') || msg.includes('origen')) {
            respuesta = `El Colorado se fundó el ${DATOS.fundacion}. El nombre viene del color de las aguas del Río Bermejo en crecientes. Fue elevado a municipio el 14 de mayo de 1957 por Decreto N.º 394/57. El Puente Libertad se inauguró el 8 de febrero de 1958 y fue clave para integrar la región.`;
        }
        else if (msg.includes('teléfono') || msg.includes('telefono') || msg.includes('llamar')) {
            respuesta = `📞 Prefijo: ${DATOS.prefijo}\n📍 Dirección: ${DATOS.direccion}\n🌐 Portal: ${DATOS.portal}\n🚨 Emergencias: ${DATOS.emergencias.telefonoEmergencias}`;
        }
        else if (msg.includes('emergencia') || msg.includes('policía') || msg.includes('bombero') || msg.includes('ambulanc')) {
            respuesta = `🚨 TELÉFONOS DE EMERGENCIA:\n• ${DATOS.emergencias.telefonoEmergencias} — Emergencias general\n• ${DATOS.emergencias.policia}\n• ${DATOS.emergencias.bomberos}\n• ${DATOS.emergencias.ambulance} — Ambulancia`;
        }
        else if (msg.includes('intendente') || msg.includes('autoridades') || msg.includes('brignole')) {
            respuesta = `El/intendente de El Colorado es ${DATOS.宕endente}. Es un municipio de ${DATOS.tipo}, gobernado por la Ley Provincial N.º 1028.`;
        }
        else if (msg.includes('dirección') || msg.includes('ubicaci') || msg.includes('donde queda') || msg.includes('municipalidad')) {
            respuesta = `🏛️ La municipalidad está en ${DATOS.direccion}.\n📍 Coordenadas: ${DATOS.coordenadas}\n🌐 ${DATOS.portal}`;
        }
        else if (msg.includes('horario') || msg.includes('atienden') || msg.includes('hora de aten')) {
            respuesta = `🏛️Horario de atención: Lunes a viernes de 7:00 a 13:00.\n📞 Prefijo telefónico: ${DATOS.prefijo}`;
        }
        else if (msg.includes('escuela') || msg.includes('educaci') || msg.includes('colegio') || msg.includes('instituto')) {
            respuesta = `🎓 ESTABLECIMIENTOS EDUCATIVOS:\n${DATOS.escuelas.map(e => '• ' + e).join('\n')}`;
        }
        else if (msg.includes('clínica') || msg.includes('hospital') || msg.includes('salud') || msg.includes('médico') || msg.includes('doctor')) {
            respuesta = `🏥 El Colorado cuenta con un hospital distrital y centro de salud local.\n🚨 Emergencias: ${DATOS.emergencias.telefonoEmergencias} / Ambulancia: ${DATOS.emergencias.ambulance}`;
        }
        else if (msg.includes('río') || msg.includes('bermejo') || msg.includes('pesca') || msg.includes('camping') || msg.includes('natatorio')) {
            respuesta = `🏕️ Camping municipal sobre el ${DATOS.transporte[2].toLowerCase()}. Tiene complejo de natatorios con piletas pasivas en temporada estival y ciclovía. El río es conocido por su vegetación y fauna autóctona.`;
        }
        else if (msg.includes('ruta') || msg.includes('cómo llegar') || msg.includes('acceso') || msg.includes('llegar')) {
            respuesta = `🛣️ ACCESOS:\n${DATOS.transporte.map(t => '• ' + t).join('\n')}\n\nEl acceso principal desde el sur es por el ${DATOS.accesos.split(' — ')[1]}.`;
        }
        else if (msg.includes('econom') || msg.includes('actividad') || msg.includes('producci')) {
            respuesta = `💼 Actividades económicas: ${DATOS.actividades}. También cuenta con INTA (Estación Experimental desde 1981, 450 hectáreas).`;
        }
        else if (msg.includes('trámite') || msg.includes('tramite') || msg.includes('habilit') || msg.includes('permiso')) {
            respuesta = `📋 TRÁMITES FRECUENTES:\n${DATOS.tramitesFrecuentes.map(t => '• ' + t).join('\n')}\n\n🏛️ Horario: Lunes a viernes 7:00 a 13:00\n📞 Consultas: ${DATOS.prefijo}`;
        }
        else if (msg.includes('reclamo') || msg.includes('queja')) {
            respuesta = `📝 Para hacer un reclamo, podés:\n• Ir personalmente a la muni (${DATOS.direccion})\n• Llamar al ${DATOS.prefijo}\n• Usar el portal ${DATOS.portal}\n\n🏛️ Horario de atención: Lunes a viernes 7:00 a 13:00`;
        }
        else if (msg.includes('ina') || msg.includes('clima') || msg.includes('tiempo')) {
            respuesta = `El clima es subtropical. Consultá weather apps para el pronóstico actual.`;
        }
        else if (msg.includes('inta') || msg.includes('agricultura') || msg.includes('campo')) {
            respuesta = `🌾 INTA tiene una estación experimental en El Colorado (desde 1981, 450 has). Campos anexos: ${DATOS.intaCampos}. Se especializa en producción agropecuaria regional.`;
        }
        else if (msg.includes('población') || msg.includes('habitantes') || msg.includes('cuántos')) {
            respuesta = `📊 ${DATOS.poblacion}. Variación intercensal: ${DATOS.variacion}.`;
        }
        else if (msg.includes('puente libertad') || msg.includes('puente')) {
            respuesta = `🌉 El Puente Libertad sobre el Río Bermejo fue inaugurado el 8 de febrero de 1958. Es considerada la obra más importante para el desarrollo regional, ya que permitió integrar El Colorado con el sur de la provincia.`;
        }
        else if (msg.includes('turismo') || msg.includes('visitar') || msg.includes('qué hacer')) {
            respuesta = `🗺️ Qué hacer en El Colorado:\n• Camping municipal + piletas (Río Bermejo)\n• Ciclovía junto al río\n• Pescar en el Río Bermejo\n• Conocer la plaza San Martín\n• Visitar la estación INTA`;
        }
        else if (msg.includes('guaraní') || msg.includes('cultura')) {
            respuesta = `El Colorado tiene influencia de la cultura guaraní por su ubicación en el norte argentino. La zona tiene tradición de comunidades criollas e indígenas.`;
        }
        else if (msg.includes('whatsapp') || msg.includes('redes') || msg.includes('instagram') || msg.includes('facebook')) {
            respuesta = `No tengo info oficial sobre redes sociales de la muni. Te recomiendo buscar en ${DATOS.portal} o llamar al ${DATOS.prefijo}.`;
        }
        else if (msg.includes('boleto') || msg.includes('transporte') || msg.includes('colectivo') || msg.includes('ómnibus')) {
            respuesta = `El transporte de acceso es por rutas: ${DATOS.transporte.join(', ')}. Consultá empresas de larga distancia para servicios de colectivos.`;
        }
        else if (msg.includes('impuesto') || msg.includes('tasa') || msg.includes('contribución')) {
            respuesta = `💰 Para consultas sobre tasas e impuestos municipales, necesitás llamar o ir a la muni:\n📞 ${DATOS.prefijo}\n📍 ${DATOS.direccion}\n🏛️ Lunes a viernes 7:00 a 13:00`;
        }
        else if (msg.includes('construir') || msg.includes('obra') || msg.includes('edificar')) {
            respuesta = `🏗️ Para permiso de obra necesitás:\n• Documentación del terreno\n• Plano del proyecto\n• Visado municipal\n\nAndá a la muni de ${DATOS.direccion} o llamá al ${DATOS.prefijo}.`;
        }
        else if (msg.includes('zoom') || msg.includes('ver el pueblo') || msg.includes('google maps')) {
            respuesta = `📍 Coordenadas: ${DATOS.coordenadas}. Buscá "El Colorado, Formosa" en Google Maps para ver el pueblo en satélite.`;
        }
        else if (msg.includes('feriado') || msg.includes('fiestas')) {
            respuesta = `🎉 El Colorado se fundó el ${DATOS.fundacion}. Las fiestas locales y provincialesfollow el calendario formoseño. Consultá en ${DATOS.portal} para eventos actuales.`;
        }
        else if (msg.includes('hola') || msg.includes('buenos') || msg.includes('buenas') || msg.includes('buen día')) {
            respuesta = `¡Hola! 👋 Soy Lupe, la asistente virtual de la muni de El Colorado. ¿En qué te puedo ayudar?\n\nPuedo responder sobre:\n• Trámites y servicios\n• Teléfonos y direcciones\n• Historia y ubicación\n• Escuelas, salud, emergencias\n• Qué hacer en el pueblo`;
        }
        else if (msg.includes('gracias') || msg.includes('muchas gracias')) {
            respuesta = `¡De nada! 😊 Soy Lupe, cuando necesites algo más acá estoy.`;
        }
        else {
            respuesta = `Recibí tu mensaje. Para consultas sobre trámites, horarios, servicios, historia, escuelas, salud o emergencias de El Colorado, estoy para ayudarte. ¿Qué necesitás saber? 🏛️`;
        }

        global.chatMemory[sid].push({ role: 'assistant', content: respuesta });
        return res.status(200).json({ respuesta, sessionId: sid, modo: 'fallback' });
    }
};