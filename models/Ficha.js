const mongoose = require('mongoose');

const fichaSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // ID do usuário no Discord
    nome: { type: String, default: 'Desconhecido' },
    
    // Dados Básicos
    idade: Number,
    nivel: { type: Number, default: 1 },
    raca: String,
    defeito: String,
    deslocamento: String,

    // Recursos
    hp: {
        atual: { type: Number, default: 10 },
        total: { type: Number, default: 10 }
    },
    mana: {
        atual: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },

    // Defesas
    defesa: {
        fisica: { type: Number, default: 10 },
        magica: { type: Number, default: 10 }
    },

    // Atributos (Os valores brutos, ex: 18, 10, 12)
    atributos: {
        forca: { type: Number, default: 10 },
        destreza: { type: Number, default: 10 },
        constituicao: { type: Number, default: 10 },
        inteligencia: { type: Number, default: 10 },
        sabedoria: { type: Number, default: 10 },
        carisma: { type: Number, default: 10 }
    },

    // Perícias (Salvamos apenas se é treinada e bônus extras)
    // O bônus do atributo o bot calculará na hora de rolar.
    pericias: {
        acrobacia: { treinado: Boolean, bonus: Number },
        adestrarAnimais: { treinado: Boolean, bonus: Number },
        atletismo: { treinado: Boolean, bonus: Number },
        atuacao: { treinado: Boolean, bonus: Number },
        cavalgar: { treinado: Boolean, bonus: Number },
        conhecimento: { treinado: Boolean, bonus: Number },
        conjuracao: { treinado: Boolean, bonus: Number },
        diplomacia: { treinado: Boolean, bonus: Number },
        enganacao: { treinado: Boolean, bonus: Number },
        fortitude: { treinado: Boolean, bonus: Number },
        furtividade: { treinado: Boolean, bonus: Number },
        guerra: { treinado: Boolean, bonus: Number },
        iniciativa: { treinado: Boolean, bonus: Number },
        intimidacao: { treinado: Boolean, bonus: Number },
        intuicao: { treinado: Boolean, bonus: Number },
        investigacao: { treinado: Boolean, bonus: Number },
        jogatina: { treinado: Boolean, bonus: Number },
        ladinagem: { treinado: Boolean, bonus: Number },
        luta: { treinado: Boolean, bonus: Number },
        medicina: { treinado: Boolean, bonus: Number },
        misticismo: { treinado: Boolean, bonus: Number },
        natureza: { treinado: Boolean, bonus: Number },
        nobreza: { treinado: Boolean, bonus: Number },
        oficio1: { treinado: Boolean, bonus: Number, nome: String }, // Para especificar qual ofício
        percepcao: { treinado: Boolean, bonus: Number },
        pontaria: { treinado: Boolean, bonus: Number },
        reflexos: { treinado: Boolean, bonus: Number },
        religiao: { treinado: Boolean, bonus: Number },
        sobrevivencia: { treinado: Boolean, bonus: Number },
        vontade: { treinado: Boolean, bonus: Number }
    },

    // Extras
    habilidadesRaca: String,
    proezas: String,
    equipamentos: String, // Podemos melhorar para Array depois
    magias: String,
    inventario: String
});

module.exports = mongoose.model('Ficha', fichaSchema);