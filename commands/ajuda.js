const { EmbedBuilder } = require('discord.js');

async function comandoAjuda(message) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📘 Manual do Sistema Rolando v3.2')
        .setDescription('Guia completo de comandos para jogadores e mestres.')
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/2666/2666505.png') // Ícone de livro
        .addFields(
            // --- 1. ROLAGENS GERAIS ---
            { name: '🎲 Rolagens', value: 
                '`!d20` - Rola um dado de 20 faces.\n' +
                '`!2d8+5` - Rola dados complexos (matemática).\n' +
                '`!menu` - Abre o painel de botões de **Atributos**.\n' +
                '`!menu p` - Abre o menu de rolagem de **Perícias**.' 
            },

            // --- 2. GERENCIAMENTO DE FICHA ---
            { name: '👥 Seus Personagens (Banco Público)', value: 
                '`!ficha add` - Cria um novo personagem no banco.\n' +
                '`!ficha login` - Entra em um personagem existente.\n' +
                '`!ficha lista` - Vê todos os personagens do banco.\n' +
                '`!ficha del` - Deleta um personagem para sempre.' 
            },

            // --- 3. STATUS E ATRIBUTOS ---
            { name: '📜 Status & Atributos', value: 
                '`!ficha` - Resumo (HP, Mana e Atributos).\n' +
                '`!ficha f` - Ficha **Completa** (Tudo em um só lugar).\n' +
                '`!ficha atributo [Nome] [Valor]` - Muda o valor de um Atributo.\n' +
                '*Ex: `!ficha atributo Força 3` ou `!ficha attr Des 5`*\n' +
                '`!ficha hp -5` / `!ficha hp +5` - Tira ou Põe Vida.\n' +
                '`!ficha mp -2` / `!ficha mp +2` - Tira ou Põe Mana.' 
            },

            // --- 4. SISTEMA DE PERÍCIAS ---
            { name: '🤸 Evolução de Perícias', value: 
                '**Como funciona:** Total = Pontos + Atributo + Treino (+3)\n\n' +
                '`!ficha pericia [Nome] [Valor]` - Define seus pontos gastos.\n' +
                '*Ex: `!ficha pericia Luta 5` (Define 5 pontos em Luta)*\n\n' +
                '`!ficha treinar` - Abre menu para marcar o bônus de **Treinado (+3)**.\n' +
                '`!ficha p` - Vê a lista e os cálculos das perícias.'
            },

            // --- 5. ITENS, MAGIAS E DEFEITOS (ATUALIZADO) ---
            { name: '🎒 Itens, Magias e Defeitos', value: 
                '**Adicionar (use -- para detalhes):**\n' +
                '`!ficha item [Nome] -- q [Qtd]; d [Desc]`\n' +
                '`!ficha habilidade [Nome] -- c [Custo]; d [Desc]`\n' +
                '`!ficha magia [Nome] -- c [Custo]; d [Desc]`\n' +
                '`!ficha defeito [Nome] -- d [Desc]`\n\n' +
                '*Ex: `!ficha magia Bola de Fogo -- c 5 MP`*\n' +
                '*Ex: `!ficha defeito Manco -- d -2 Deslocamento`*\n\n' +
                '**Remover:**\n' +
                '`!ficha remover item [Nome]`\n' +
                '`!ficha remover habilidade [Nome]`\n' +
                '`!ficha remover magia [Nome]`\n' +
                '`!ficha remover defeito [Nome]`'
            },

            // --- 6. COMBATE ---
            { name: '⚔️ Combate', value: 
                '`!iniciativa` - Rola iniciativa (1d20 + Des) e entra na fila.\n' +
                '`!turno` - Mostra a ordem de quem joga.\n' +
                '`!turno r` - Limpa/Reseta o combate (Mestre).' 
            }
        )
        .setFooter({ text: 'Dica: Use !admin se você for o Mestre/Dono.' });

    await message.reply({ embeds: [embed] });
}

module.exports = { comandoAjuda };