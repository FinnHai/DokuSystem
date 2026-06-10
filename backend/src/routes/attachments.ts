import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { config } from "../config";
import { Attachment, ServiceGroup } from "../db";
import { requireAuth } from "../middleware/auth";
import { HttpError, wrap } from "../middleware/errors";
import { audit } from "../services/audit";

const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

fs.mkdirSync(config.uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    // Upload-Validierung: nur erlaubte Typen (H.11); Virus-Scan ist als
    // Integrationspunkt (ICAP/ClamAV) für den Produktionsbetrieb vorgesehen.
    cb(null, ALLOWED_MIME.includes(file.mimetype));
  },
});

export const attachmentRouter = Router();
attachmentRouter.use(requireAuth);

attachmentRouter.post(
  "/:id/attachments",
  upload.single("file"),
  wrap(async (req, res) => {
    const group = await ServiceGroup.findOne({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    if (!group) throw new HttpError(404, "Servicegruppe nicht gefunden");
    if (!req.file) {
      throw new HttpError(400, "Datei fehlt oder Dateityp nicht erlaubt (PDF, PNG, JPG, SVG, Excel)");
    }
    const attachment = await Attachment.create({
      serviceGroupId: group.id,
      moduleKey: String(req.body.moduleKey ?? ""),
      fieldKey: req.body.fieldKey ? String(req.body.fieldKey) : null,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      altText: req.body.altText ? String(req.body.altText) : null,
      uploadedById: req.user!.id,
    });
    await audit(req, {
      action: "attachment.uploaded",
      entityType: "Attachment",
      entityId: attachment.id,
      newValue: { filename: req.file.originalname, size: req.file.size },
    });
    res.status(201).json(attachment);
  })
);

attachmentRouter.get(
  "/:id/attachments",
  wrap(async (req, res) => {
    const group = await ServiceGroup.findOne({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    if (!group) throw new HttpError(404, "Servicegruppe nicht gefunden");
    const where: Record<string, unknown> = { serviceGroupId: group.id };
    if (req.query.moduleKey) where.moduleKey = String(req.query.moduleKey);
    res.json(await Attachment.findAll({ where, order: [["createdAt", "DESC"]] }));
  })
);

attachmentRouter.get(
  "/:id/attachments/:attachmentId/download",
  wrap(async (req, res) => {
    const group = await ServiceGroup.findOne({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    if (!group) throw new HttpError(404, "Servicegruppe nicht gefunden");
    const attachment = await Attachment.findOne({
      where: { id: req.params.attachmentId, serviceGroupId: group.id },
    });
    if (!attachment) throw new HttpError(404, "Anhang nicht gefunden");
    res.download(attachment.path, attachment.filename);
  })
);
