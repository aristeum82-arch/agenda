/**
 * Script de relatório de migração SEI
 * Gera um CSV com usuários que possuem numeroOficioSei no perfil e agendamentos existentes.
 *
 * Uso local:
 *   node scripts/migrate_sei_report.js
 *
 * Observação: este script é read-only — apenas gera um relatório para revisão.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

async function main() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("Configure TURSO_CONNECTION_URL e TURSO_AUTH_TOKEN no .env.local");
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  // Simple query using libsql client
  const report = [];

  // 1) usuários com numeroOficioSei preenchido
  const usuariosRes = await client.execute("SELECT id, re, nome_guerra, numero_oficio_sei FROM usuarios_info WHERE numero_oficio_sei IS NOT NULL AND numero_oficio_sei != 'Sem ofício'");
  for (const row of usuariosRes.rows) {
    report.push({
      type: "usuario_sei",
      usuario_id: row[0],
      re: row[1],
      nomeGuerra: row[2],
      numeroOficioSei: row[3],
    });
  }

  // 2) agendamentos existentes com SEI
  const agRes = await client.execute("SELECT id, solicitante_id, data_hora FROM agendamentos WHERE numero_oficio_sei IS NOT NULL");
  for (const row of agRes.rows) {
    report.push({
      type: "agendamento_sei",
      id: row[0],
      solicitanteId: row[1],
      dataHora: row[2],
    });
  }

  const outPath = path.join(__dirname, "..", "migrations", "sei_migration_report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log("Relatório gerado em:", outPath);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });

