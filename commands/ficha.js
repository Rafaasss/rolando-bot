const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder 
} = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// --- CONFIGURAÇÕES E MAPAS ---
const PERICIAS_FISICAS = {
    "Acrobacia º": "forca", "Atletismo": "forca", "Luta": "forca",
    "Cavalgar": "destreza", "Furtividade º": "destreza", "Iniciativa": "destreza", 
    "Ladinagem *º": "destreza", "Pontaria": "destreza", "Reflexos": "destreza",
    "Fortitude": "constituicao"
};
const PERICIAS_MENTAIS = {
    "Conhecimento *": "inteligencia", "Guerra *": "inteligencia", "Investigação": "inteligencia", 
    "Misticismo *": "inteligencia", "Natureza": "inteligencia", "Nobreza *": "inteligencia", 
    "Ofício *": "inteligencia", "Religião *": "inteligencia", "Vontade": "inteligencia",
    "Adestrar Animais *": "sabedoria", "Conjuração": "sabedoria", "Intuição": "sabedoria", 
    "Medicina": "sabedoria", "Percepção": "sabedoria", "Sobrevivência": "sabedoria",
    "Atuação *": "carisma", "Diplomacia": "carisma", "Enganação": "carisma", 
    "Intimidação": "carisma", "Jogatina *": "carisma"
};
const MAPA_TOTAL = { ...PERICIAS_FISICAS, ...PERICIAS_MENTAIS };

// --- MAPA DE APELIDOS PARA ATRIBUTOS ---
const ALIAS_ATRIBUTOS = {
    "forca": "forca", "força": "forca", "for": "forca",
    "destreza": "destreza", "des": "destreza",
    "constituicao": "constituicao", "constituição": "constituicao", "con": "constituicao", "cons": "constituicao",
    "inteligencia": "inteligencia", "inteligência": "inteligencia", "int": "inteligencia",
    "sabedoria": "sabedoria", "sab": "sabedoria",
    "carisma": "carisma", "car": "carisma"
};

// --- FUNÇÃO AUXILIAR: CALCULAR TOTAL ---
function calcularPericia(dados, nomePericia) {
    const atributoChave = MAPA_TOTAL[nomePericia];
    
    const valorPontos = dados.pontosPericia?.[nomePericia] || 0; 
    const modAtributo = dados.atributos[atributoChave] || 0;     
    const bonusTreino = dados.periciasTreinadas.includes(nomePericia) ? 3 : 0; 

    return {
        total: valorPontos + modAtributo + bonusTreino,
        detalhes: `${valorPontos} (Pts) + ${modAtributo} (${atributoChave.substr(0,3).toUpperCase()}) + ${bonusTreino} (Tr)`
    };
}

// --- FUNÇÃO AUXILIAR: PROCESSAR PARÂMETROS (--) ---
function processarEntrada(textoBruto) {
    if (!textoBruto.includes('--')) return { nome: textoBruto.trim(), params: {} };
    const partes = textoBruto.split('--');
    const params = {};
    partes[1].split(';').forEach(p => {
        const pedaco = p.trim();
        const espaco = pedaco.indexOf(' ');
        if (espaco > -1) params[pedaco.substring(0, espaco).toLowerCase()] = pedaco.substring(espaco + 1).trim();
    });
    return { nome: partes[0].trim(), params };
}

// --- FUNÇÃO AUXILIAR: SINCRONIZAR ---
async function sincronizarFicha(userId) {
    const ativa = await db.get(`ficha_${userId}`);
    if (!ativa) return; 

    // MUDANÇA: Agora sincroniza com o banco GERAL
    let banco = await db.get(`banco_fichas_geral`) || [];
    banco = banco.filter(f => f.nome !== ativa.nome); 
    banco.push(ativa); 
    await db.set(`banco_fichas_geral`, banco);
}

// --- 1. COMANDO PRINCIPAL (!ficha) ---
async function comandoFicha(message) {
    const args = message.content.split(' ');
    const opcao = args[1] ? args[1].toLowerCase() : 'basico';
    const inputUsuario = args.slice(2).join(' ');
    const userId = message.author.id;
    
    const chaveAtiva = `ficha_${userId}`; // A ficha que EU estou jogando (Pessoal)
    const chaveBanco = `banco_fichas_geral`; // Onde as fichas ficam guardadas (Público)

    // --- COMANDO: ADD / CRIAR ---
    if (opcao === 'add' || opcao === 'criar') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_abrir_form_add').setLabel('➕ Criar Nova Ficha').setStyle(ButtonStyle.Success)
        );
        return message.reply({ content: 'Para adicionar um novo personagem ao Banco Público, clique abaixo:', components: [row] });
    }

    // --- COMANDO: LISTA ---
    if (opcao === 'lista' || opcao === 'listar') {
        const banco = await db.get(chaveBanco) || [];
        if (banco.length === 0) return message.reply("📭 O banco de fichas está vazio. Use `!ficha add`.");
        
        const nomes = banco.map(f => `• **${f.nome}** (Nvl ${f.nivel} ${f.racaClasse})`).join('\n');
        const ativa = await db.get(chaveAtiva);
        return message.reply({ embeds: [new EmbedBuilder().setColor(0x0099FF).setTitle('📂 Banco de Personagens (Público)').setDescription(nomes).setFooter({ text: `Jogando como: ${ativa ? ativa.nome : 'Ninguém'}` })] });
    }

    // --- COMANDO: LOGIN ---
    if (opcao === 'login') {
        const banco = await db.get(chaveBanco) || [];
        if (banco.length === 0) return message.reply("❌ Não existem fichas salvas! Use `!ficha add` primeiro.");

        const select = new StringSelectMenuBuilder()
            .setCustomId('menu_login_ficha')
            .setPlaceholder('Selecione o personagem...');

        // Limita a 25 para não quebrar o menu
        banco.slice(0, 25).forEach(f => {
            select.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(f.nome)
                .setDescription(`Nvl ${f.nivel} - ${f.racaClasse}`)
                .setValue(f.nome)
            );
        });

        const row = new ActionRowBuilder().addComponents(select);
        return message.reply({ content: '🔑 **Login Público (Qualquer um pode usar):**', components: [row] });
    }

    // --- COMANDO: DEL ---
    if (opcao === 'del' || opcao === 'deletar') {
        const banco = await db.get(chaveBanco) || [];
        if (banco.length === 0) return message.reply("❌ Banco vazio.");

        const select = new StringSelectMenuBuilder()
            .setCustomId('menu_del_ficha')
            .setPlaceholder('Selecione para EXCLUIR...')
            .addOptions(banco.slice(0, 25).map(f => 
                new StringSelectMenuOptionBuilder().setLabel(f.nome).setValue(f.nome).setEmoji('🗑️')
            ));

        const row = new ActionRowBuilder().addComponents(select);
        return message.reply({ content: '⚠️ **Cuidado! Isso apagará a ficha do Banco Público:**', components: [row] });
    }

    // --- COMANDO: RESETAR ---
    if (opcao === 'resetar') {
        await db.delete(chaveAtiva);
        await db.delete(chaveBanco);
        return message.reply("☢️ Reset total concluído.");
    }

    // --- VERIFICAÇÃO DE SEGURANÇA ---
    const dados = await db.get(chaveAtiva);
    if (!dados) return message.reply("❌ Nenhuma ficha logada! Use `!ficha login` para entrar em um personagem do banco.");

    // Garante Arrays e Objetos Novos
    if (!Array.isArray(dados.inventario)) dados.inventario = [];
    if (!Array.isArray(dados.habilidades)) dados.habilidades = [];
    if (!dados.pontosPericia) dados.pontosPericia = {}; 

    // --- COMANDO: DEFINIR VALOR DA PERÍCIA ---
    if (opcao === 'pericia' || opcao === 'pontos') {
        const valor = parseInt(args[args.length - 1]);
        const nomeArgs = args.slice(2, args.length - 1).join(' '); 
        const nomeReal = Object.keys(MAPA_TOTAL).find(k => k.toLowerCase() === nomeArgs.toLowerCase());

        if (!nomeReal || isNaN(valor)) {
            return message.reply("⚠️ Uso correto: `!ficha pericia [Nome] [Valor]`\nEx: `!ficha pericia Luta 2`");
        }

        dados.pontosPericia[nomeReal] = valor;
        await db.set(chaveAtiva, dados);

        const calc = calcularPericia(dados, nomeReal);
        return message.reply(`✅ **${nomeReal}** atualizada!\nPontos: **${valor}** | Total na Rolagem: **${calc.total}**`);
    }

    // --- COMANDO: DEFINIR VALOR DE ATRIBUTO ---
    if (opcao === 'atributo' || opcao === 'attr') {
        const valor = parseInt(args[args.length - 1]);
        const nomeInput = args.slice(2, args.length - 1).join(' ').toLowerCase();
        const chaveAttr = ALIAS_ATRIBUTOS[nomeInput];

        if (!chaveAttr || isNaN(valor)) {
            return message.reply("⚠️ Uso correto: `!ficha atributo [Nome] [Valor]`\nEx: `!ficha atributo Força 3` ou `!ficha atributo Des 5`");
        }
        dados.atributos[chaveAttr] = valor;
        await db.set(chaveAtiva, dados);
        return message.reply(`💪 **${chaveAttr.toUpperCase()}** atualizado para **${fmt(valor)}**!`);
    }

    // --- ADIÇÃO DE ITEM ---
    if (opcao === 'item') {
        if (!inputUsuario) return message.reply("⚠️ Ex: `!ficha item Espada -- q 1`");
        const { nome, params } = processarEntrada(inputUsuario);
        dados.inventario.push({ nome, desc: params['d'] || "", quant: params['q'] || "1", bonus: params['b'] || "" });
        await db.set(chaveAtiva, dados); 
        return message.reply(`🎒 **${nome}** adicionado!`);
    }

    // --- ADIÇÃO: HABILIDADE (Tipo: Habilidade) ---
    if (opcao === 'habilidade') {
        if (!inputUsuario) return message.reply("⚠️ Ex: `!ficha habilidade Ataque Duplo -- c 2 MP`");
        const { nome, params } = processarEntrada(inputUsuario);
        dados.habilidades.push({ nome, desc: params['d'] || "", custo: params['c'] || "", tipo: 'Habilidade' });
        await db.set(chaveAtiva, dados);
        return message.reply(`⚔️ Habilidade **${nome}** aprendida!`);
    }

    // --- ADIÇÃO: MAGIA (Tipo: Magia) ---
    if (opcao === 'magia') {
        if (!inputUsuario) return message.reply("⚠️ Ex: `!ficha magia Bola de Fogo -- c 5 MP`");
        const { nome, params } = processarEntrada(inputUsuario);
        dados.habilidades.push({ nome, desc: params['d'] || "", custo: params['c'] || "", tipo: 'Magia' });
        await db.set(chaveAtiva, dados);
        return message.reply(`🔮 Magia **${nome}** aprendida!`);
    }

    // --- ADIÇÃO: DEFEITO (Tipo: Defeito) ---
    if (opcao === 'defeito') {
        if (!inputUsuario) return message.reply("⚠️ Ex: `!ficha defeito Manco -- d -2 Deslocamento`");
        const { nome, params } = processarEntrada(inputUsuario);
        dados.habilidades.push({ nome, desc: params['d'] || "", custo: "", tipo: 'Defeito' });
        await db.set(chaveAtiva, dados);
        return message.reply(`🩸 Defeito **${nome}** adquirido.`);
    }

    // --- REMOÇÃO ---
    if (opcao === 'remover') {
        const cat = args[2] ? args[2].toLowerCase() : null;
        const alvo = args.slice(3).join(' ');
        if (!cat || !alvo) return message.reply("⚠️ Ex: `!ficha remover item Espada`");

        if (cat === 'item') {
            dados.inventario = dados.inventario.filter(i => i.nome.toLowerCase() !== alvo.toLowerCase());
            await db.set(chaveAtiva, dados);
            return message.reply(`🗑️ Item **${alvo}** removido.`);
        }
        
        if (['habilidade', 'magia', 'defeito'].includes(cat)) {
            dados.habilidades = dados.habilidades.filter(h => h.nome.toLowerCase() !== alvo.toLowerCase());
            await db.set(chaveAtiva, dados);
            return message.reply(`🗑️ ${cat.charAt(0).toUpperCase() + cat.slice(1)} **${alvo}** removido(a).`);
        }

        if (cat === 'treinar') {
            dados.periciasTreinadas = dados.periciasTreinadas.filter(p => p.toLowerCase() !== alvo.toLowerCase());
            await db.set(chaveAtiva, dados);
            return message.reply(`📉 Treino em **${alvo}** removido.`);
        }
    }

    // --- HP / MP ---
    if (opcao === 'hp') {
        const val = parseInt(args[2]);
        if (isNaN(val)) return;
        let n = dados.recursos.hpAtual + val;
        if (n > dados.recursos.hpTotal) n = dados.recursos.hpTotal; if (n < 0) n = 0;
        await db.set(`${chaveAtiva}.recursos.hpAtual`, n);
        return message.reply(`❤️ HP: **${n}/${dados.recursos.hpTotal}**`);
    }
    if (opcao === 'mp') {
        const val = parseInt(args[2]);
        if (isNaN(val)) return;
        let n = dados.recursos.manaAtual + val;
        if (n > dados.recursos.manaTotal) n = dados.recursos.manaTotal; if (n < 0) n = 0;
        await db.set(`${chaveAtiva}.recursos.manaAtual`, n);
        return message.reply(`✨ MP: **${n}/${dados.recursos.manaTotal}**`);
    }

    // --- TREINAR ---
    if (opcao === 'treinar') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_treinar_fisicas').setLabel('Físicas').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_treinar_mentais').setLabel('Mentais').setStyle(ButtonStyle.Primary)
        );
        return message.reply({ content: 'Escolha a categoria para adicionar o bônus de Treinado (+3):', components: [row] });
    }

    // --- VISUALIZAR ---
    const avatar = message.author.displayAvatarURL();
    switch (opcao) {
        case 'p': return message.reply({ embeds: [gerarEmbedPericias(dados)] });
        case 'i': return message.reply({ embeds: [gerarEmbedInventario(dados)] });
        case 'h': return message.reply({ embeds: [gerarEmbedHabilidades(dados)] });
        case 'f': return message.reply({ embeds: [gerarEmbedBasico(dados, avatar), gerarEmbedPericias(dados), gerarEmbedInventario(dados), gerarEmbedHabilidades(dados)] });
        default: return message.reply({ embeds: [gerarEmbedBasico(dados, avatar)] });
    }
}

// --- 2. MENU (!menu) ---
async function comandoMenu(message) {
    const args = message.content.split(' ');
    const opcao = args[1] ? args[1].toLowerCase() : 'atributos';
    const dados = await db.get(`ficha_${message.author.id}`);

    if (!dados) return message.reply("❌ Nenhuma ficha ativa! Use `!ficha login`.");

    if (opcao !== 'p') {
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rolar_forca').setLabel(`For ${fmt(dados.atributos.forca)}`).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('rolar_destreza').setLabel(`Des ${fmt(dados.atributos.destreza)}`).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('rolar_constituicao').setLabel(`Con ${fmt(dados.atributos.constituicao)}`).setStyle(ButtonStyle.Primary)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rolar_inteligencia').setLabel(`Int ${fmt(dados.atributos.inteligencia)}`).setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('rolar_sabedoria').setLabel(`Sab ${fmt(dados.atributos.sabedoria)}`).setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('rolar_carisma').setLabel(`Car ${fmt(dados.atributos.carisma)}`).setStyle(ButtonStyle.Danger)
        );
        return message.reply({ content: `🎲 **Painel: ${dados.nome}**`, components: [row1, row2] });
    }

    if (opcao === 'p') {
        // --- MUDANÇA: DIVISÃO EM DOIS MENUS PARA CABER TUDO ---
        
        // Menu 1: Físicas
        const selectFisicas = new StringSelectMenuBuilder()
            .setCustomId('menu_rolar_pericia_fisicas')
            .setPlaceholder('💪 Perícias Físicas...');
        
        for (const [nome, attr] of Object.entries(PERICIAS_FISICAS)) {
            const calculo = calcularPericia(dados, nome);
            selectFisicas.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(nome).setDescription(`Total: ${fmt(calculo.total)} | ${calculo.detalhes}`).setValue(nome));
        }

        // Menu 2: Mentais
        const selectMentais = new StringSelectMenuBuilder()
            .setCustomId('menu_rolar_pericia_mentais')
            .setPlaceholder('🧠 Perícias Mentais...');
        
        for (const [nome, attr] of Object.entries(PERICIAS_MENTAIS)) {
            const calculo = calcularPericia(dados, nome);
            selectMentais.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(nome).setDescription(`Total: ${fmt(calculo.total)} | ${calculo.detalhes}`).setValue(nome));
        }

        return message.reply({ 
            content: '🤸 **Selecione a Perícia para rolar:**', 
            components: [
                new ActionRowBuilder().addComponents(selectFisicas),
                new ActionRowBuilder().addComponents(selectMentais)
            ] 
        });
    }
}

// --- 3. INTERAÇÕES ---
async function interacaoFicha(interaction) {
    const userId = interaction.user.id;
    const chaveAtiva = `ficha_${userId}`;
    const chaveBanco = `banco_fichas_geral`; // Banco Público

    // A. ABRIR FORMULARIO ADD
    if (interaction.isButton() && interaction.customId === 'btn_abrir_form_add') {
        const modal = new ModalBuilder().setCustomId('modal_add_ficha').setTitle('Novo Personagem (Público)');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_nome').setLabel("Nome").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_raca').setLabel("Raça | Classe").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_recursos').setLabel("Vida / Mana").setValue("10/10").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_fisicos').setLabel("For Des Con").setPlaceholder("Ex: 3 2 4").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_mentais').setLabel("Int Sab Car").setPlaceholder("Ex: 1 0 -1").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    // B. SALVAR NO BANCO
    if (interaction.isModalSubmit() && interaction.customId === 'modal_add_ficha') {
        const recursos = interaction.fields.getTextInputValue('input_recursos').split('/');
        const fisicos = interaction.fields.getTextInputValue('input_fisicos').trim().split(/\s+/);
        const mentais = interaction.fields.getTextInputValue('input_mentais').trim().split(/\s+/);

        const novaFicha = {
            nome: interaction.fields.getTextInputValue('input_nome'),
            racaClasse: interaction.fields.getTextInputValue('input_raca'),
            nivel: 1,
            recursos: { hpAtual: parseInt(recursos[0]), hpTotal: parseInt(recursos[0]), manaAtual: parseInt(recursos[1]), manaTotal: parseInt(recursos[1]) },
            atributos: {
                forca: parseInt(fisicos[0]) || 0, destreza: parseInt(fisicos[1]) || 0, constituicao: parseInt(fisicos[2]) || 0,
                inteligencia: parseInt(mentais[0]) || 0, sabedoria: parseInt(mentais[1]) || 0, carisma: parseInt(mentais[2]) || 0
            },
            periciasTreinadas: [], inventario: [], habilidades: [],
            pontosPericia: {} 
        };

        await db.push(chaveBanco, novaFicha);
        await interaction.reply({ 
            content: `✅ **${novaFicha.nome}** salvo no Banco Público!\nQualquer um pode usar \`!ficha login\` para jogar com ele.`,
            embeds: [gerarEmbedBasico(novaFicha, interaction.user.displayAvatarURL())] 
        });
    }

    // C. PROCESSAR LOGIN (Lê do Banco Público)
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_login_ficha') {
        const nomeAlvo = interaction.values[0];
        const banco = await db.get(chaveBanco) || [];
        const alvo = banco.find(f => f.nome === nomeAlvo);

        if (alvo) {
            await sincronizarFicha(userId);
            if (!alvo.pontosPericia) alvo.pontosPericia = {}; 
            await db.set(chaveAtiva, alvo);
            await interaction.reply(`✅ Login realizado! Jogando como: **${alvo.nome}**.`);
        } else {
            await interaction.reply("❌ Erro ao encontrar personagem.");
        }
    }

    // D. PROCESSAR DELETE
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_del_ficha') {
        const nomeAlvo = interaction.values[0];
        let banco = await db.get(chaveBanco) || [];
        
        const novoBanco = banco.filter(f => f.nome !== nomeAlvo);
        await db.set(chaveBanco, novoBanco);

        const ativa = await db.get(chaveAtiva);
        if (ativa && ativa.nome === nomeAlvo) {
            await db.delete(chaveAtiva);
        }
        await interaction.reply(`🗑️ **${nomeAlvo}** foi deletado do Banco Público.`);
    }

    // E. TREINAR / ROLAR
    if (interaction.isButton() && (interaction.customId === 'btn_treinar_fisicas' || interaction.customId === 'btn_treinar_mentais')) {
        const tipo = interaction.customId === 'btn_treinar_fisicas' ? PERICIAS_FISICAS : PERICIAS_MENTAIS;
        const select = new StringSelectMenuBuilder().setCustomId('select_treinar_salvar').setPlaceholder('Marque...').setMinValues(1).setMaxValues(Object.keys(tipo).length);
        for (const nome of Object.keys(tipo)) select.addOptions(new StringSelectMenuOptionBuilder().setLabel(nome).setValue(nome));
        await interaction.reply({ content: 'Selecione:', components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_treinar_salvar') {
        const dados = await db.get(chaveAtiva);
        const novaLista = [...new Set([...dados.periciasTreinadas, ...interaction.values])];
        await db.set(`${chaveAtiva}.periciasTreinadas`, novaLista);
        await interaction.reply({ content: `✅ Treino salvo!` });
    }
    if (interaction.isButton() && interaction.customId.startsWith('rolar_')) {
        const dados = await db.get(chaveAtiva);
        const atributo = interaction.customId.replace('rolar_', ''); 
        const valor = dados.atributos[atributo];
        const d20 = Math.floor(Math.random() * 20) + 1;
        await interaction.reply(`🎲 **${atributo.toUpperCase()}**: [${d20}] + ${valor} = **${d20 + valor}**`);
    }

    // ATUALIZADO: ROLAGEM DE PERÍCIA (Aceita os dois menus)
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('menu_rolar_pericia')) {
        const dados = await db.get(chaveAtiva);
        const nome = interaction.values[0];
        
        const calculo = calcularPericia(dados, nome);
        
        const d20 = Math.floor(Math.random() * 20) + 1;
        await interaction.reply(`🎲 **${nome}**: [${d20}] + ${calculo.total} = **${d20 + calculo.total}**\n*(Detalhes: ${calculo.detalhes})*`);
    }
}

// --- FUNÇÕES VISUAIS ---
const fmt = (n) => n >= 0 ? `+${n}` : `${n}`;

function gerarBarra(atual, total, cor = 'red') {
    const totalBarras = 10;
    if (total <= 0) total = 1; 
    const p = Math.min(Math.max(atual / total, 0), 1);
    const preenchidas = Math.round(totalBarras * p);
    return (cor==='red'?'🟥':'🟦').repeat(preenchidas) + '⬛'.repeat(totalBarras - preenchidas);
}

function gerarEmbedBasico(dados, avatarUrl = null) {
    const a = dados.atributos;
    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`📜 ${dados.nome}`)
        .setDescription(`**${dados.racaClasse}** | Nível ${dados.nivel}`) 
        .addFields(
            { name: `❤️ Vida [${dados.recursos.hpAtual}/${dados.recursos.hpTotal}]`, value: gerarBarra(dados.recursos.hpAtual, dados.recursos.hpTotal, 'red'), inline: false },
            { name: `✨ Mana [${dados.recursos.manaAtual}/${dados.recursos.manaTotal}]`, value: gerarBarra(dados.recursos.manaAtual, dados.recursos.manaTotal, 'blue'), inline: false },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: '⚔️ Físicos', value: `>>> **Força:** \`${fmt(a.forca)}\`\n**Destreza:** \`${fmt(a.destreza)}\`\n**Const.:** \`${fmt(a.constituicao)}\``, inline: true },
            { name: '🔮 Mentais', value: `>>> **Intelig.:** \`${fmt(a.inteligencia)}\`\n**Sabedoria:** \`${fmt(a.sabedoria)}\`\n**Carisma:** \`${fmt(a.carisma)}\``, inline: true }
        )
        .setFooter({ text: 'Dica: Use !menu para rolar dados' });

    if (avatarUrl) embed.setThumbnail(avatarUrl); 
    else embed.setThumbnail('https://cdn-icons-png.flaticon.com/512/3408/3408506.png');
    
    return embed;
}

function gerarEmbedPericias(dados) {
    let descFisicas = "";
    let descMentais = "";
    
    if (!dados.pontosPericia) dados.pontosPericia = {};

    for (const [nome, attr] of Object.entries(MAPA_TOTAL)) {
        const calculo = calcularPericia(dados, nome);
        let icone = "▫️"; 
        
        if (dados.periciasTreinadas.includes(nome)) icone = "🔹";
        if (dados.pontosPericia[nome] > 0) icone = "🔸";
        if (dados.periciasTreinadas.includes(nome) && dados.pontosPericia[nome] > 0) icone = "🌟";

        const linha = `${icone} **${nome}**: \`${fmt(calculo.total)}\`\n`;

        if (Object.keys(PERICIAS_FISICAS).includes(nome)) {
            descFisicas += linha;
        } else {
            descMentais += linha;
        }
    }

    return new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle(`🤸 Perícias de ${dados.nome}`)
        .setDescription("Soma: Pontos + Atributo + Treinado")
        .addFields(
            { name: '💪 Físicas', value: descFisicas || "Nenhuma", inline: true },
            { name: '🧠 Mentais', value: descMentais || "Nenhuma", inline: true }
        );
}

function gerarEmbedInventario(dados) {
    let desc = "A mochila está vazia."; 
    if (Array.isArray(dados.inventario) && dados.inventario.length > 0) { 
        desc = dados.inventario.map(i => {
            let info = `📦 **${i.nome}** (x${i.quant})`;
            if (i.bonus) info += ` | Bônus: \`${i.bonus}\``;
            if (i.desc) info += `\n> *${i.desc}*`;
            return info;
        }).join('\n\n'); 
    }
    return new EmbedBuilder().setColor(0x808080).setTitle(`🎒 Mochila de ${dados.nome}`).setDescription(desc);
}

function gerarEmbedHabilidades(dados) {
    if (!Array.isArray(dados.habilidades) || dados.habilidades.length === 0) {
        return new EmbedBuilder().setColor(0x9B59B6).setTitle(`Habilidades de ${dados.nome}`).setDescription("Nenhuma habilidade, magia ou defeito.");
    }

    const habilidades = dados.habilidades.filter(h => !h.tipo || h.tipo === 'Habilidade');
    const magias = dados.habilidades.filter(h => h.tipo === 'Magia');
    const defeitos = dados.habilidades.filter(h => h.tipo === 'Defeito');

    const embed = new EmbedBuilder().setColor(0x9B59B6).setTitle(`📚 Habilidades de ${dados.nome}`);

    const formatarLista = (lista, emoji) => {
        return lista.map(h => {
            let texto = `${emoji} **${h.nome}**`;
            if (h.custo) texto += ` | Custo: \`${h.custo}\``;
            if (h.desc) texto += `\n> *${h.desc}*`;
            return texto;
        }).join('\n\n');
    };

    if (habilidades.length > 0) embed.addFields({ name: '⚔️ Habilidades', value: formatarLista(habilidades, '⚔️') });
    if (magias.length > 0) embed.addFields({ name: '🔮 Magias', value: formatarLista(magias, '🔮') });
    if (defeitos.length > 0) embed.addFields({ name: '🩸 Defeitos', value: formatarLista(defeitos, '⚠️') });

    return embed;
}

module.exports = { comandoFicha, comandoMenu, interacaoFicha };