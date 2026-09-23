import { pgTable, text, varchar, timestamp, boolean, integer, bigint, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";

// ==========================================
// 1. ADMIN & ADMIN SESSIONS
// ==========================================
export const admins = pgTable("admins", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  recoveryCodes: jsonb("recovery_codes").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminApiKeys = pgTable("admin_api_keys", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  keyHash: text("key_hash").notNull().unique(),
  prefix: varchar("prefix", { length: 16 }).notNull(),
  scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// 2. APPLICATIONS
// ==========================================
export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  appId: varchar("app_id", { length: 64 }).notNull().unique(), // Public identifier (slug)
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE, DISABLED, MAINTENANCE
  maintenanceMessage: text("maintenance_message").default("Estamos realizando uma manutenção no momento."),
  currentVersion: varchar("current_version", { length: 30 }).default("1.0.0"),
  downloadUrl: text("download_url"),
  apiSecret: text("api_secret").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// 3. PLANS / SUBSCRIPTIONS
// ==========================================
export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  durationDays: integer("duration_days"), // null = Lifetime
  level: integer("level").notNull().default(1),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// 4. LICENSES
// ==========================================
export const licenses = pgTable("licenses", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  planId: text("plan_id").references(() => plans.id, { onDelete: "set null" }),
  key: varchar("key", { length: 128 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("UNUSED"), // UNUSED, ACTIVE, EXPIRED, REVOKED, BANNED, PAUSED
  durationDays: integer("duration_days"), // null = Lifetime
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deviceLimit: integer("device_limit").notNull().default(1), // 0 = unlimited
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  appIdx: index("licenses_app_idx").on(table.applicationId),
  statusIdx: index("licenses_status_idx").on(table.status),
  keyIdx: uniqueIndex("licenses_key_idx").on(table.key),
}));

// ==========================================
// 5. APPLICATION USERS
// ==========================================
export const applicationUsers = pgTable("application_users", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  planId: text("plan_id").references(() => plans.id, { onDelete: "set null" }),
  username: varchar("username", { length: 100 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  email: varchar("email", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE, BANNED, EXPIRED, DISABLED
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  appUserIdx: uniqueIndex("app_username_idx").on(table.applicationId, table.username),
}));

// ==========================================
// 6. DEVICES / HWID
// ==========================================
export const devices = pgTable("devices", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  licenseId: text("license_id").references(() => licenses.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => applicationUsers.id, { onDelete: "cascade" }),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }).notNull(),
  firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE, BANNED
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
}, (table) => ({
  deviceFingerprintIdx: index("device_fingerprint_idx").on(table.applicationId, table.deviceFingerprint),
  licenseDeviceIdx: index("license_device_idx").on(table.licenseId),
}));

// ==========================================
// 7. BANS
// ==========================================
export const bans = pgTable("bans", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").references(() => applications.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // USER, LICENSE, DEVICE, IP
  targetValue: varchar("target_value", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  isGlobal: boolean("is_global").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  banTargetIdx: index("ban_target_idx").on(table.applicationId, table.type, table.targetValue),
  banGlobalIdx: index("ban_global_idx").on(table.isGlobal, table.type, table.targetValue),
}));

// ==========================================
// 8. VERSIONS & FILES
// ==========================================
export const applicationVersions = pgTable("application_versions", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 50 }).notNull(),
  changelog: text("changelog"),
  downloadUrl: text("download_url"),
  checksum: varchar("checksum", { length: 128 }),
  isRequired: boolean("is_required").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applicationFiles = pgTable("application_files", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  checksum: varchar("checksum", { length: 128 }),
  version: varchar("version", { length: 50 }),
  storageType: varchar("storage_type", { length: 50 }).default("s3_compatible"),
  storagePath: text("storage_path").notNull(),
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// 9. REMOTE VARIABLES / FEATURE FLAGS
// ==========================================
export const remoteVariables = pgTable("remote_variables", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("STRING"), // STRING, NUMBER, BOOLEAN, JSON
  isClientExposed: boolean("is_client_exposed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  varKeyIdx: uniqueIndex("remote_var_key_idx").on(table.applicationId, table.key),
}));

// ==========================================
// 10. WEBHOOKS & DELIVERIES
// ==========================================
export const webhooks = pgTable("webhooks", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: jsonb("events").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE, PAUSED
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id").notNull().references(() => webhooks.id, { onDelete: "cascade" }),
  event: varchar("event", { length: 100 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  success: boolean("success").notNull(),
  attempts: integer("attempts").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// 11. AUTH LOGS & AUDIT LOGS
// ==========================================
export const authLogs = pgTable("auth_logs", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  event: varchar("event", { length: 50 }).notNull(),
  userIdentifier: varchar("user_identifier", { length: 100 }),
  licenseKeyMasked: varchar("license_key_masked", { length: 128 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull(), // SUCCESS, FAILED, BLOCKED
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  authLogAppIdx: index("auth_log_app_idx").on(table.applicationId, table.createdAt),
}));

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull(),
  resourceId: varchar("resource_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  auditLogCreatedIdx: index("audit_log_created_idx").on(table.createdAt),
}));
