/**
 * Datenbankschicht (Sequelize + PostgreSQL).
 * Multi-Tenant: alle fachlichen Entitäten hängen an einem Tenant (F.2).
 */
import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { config } from "../config";
import { Role, WorkflowState } from "../core/workflow";

export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: "postgres",
  logging: false,
});

// ---------------------------------------------------------------- Tenant
export class Tenant extends Model {
  declare id: string;
  declare name: string;
}
Tenant.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, modelName: "tenant", underscored: true }
);

// ------------------------------------------------------------------ User
export class User extends Model {
  declare id: string;
  declare tenantId: string;
  declare email: string;
  declare name: string;
  declare passwordHash: string;
  declare role: Role;
  declare active: boolean;
}
User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM(...Object.values(Role)),
      allowNull: false,
      defaultValue: Role.CREATOR,
    },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: "user", underscored: true }
);

// ---------------------------------------------------------- ServiceGroup
export class ServiceGroup extends Model {
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare department: string | null;
  declare status: WorkflowState;
  declare version: number;
  declare createdById: string;
  declare dueDate: string | null;
}
ServiceGroup.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    department: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM(...Object.values(WorkflowState)),
      allowNull: false,
      defaultValue: WorkflowState.ENTWURF,
    },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    createdById: { type: DataTypes.UUID, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY },
  },
  {
    sequelize,
    modelName: "service_group",
    underscored: true,
    indexes: [
      // Eindeutigkeit Service-Name pro Mandant (B.1)
      { unique: true, fields: ["tenant_id", "name"] },
      { fields: ["status"] },
    ],
  }
);

// --------------------------------------------------------- ModuleInstance
export class ModuleInstance extends Model {
  declare id: string;
  declare serviceGroupId: string;
  declare moduleKey: string;
  declare data: Record<string, unknown>;
  declare completeness: number;
  declare version: number;
  declare updatedById: string | null;
}
ModuleInstance.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    serviceGroupId: { type: DataTypes.UUID, allowNull: false },
    moduleKey: { type: DataTypes.STRING, allowNull: false },
    data: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    completeness: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    updatedById: { type: DataTypes.UUID },
  },
  {
    sequelize,
    modelName: "module_instance",
    underscored: true,
    indexes: [{ unique: true, fields: ["service_group_id", "module_key"] }],
  }
);

// ---------------------------------------------------------- ModuleVersion
export class ModuleVersion extends Model {
  declare id: string;
  declare moduleInstanceId: string;
  declare version: number;
  declare data: Record<string, unknown>;
  declare createdById: string;
  declare comment: string | null;
}
ModuleVersion.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    moduleInstanceId: { type: DataTypes.UUID, allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.JSONB, allowNull: false },
    createdById: { type: DataTypes.UUID, allowNull: false },
    comment: { type: DataTypes.STRING },
  },
  { sequelize, modelName: "module_version", underscored: true }
);

// ---------------------------------------------------------- ReviewComment
export class ReviewComment extends Model {
  declare id: string;
  declare serviceGroupId: string;
  declare moduleKey: string | null;
  declare fieldKey: string | null;
  declare authorId: string;
  declare text: string;
  declare severity: "KRITISCH" | "OPTIONAL";
  declare status: "OFFEN" | "KORRIGIERT" | "ERLEDIGT";
  declare parentId: string | null;
}
ReviewComment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    serviceGroupId: { type: DataTypes.UUID, allowNull: false },
    moduleKey: { type: DataTypes.STRING },
    fieldKey: { type: DataTypes.STRING },
    authorId: { type: DataTypes.UUID, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    severity: {
      type: DataTypes.ENUM("KRITISCH", "OPTIONAL"),
      allowNull: false,
      defaultValue: "OPTIONAL",
    },
    status: {
      type: DataTypes.ENUM("OFFEN", "KORRIGIERT", "ERLEDIGT"),
      allowNull: false,
      defaultValue: "OFFEN",
    },
    parentId: { type: DataTypes.UUID },
  },
  { sequelize, modelName: "review_comment", underscored: true }
);

// ---------------------------------------------------------- WorkflowEvent
export class WorkflowEvent extends Model {
  declare id: string;
  declare serviceGroupId: string;
  declare fromState: string;
  declare toState: string;
  declare action: string;
  declare reason: string | null;
  declare category: string | null;
  declare userId: string;
}
WorkflowEvent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    serviceGroupId: { type: DataTypes.UUID, allowNull: false },
    fromState: { type: DataTypes.STRING, allowNull: false },
    toState: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING },
    userId: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, modelName: "workflow_event", underscored: true }
);

// --------------------------------------------------------------- AuditLog
export class AuditLog extends Model {
  declare id: string;
  declare tenantId: string;
  declare userId: string | null;
  declare action: string;
  declare entityType: string;
  declare entityId: string | null;
  declare oldValue: unknown;
  declare newValue: unknown;
  declare ip: string | null;
}
AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID },
    action: { type: DataTypes.STRING, allowNull: false },
    entityType: { type: DataTypes.STRING, allowNull: false },
    entityId: { type: DataTypes.UUID },
    oldValue: { type: DataTypes.JSONB },
    newValue: { type: DataTypes.JSONB },
    ip: { type: DataTypes.STRING },
  },
  {
    sequelize,
    modelName: "audit_log",
    underscored: true,
    indexes: [{ fields: ["tenant_id", "created_at"] }],
  }
);

// ------------------------------------------------------------ Notification
export class Notification extends Model {
  declare id: string;
  declare userId: string;
  declare type: string;
  declare message: string;
  declare link: string | null;
  declare read: boolean;
}
Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    link: { type: DataTypes.STRING },
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, modelName: "notification", underscored: true }
);

// ------------------------------------------------------------ RefreshToken
export class RefreshToken extends Model {
  declare id: string;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
}
RefreshToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    token: { type: DataTypes.STRING(512), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, modelName: "refresh_token", underscored: true }
);

// -------------------------------------------------------------- Attachment
export class Attachment extends Model {
  declare id: string;
  declare serviceGroupId: string;
  declare moduleKey: string;
  declare fieldKey: string | null;
  declare filename: string;
  declare mimetype: string;
  declare size: number;
  declare path: string;
  declare altText: string | null;
  declare uploadedById: string;
}
Attachment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    serviceGroupId: { type: DataTypes.UUID, allowNull: false },
    moduleKey: { type: DataTypes.STRING, allowNull: false },
    fieldKey: { type: DataTypes.STRING },
    filename: { type: DataTypes.STRING, allowNull: false },
    mimetype: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.INTEGER, allowNull: false },
    path: { type: DataTypes.STRING, allowNull: false },
    altText: { type: DataTypes.STRING },
    uploadedById: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, modelName: "attachment", underscored: true }
);

// -------------------------------------------------------------- Relations
Tenant.hasMany(User, { foreignKey: "tenantId" });
User.belongsTo(Tenant, { foreignKey: "tenantId" });

ServiceGroup.belongsTo(User, { as: "createdBy", foreignKey: "createdById" });
ServiceGroup.hasMany(ModuleInstance, { foreignKey: "serviceGroupId", as: "modules" });
ModuleInstance.belongsTo(ServiceGroup, { foreignKey: "serviceGroupId" });
ModuleInstance.hasMany(ModuleVersion, { foreignKey: "moduleInstanceId", as: "versions" });
ReviewComment.belongsTo(User, { as: "author", foreignKey: "authorId" });
ReviewComment.belongsTo(ServiceGroup, { foreignKey: "serviceGroupId" });
WorkflowEvent.belongsTo(User, { foreignKey: "userId" });
WorkflowEvent.belongsTo(ServiceGroup, { foreignKey: "serviceGroupId" });
AuditLog.belongsTo(User, { foreignKey: "userId" });
Notification.belongsTo(User, { foreignKey: "userId" });
Attachment.belongsTo(ServiceGroup, { foreignKey: "serviceGroupId" });

export async function initDb(): Promise<void> {
  await sequelize.authenticate();
  // Für Produktionsbetrieb: versionierte Migrationen (umzug) statt sync
  await sequelize.sync();
}
