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

// --- FUNÇÃO AUXILIAR: SINCRONIZAR (Salva a ficha ativa de volta no cofre) ---
async function sincronizarFicha(userId) {
    const ativa = await db.get(`ficha_${userId}`);
    if (!ativa) return; 

    let banco = await db.get(`banco_fichas_${userId}`) || [];
    banco = banco.filter(f => f.nome !== ativa.nome); // Remove versão velha
    banco.push(ativa); // Adiciona versão atualizada
    
    await db.set(`banco_fichas_${userId}`, banco);
}

// --- 1. COMANDO PRINCIPAL (!ficha) ---
async function comandoFicha(message) {
    const args = message.content.split(' ');
    const opcao = args[1] ? args[1].toLowerCase() : 'basico';
    const inputUsuario = args.slice(2).join(' ');
    const userId = message.author.id;
    const chaveAtiva = `ficha_${userId}`;
    const chaveBanco = `banco_fichas_${userId}`;

    // --- COMANDO: ADD / CRIAR ---
    if (opcao === 'add' || opcao === 'criar') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_abrir_form_add').setLabel('➕ Criar Nova Ficha').setStyle(ButtonStyle.Success)
        );
        return message.reply({ content: 'Para adicionar um novo personagem ao seu banco de dados, clique abaixo:', components: [row] });
    }

    // --- COMANDO: LISTA ---
    if (opcao === 'lista' || opcao === 'listar') {
        const banco = await db.get(chaveBanco) || [];
        if (banco.length === 0) return message.reply("📭 Seu banco de fichas está vazio. Use `!ficha add`.");
        
        const nomes = banco.map(f => `• **${f.nome}** (Nvl ${f.nivel} ${f.racaClasse})`).join('\n');
        const ativa = await db.get(chaveAtiva);
        return message.reply({ embeds: [new EmbedBuilder().setColor(0x0099FF).setTitle('📂 Seus Personagens').setDescription(nomes).setFooter({ text: `Atual: ${ativa ? ativa.nome : 'Nenhum'}` })] });
    }

    // --- COMANDO: LOGIN (Agora com Dropdown) ---
    if (opcao === 'login') {
        const banco = await db.get(chaveBanco) || [];
        if (banco.length === 0) return message.reply("❌ Você não tem fichas salvas! Use `!ficha add` primeiro.");

        const select = new StringSelectMenuBuilder()
            .setCustomId('menu_login_ficha')
            .setPlaceholder('Selecione o personagem para Logar...');

        // Adiciona opções (Limite do Discord é 25)
        banco.slice(0, 25).forEach(f => {
            select.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(f.nome)
                .setDescription(`Nvl ${f.nivel} - ${f.racaClasse}`)
                .setValue(f.nome)
            );
        });

        const row = new ActionRowBuilder().addComponents(select);
        return message.reply({ content: '🔑 **Escolha quem você quer assumir hoje:**', components: [row] });
    }

    // --- COMANDO: DEL (Agora com Dropdown) ---
    if (opcao === 'del' || opcao === 'deletar') {
        const banco = await db.get(chaveBanco) || [];
        if (banco.length === 0) return message.reply("❌ Banco vazio.");

        const select = new StringSelectMenuBuilder()
            .setCustomId('menu_del_ficha')
            .setPlaceholder('Selecione o personagem para EXCLUIR...')
            .addOptions(banco.slice(0, 25).map(f => 
                new StringSelectMenuOptionBuilder().setLabel(f.nome).setValue(f.nome).setEmoji('🗑️')
            ));

        const row = new ActionRowBuilder().addComponents(select);
        return message.reply({ content: '⚠️ **Cuidado! Selecione o personagem para DELETAR permanentemente:**', components: [row] });
    }

    // --- COMANDO: RESETAR ---
    if (opcao === 'resetar') {
        await db.delete(chaveAtiva);
        await db.delete(chaveBanco);
        return message.reply("☢️ Reset total concluído.");
    }

    // --- VERIFICAÇÃO DE SEGURANÇA (Se não tem ficha ativa) ---
    const dados = await db.get(chaveAtiva);
    if (!dados) return message.reply("❌ Nenhuma ficha logada! Use `!ficha add` para criar e `!ficha login` para entrar.");

    // Garante Arrays
    if (!Array.isArray(dados.inventario)) dados.inventario = [];
    if (!Array.isArray(dados.habilidades)) dados.habilidades = [];

    // --- ADIÇÃO DE ITEM/HABILIDADE ---
    if (opcao === 'item') {
        if (!inputUsuario) return message.reply("⚠️ Ex: `!ficha item Espada -- q 1`");
        const { nome, params } = processarEntrada(inputUsuario);
        dados.inventario.push({ nome, desc: params['d'] || "", quant: params['q'] || "1", bonus: params['b'] || "" });
        await db.set(chaveAtiva, dados); 
        return message.reply(`🎒 **${nome}** adicionado!`);
    }

    if (opcao === 'habilidade') {
        if (!inputUsuario) return message.reply("⚠️ Ex: `!ficha habilidade Bola de Fogo`");
        const { nome, params } = processarEntrada(inputUsuario);
        dados.habilidades.push({ nome, desc: params['d'] || "", custo: params['c'] || "" });
        await db.set(chaveAtiva, dados);
        return message.reply(`✨ Habilidade **${nome}** aprendida!`);
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
        if (cat === 'habilidade') {
            dados.habilidades = dados.habilidades.filter(h => h.nome.toLowerCase() !== alvo.toLowerCase());
            await db.set(chaveAtiva, dados);
            return message.reply(`🗑️ Habilidade **${alvo}** removida.`);
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
        return message.reply({ content: 'Selecione a categoria:', components: [row] });
    }

    // --- VISUALIZAR ---
    switch (opcao) {
        case 'p': return message.reply({ embeds: [gerarEmbedPericias(dados)] });
        case 'i': return message.reply({ embeds: [gerarEmbedInventario(dados)] });
        case 'h': return message.reply({ embeds: [gerarEmbedHabilidades(dados)] });
        case 'f': return message.reply({ embeds: [gerarEmbedBasico(dados), gerarEmbedPericias(dados), gerarEmbedInventario(dados), gerarEmbedHabilidades(dados)] });
        default: return message.reply({ embeds: [gerarEmbedBasico(dados, message.author.displayAvatarURL())] });
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
        const select = new StringSelectMenuBuilder().setCustomId('menu_rolar_pericia').setPlaceholder('Selecione para Rolar...');
        let contador = 0;
        for (const [nome, attr] of Object.entries(MAPA_TOTAL)) {
            if (contador >= 25) break; 
            let bonus = dados.atributos[attr] + (dados.periciasTreinadas.includes(nome) ? 3 : 0);
            select.addOptions(new StringSelectMenuOptionBuilder().setLabel(nome).setDescription(`Total: ${fmt(bonus)}`).setValue(nome));
            contador++;
        }
        return message.reply({ content: '🤸 **Rolagem de Perícias:**', components: [new ActionRowBuilder().addComponents(select)] });
    }
}

// --- 3. INTERAÇÕES ---
async function interacaoFicha(interaction) {
    const userId = interaction.user.id;
    const chaveAtiva = `ficha_${userId}`;
    const chaveBanco = `banco_fichas_${userId}`;

    // A. ABRIR FORMULARIO ADD
    if (interaction.isButton() && interaction.customId === 'btn_abrir_form_add') {
        const modal = new ModalBuilder().setCustomId('modal_add_ficha').setTitle('Novo Personagem (Banco)');
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
            periciasTreinadas: [], inventario: [], habilidades: []
        };

        await db.push(chaveBanco, novaFicha);
        await interaction.reply({ 
            content: `✅ **${novaFicha.nome}** salvo!\nUse \`!ficha login\` para jogar com ele.`,
            embeds: [gerarEmbedBasico(novaFicha, interaction.user.displayAvatarURL())] 
        });
    }

    // C. PROCESSAR LOGIN (MENU)
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_login_ficha') {
        const nomeAlvo = interaction.values[0];
        const banco = await db.get(chaveBanco) || [];
        const alvo = banco.find(f => f.nome === nomeAlvo);

        if (alvo) {
            await sincronizarFicha(userId); // Salva o anterior
            await db.set(chaveAtiva, alvo); // Define o novo
            await interaction.reply(`✅ Login realizado! Personagem ativo: **${alvo.nome}**.`);
        } else {
            await interaction.reply("❌ Erro ao encontrar personagem.");
        }
    }

    // D. PROCESSAR DELETE (MENU)
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_del_ficha') {
        const nomeAlvo = interaction.values[0];
        let banco = await db.get(chaveBanco) || [];
        
        // Remove do banco
        const novoBanco = banco.filter(f => f.nome !== nomeAlvo);
        await db.set(chaveBanco, novoBanco);

        // Se era o ativo, desloga
        const ativa = await db.get(chaveAtiva);
        if (ativa && ativa.nome === nomeAlvo) {
            await db.delete(chaveAtiva);
        }

        await interaction.reply(`🗑️ **${nomeAlvo}** foi deletado para sempre.`);
    }

    // E. TREINAR / ROLAR (Mantidos igual)
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
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_rolar_pericia') {
        const dados = await db.get(chaveAtiva);
        const periciaNome = interaction.values[0];
        const attr = MAPA_TOTAL[periciaNome];
        let bonus = dados.atributos[attr] + (dados.periciasTreinadas.includes(periciaNome) ? 3 : 0);
        const d20 = Math.floor(Math.random() * 20) + 1;
        await interaction.reply(`🎲 **${periciaNome}**: [${d20}] + ${bonus} = **${d20 + bonus}**`);
    }
}

// --- FUNÇÕES VISUAIS (DESIGN MELHORADO) ---
const fmt = (n) => n >= 0 ? `+${n}` : `${n}`;

// Função para desenhar barrinhas (Ex: 🟥🟥🟥⬜⬜)
function gerarBarra(atual, total, cor = 'red') {
    const totalBarras = 10;
    // Garante que não divida por zero
    if (total <= 0) total = 1; 
    
    const porcentagem = Math.min(Math.max(atual / total, 0), 1);
    const preenchidas = Math.round(totalBarras * porcentagem);
    const vazias = totalBarras - preenchidas;

    const charCheio = cor === 'red' ? '🟥' : '🟦'; // Vida vermelha, Mana azul
    const charVazio = '⬛';

    return `${charCheio.repeat(preenchidas)}${charVazio.repeat(vazias)}`;
}

function gerarEmbedBasico(dados, avatarUrl = null) {
    const a = dados.atributos;
    const hpBar = gerarBarra(dados.recursos.hpAtual, dados.recursos.hpTotal, 'red');
    const mpBar = gerarBarra(dados.recursos.manaAtual, dados.recursos.manaTotal, 'blue');

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`📜 ${dados.nome}`)
        // SUBTÍTULO LIMPO (Sem emojis, separado por |)
        .setDescription(`**${dados.racaClasse}** | Nível ${dados.nivel}`) 
        .addFields(
            { 
                name: `❤️ Vida [${dados.recursos.hpAtual}/${dados.recursos.hpTotal}]`, 
                value: `${hpBar}`, 
                inline: false 
            },
            { 
                name: `✨ Mana [${dados.recursos.manaAtual}/${dados.recursos.manaTotal}]`, 
                value: `${mpBar}`, 
                inline: false 
            },
            { name: '\u200B', value: '\u200B', inline: false }, // Espaçador
            { 
                name: '⚔️ Físicos', 
                value: `>>> **Força:** \`${fmt(a.forca)}\`\n**Destreza:** \`${fmt(a.destreza)}\`\n**Const.:** \`${fmt(a.constituicao)}\``, 
                inline: true 
            },
            { 
                name: '🔮 Mentais', 
                value: `>>> **Intelig.:** \`${fmt(a.inteligencia)}\`\n**Sabedoria:** \`${fmt(a.sabedoria)}\`\n**Carisma:** \`${fmt(a.carisma)}\``, 
                inline: true 
            }
        )
        .setFooter({ text: 'Dica: Use !menu para rolar dados' });

    // Se tiver avatar, usa ele. Se não, usa o pergaminho padrão.
    if (avatarUrl) {
        embed.setThumbnail(avatarUrl);
    } else {
        embed.setThumbnail('https://cdn-icons-png.flaticon.com/512/3408/3408506.png');
    }

    return embed;
}

function gerarEmbedPericias(dados) {
    let descFisicas = "";
    let descMentais = "";
    
    for (const [nome, attr] of Object.entries(MAPA_TOTAL)) {
        let bonus = dados.atributos[attr]; 
        let icone = "▫️"; 
        
        // Verifica treino
        if (dados.periciasTreinadas.includes(nome)) { 
            bonus += 3; 
            icone = "🔹"; 
        }

        const linha = `${icone} **${nome}**: \`${fmt(bonus)}\`\n`;

        // Separa nas listas para ficar organizado
        if (Object.keys(PERICIAS_FISICAS).includes(nome)) {
            descFisicas += linha;
        } else {
            descMentais += linha;
        }
    }

    return new EmbedBuilder()
        .setColor(0xFFA500) // Laranja
        .setTitle(`🤸 Perícias de ${dados.nome}`)
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
    let desc = "Nenhuma habilidade aprendida."; 
    if (Array.isArray(dados.habilidades) && dados.habilidades.length > 0) { 
        desc = dados.habilidades.map(h => {
            let info = `✨ **${h.nome}**`;
            if (h.custo) info += ` | Custo: \`${h.custo}\``;
            if (h.desc) info += `\n> *${h.desc}*`;
            return info;
        }).join('\n\n'); 
    }
    return new EmbedBuilder().setColor(0x9B59B6).setTitle(`📜 Habilidades de ${dados.nome}`).setDescription(desc);
}

module.exports = { comandoFicha, comandoMenu, interacaoFicha };