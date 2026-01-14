const { EmbedBuilder } = require('discord.js');

async function comandoAjuda(message) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📘 Manual do Sistema Rolando')
        .setDescription('Guia completo de comandos atualizados.')
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/2666/2666505.png') // Ícone de livro
        .addFields(
            // --- 1. ROLAGENS ---
            { name: '🎲 Rolagens', value: 
                '`!d20` - Rola um D20.\n' +
                '`!2d8+5` - Rola dados complexos.\n' +
                '`!menu` - Abre botões de Atributos.\n' +
                '`!menu p` - Abre menu de Perícias.' 
            },

            // --- 2. MULTI-PERSONAGENS (NOVO) ---
            { name: '👥 Seus Personagens', value: 
                '`!ficha add` - Cria um novo char (banco).\n' +
                '`!ficha login` - Troca de personagem (Menu).\n' +
                '`!ficha lista` - Vê todos os seus chars.\n' +
                '`!ficha del` - Deleta um char (Menu).' 
            },

            // --- 3. FICHA E STATUS ---
            { name: '📜 Ficha & Status', value: 
                '`!ficha` - Vê a ficha Atual.\n' +
                '`!ficha f` - Vê a ficha **Completa**.\n' +
                '`!ficha hp -5` - Tira vida (Dano).\n' +
                '`!ficha mp +2` - Recupera mana.\n' +
                '`!ficha treinar` - Treina perícias (+3).' 
            },

            // --- 4. INVENTÁRIO AVANÇADO (NOVO) ---
            { name: '🎒 Itens e Habilidades', value: 
                '**Adicionar com detalhes (--):**\n' +
                '`!ficha item [Nome] -- q [Qtd]; d [Desc]`\n' +
                '*Ex: !ficha item Poção -- q 3; d Cura 5 HP*\n\n' +
                '`!ficha habilidade [Nome] -- c [Custo]; d [Desc]`\n' +
                '*Ex: !ficha habilidade Bola de Fogo -- c 5 MP*\n\n' +
                '**Remover:**\n' +
                '`!ficha remover item [Nome]`\n' +
                '`!ficha remover habilidade [Nome]`'
            },

            // --- 5. COMBATE (NOVO) ---
            { name: '⚔️ Combate', value: 
                '`!iniciativa` - Rola iniciativa e entra na fila.\n' +
                '`!turno` - Mostra a ordem de turnos.\n' +
                '`!turno r` - Limpa/Reseta o combate.' 
            }
        )
        .setFooter({ text: 'Bot Rolando v2.0 • Sistema Próprio' });

    await message.reply({ embeds: [embed] });
}

module.exports = { comandoAjuda };