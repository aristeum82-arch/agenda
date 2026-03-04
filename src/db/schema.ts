import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const usuariosInfo = sqliteTable("usuarios_info", {
    id: text("id").primaryKey(), // ID Clerk Auth
    re: text("re").notNull(), // Ex: "123456"
    email: text("email"), // E-mail para notificações
    nomeGuerra: text("nome_guerra").notNull(),
    opm: text("opm", {
        enum: [
            "CPI-7",
            "ESSD",
            "7 BPM-I",
            "12 BPM-I",
            "14 BAEP",
            "22 BPM-I",
            "40 BPM-I",
            "50 BPM-I",
            "53 BPM-I",
            "54 BPM-I",
            "55 BPM-I",
        ],
    }).notNull(),
    role: text("role", { enum: ["user", "admin_p5", "admin_central"] })
        .default("user")
        .notNull(),
    postoGraduacao: text("posto_graduacao").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const agendamentos = sqliteTable("agendamentos", {
    id: text("id").primaryKey(),
    solicitanteId: text("solicitante_id").notNull(), // Ref to usuarios_info.id
    dataHora: integer("data_hora", { mode: "timestamp" }).notNull(), // Exact timestamp for the 30min slot
    motivo: text("motivo").notNull(),
    numeroOficioSei: text("numero_oficio_sei").notNull(),
    status: text("status", { enum: ["Agendado", "Cancelado", "Realizado"] })
        .default("Agendado")
        .notNull(),
    porIntermedioServico: integer("por_intermedio_servico", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const bloqueios = sqliteTable("bloqueios", {
    id: text("id").primaryKey(),
    inicio: integer("inicio", { mode: "timestamp" }).notNull(),
    fim: integer("fim", { mode: "timestamp" }).notNull(),
    motivo: text("motivo").notNull(),
    criadoPorId: text("criado_por_id").notNull(), // admin userId
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const notificacoes = sqliteTable("notificacoes", {
    id: text("id").primaryKey(),
    usuarioId: text("usuario_id").notNull(),
    mensagem: text("mensagem").notNull(),
    lida: integer("lida", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
