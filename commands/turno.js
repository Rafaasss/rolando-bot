const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Nome da chave no banco onde salvaremos a lista de combate
const DB_COMBATE = "combate_ativo"; 

// --- COMANDO: !iniciativa ---
async function comandoIniciativa(message) {
    const userId = message.author.id;
    
    // 1. Tenta pegar a ficha do jogador
    const ficha = await db.get(`ficha_${userId}`);
    
    if (!ficha) {
        return message.reply("❌ Você precisa criar uma ficha primeiro! Use `!ficha criar`.");
    }

    // 2. Calcula a iniciativa (1d20 + Destreza)
    const destreza = ficha.atributos.destreza || 0;
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + destreza;

    // 3. Cria o objeto do combatente
    const combatente = {
        nome: ficha.nome,
        jogador: message.author.username,
        total: total,
        dados: `(D20: ${d20} + Des: ${destreza})`
    };

    // 4. Pega a lista atual, adiciona o novo e ORDENA
    let lista = await db.get(DB_COMBATE) || [];
    
    // Remove se o jogador já estiver na lista (para ele não rolar 2 vezes)
    lista = lista.filter(c => c.nome !== ficha.nome);
    
    lista.push(combatente);

    // Ordena do Maior para o Menor (b.total - a.total)
    lista.sort((a, b) => b.total - a.total);

    // Salva de volta
    await db.set(DB_COMBATE, lista);

    return message.reply(`⚔️ **${ficha.nome}** entrou no combate!\nIniciativa: **${total}** ${combatente.dados}`);
}

// --- COMANDO: !turno (Ver e Resetar) ---
async function comandoTurno(message) {
    const args = message.content.split(' ');
    const opcao = args[1] ? args[1].toLowerCase() : null; // Pega o 'r' se existir

    // 1. RESETAR (!turno r)
    if (opcao === 'r') {
        await db.delete(DB_COMBATE);
        return message.reply("🔄 O combate encerrou. A ordem de turnos foi resetada!");
    }

    // 2. MOSTRAR A LISTA (!turno)
    const lista = await db.get(DB_COMBATE);

    if (!lista || lista.length === 0) {
        return message.reply("💤 O combate está vazio. Use `!iniciativa` para entrar.");
    }

    // Monta o texto da lista
    let descricao = "";
    lista.forEach((c, index) => {
        let medalha = "▫️";
        if (index === 0) medalha = "🥇";
        if (index === 1) medalha = "🥈";
        if (index === 2) medalha = "🥉";

        descricao += `${medalha} **${c.total}** - **${c.nome}** ${c.dados}\n`;
    });

    const embed = new EmbedBuilder()
        .setColor(0xFF0000) // Vermelho Sangue
        .setTitle("⚔️ Ordem de Combate")
        .setDescription(descricao)
        .setFooter({ text: "Use '!turno r' para limpar a lista." });

    return message.reply({ embeds: [embed] });
}

module.exports = { comandoIniciativa, comandoTurno };