import { schedule } from "@netlify/functions";

export const handler = schedule("0 18 * * 5", async (event) => {
    try {
        console.log("Executando Cron Futuro na Netlify...");
        const response = await fetch("https://agendacpi7.netlify.app/api/cron/relatorio-futuro");
        const data = await response.json();
        console.log("Resultado:", data);

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error("Erro no Cron Futuro:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Falha na execução" }),
        };
    }
});
