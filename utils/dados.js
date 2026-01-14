// Função para rolar um dado (ex: d20)
function rolarUnico(lados) {
    return Math.floor(Math.random() * lados) + 1;
}

// Função principal que interpreta o texto (ex: "2d20+5")
function interpretarRolagem(comando) {
    // Remove o "!" e espaços extras, deixa tudo minúsculo
    let formula = comando.replace('!', '').toLowerCase().replace(/\s/g, '');

    // Regex: Procura padrão tipo "2d20", "d20", "1d8+3", "d6*2"
    // Grupo 1: Quantidade (pode ser vazio)
    // Grupo 2: Lados (obrigatório)
    // Grupo 3: Operador (+, -, *) e Valor Extra (opcional)
    const regex = /^(\d*)d(\d+)([\+\-\*]\d+)?$/;
    const match = formula.match(regex);

    if (!match) return null; // Não é uma rolagem válida

    let qtd = match[1] ? parseInt(match[1]) : 1; // Se não tiver número antes do d, é 1
    let lados = parseInt(match[2]);
    let modificador = match[3] || ""; // Ex: "+5", "-2" ou vazio

    if (qtd > 100) return "Calma lá! Muitos dados para rolar.";
    if (lados < 2) return "Um dado precisa de pelo menos 2 lados.";

    let resultados = [];
    let somaDados = 0;

    // Rola os dados
    for (let i = 0; i < qtd; i++) {
        let valor = rolarUnico(lados);
        resultados.push(valor);
        somaDados += valor;
    }

    // Calcula o total final com matemática
    let totalFinal = somaDados;
    let contaExtra = "";

    if (modificador) {
        const operador = modificador[0];
        const valorMod = parseInt(modificador.substring(1));
        
        contaExtra = ` ${operador} ${valorMod}`;

        if (operador === '+') totalFinal += valorMod;
        if (operador === '-') totalFinal -= valorMod;
        if (operador === '*') totalFinal *= valorMod;
    }

    // Monta a resposta bonita
    return {
        formula: `${qtd}d${lados}${modificador}`,
        dados: resultados, // Array com os valores individuais [15, 4]
        total: totalFinal,
        detalhe: `[${resultados.join(', ')}]${contaExtra}`
    };
}

module.exports = { interpretarRolagem };