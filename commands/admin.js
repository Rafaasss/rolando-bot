const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const util = require('util');

// ⚠️ SEU ID (Mantenha o seu ID real aqui)
const DONO_ID = "522039730817204224"; 

async function comandoAdmin(message) {
    // 1. Segurança Absoluta
    if (message.author.id !== DONO_ID) {
        return message.reply("⛔ **Acesso Negado.** Você não tem permissão para usar o console de Deus.");
    }

    const args = message.content.split(' ');
    const comando = args[1] ? args[1].toLowerCase() : 'help'; 
    const codigo = args.slice(2).join(' ');

    // --- COMANDO: HELP (Manual do Admin 3.0) ---
    if (comando === 'help' || comando === 'ajuda') {
        const embed = new EmbedBuilder()
            .setColor(0x000000) 
            .setTitle('💻 Console de Administrador v3.0')
            .setDescription('Cheat Codes atualizados com o novo sistema de Pontos.\n**Substitua "ID" pelo ID do usuário.**')
            .addFields(
                // --- BÁSICO ---
                { name: '🔍 Espionar', value: '`!admin ver ficha_ID`' },
                
                // --- ATRIBUTOS E VIDA ---
                { name: '❤️ Cheat: Mudar Vida/Mana Máxima', value: '```js\n!admin eval db.set("ficha_ID.recursos.hpTotal", 50)\n```' },
                { name: '💪 Cheat: Mudar Atributo', value: '```js\n!admin eval db.set("ficha_ID.atributos.forca", 10)\n```' },

                // --- PERÍCIAS (ATUALIZADO) ---
                { name: '🔹 Cheat: Definir PONTOS de Perícia', value: 'Define quantos pontos gastos a pessoa tem (sem contar atributo):\n```js\n!admin eval db.set("ficha_ID.pontosPericia.Luta", 5)\n```' },
                { name: '🤸 Cheat: Dar Treino (Ícone 🔹)', value: '```js\n!admin eval db.push("ficha_ID.periciasTreinadas", "Furtividade")\n```' },
                { name: '📉 Cheat: Remover Treino', value: '```js\n!admin eval (async()=>{const p=await db.get("ficha_ID.periciasTreinadas"); await db.set("ficha_ID.periciasTreinadas", p.filter(x=>x!=="Furtividade"))})()\n```' },

                // --- ITENS E HABILIDADES ---
                { name: '🎒 Cheat: Editar Item (Nome/Desc/Qtd)', value: 'Muda item pelo NOME exato:\n```js\n!admin eval (async()=>{const d=await db.get("ficha_ID"); const item=d.inventario.find(x=>x.nome=="NomeDoItem"); if(item) item.desc="Nova Descrição"; await db.set("ficha_ID", d)})()\n```' },
                
                { name: '✨ Cheat: Editar Habilidade', value: '```js\n!admin eval (async()=>{const d=await db.get("ficha_ID"); const hab=d.habilidades.find(x=>x.nome=="Bola de Fogo"); if(hab) hab.custo="10 MP"; await db.set("ficha_ID", d)})()\n```' },

                // --- UTILITÁRIOS ---
                { name: '🗑️ Cheat: Apagar Char do Banco', value: '```js\n!admin eval (async()=>{const b=await db.get("banco_fichas_ID"); await db.set("banco_fichas_ID", b.filter(f=>f.nome!=="NomeDoChar"))})()\n```' }
            )
            .setFooter({ text: 'Dica: Cuidado ao editar arrays (listas) manualmente.' });

        return message.reply({ embeds: [embed] });
    }

    // --- COMANDO: EVAL ---
    if (comando === 'eval') {
        if (!codigo) return message.reply("⚠️ Digite o código.");
        try {
            let resultado = await eval(codigo);
            if (typeof resultado !== "string") resultado = util.inspect(resultado, { depth: 1 });
            message.reply(`💻 **Executado:**\n\`\`\`js\n${resultado.substring(0, 1900)}\n\`\`\``);
        } catch (erro) {
            message.reply(`❌ **Erro:**\n\`\`\`js\n${erro}\n\`\`\``);
        }
    }

    // --- COMANDO: VER ---
    if (comando === 'ver' || comando === 'get') {
        if (!codigo) return message.reply("⚠️ Diga a chave. Ex: `!admin ver ficha_12345`");
        const dados = await db.get(codigo);
        if (!dados) return message.reply("📭 Nada encontrado.");
        
        const texto = util.inspect(dados, { depth: 2 });
        if (texto.length > 1900) {
            return message.reply({ content: "📂 Arquivo grande:", files: [{ attachment: Buffer.from(texto), name: 'dados.txt' }] });
        }
        return message.reply(`🔍 **Conteúdo:**\n\`\`\`js\n${texto}\n\`\`\``);
    }
}

module.exports = { comandoAdmin };