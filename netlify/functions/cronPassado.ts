import { schedule } from "@netlify/functions";

export const handler = schedule("0 8 * * 1", async (event) => {
    try {
        console.log("Executando Cron Passado na Netlify...");
        const response = await fetch("https://agendacpi7.netlify.app/api/cron/relatorio-passado");
        const data = await response.json();
        console.log("Resultado:", data);

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error("Erro no Cron Passado:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Falha na execução" }),
        };
    }
});
