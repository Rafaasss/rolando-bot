require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActivityType } = require('discord.js'); // Adicionei ActivityType
const { QuickDB } = require("quick.db");
const { interpretarRolagem } = require('./utils/dados');
const { comandoIniciativa, comandoTurno } = require('./commands/turno');

// Importa os comandos
const { comandoFicha, comandoMenu, interacaoFicha } = require('./commands/ficha');
const { comandoAjuda } = require('./commands/ajuda'); // <--- NOVO

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

client.once(Events.ClientReady, (c) => {
    console.log(`✅ ${c.user.tag} está ONLINE!`);
    
    // Define o Status do Bot ("Jogando ...")
    client.user.setActivity('Sistema de Recompensa', { type: ActivityType.Playing });
});

// --- OUVINTE DE MENSAGENS ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // Comando Ajuda
    if (message.content === '!ajuda' || message.content === '!help') {
        await comandoAjuda(message);
    }

    // Rolagens (!d20)
    if (message.content.match(/^!(\d*)d/)) {
        const resultado = interpretarRolagem(message.content);
        if (resultado && typeof resultado !== 'string') {
             message.reply(`🎲 **Resultado:** ${resultado.total} \nDetalhes: \`[${resultado.dados.join(', ')}]\``);
        }
    }

    // Comandos de Ficha
    if (message.content.startsWith('!ficha')) {
        await comandoFicha(message);
    }

    // Menus
    if (message.content.startsWith('!menu')) {
        await comandoMenu(message);
    }
    // --- COMBATE ---
    if (message.content.startsWith('!iniciativa')) {
        await comandoIniciativa(message);
    }

    if (message.content.startsWith('!turno')) {
        await comandoTurno(message);
    }
});

// --- INTERAÇÕES ---
client.on(Events.InteractionCreate, async (interaction) => {
    await interacaoFicha(interaction);
});

client.login(process.env.DISCORD_TOKEN);