import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

interface DeathCertificateData {
  id: string;
  certificateNumber: string;
  deceasedName: string;
  citizenId: string | null;
  dateOfDeath: Date;
  timeOfDeath: Date | null;
  locationOfDeath: string;
  cause: string;
  causeDescription: string;
  doctor: { username: string };
  organization: { name: string; callsign: string };
  additionalNotes: string | null;
  createdAt: Date;
}

const causeLabels: Record<string, string> = {
  NATURAL: 'Natürlich',
  ACCIDENT: 'Unfall',
  HOMICIDE: 'Tötungsdelikt',
  SUICIDE: 'Suizid',
  UNKNOWN: 'Unbekannt',
};

export async function generateDeathCertificatePDF(cert: DeathCertificateData): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'death-certificates');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `death-cert-${cert.id}-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);

  const safeCauseDesc = cert.causeDescription
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeNotes = (cert.additionalNotes ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const causeLabel = causeLabels[cert.cause] ?? cert.cause;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Totenschein – ${cert.certificateNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    .header { border-bottom: 3px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
    .header .doc-type { font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; color: #1e293b; }
    .header .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; letter-spacing: 1px; }
    .cert-number { font-family: monospace; font-size: 13px; color: #64748b; margin-top: 8px; }
    .deceased-name { font-size: 26px; font-weight: bold; color: #1e293b; text-align: center; margin: 24px 0 8px; padding: 16px; background: #f1f5f9; border: 2px solid #334155; border-radius: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-item label { font-size: 11px; text-transform: uppercase; color: #64748b; display: block; }
    .meta-item span { font-weight: 600; color: #1e293b; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
    .content { line-height: 1.7; white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; }
    .cause-badge { display: inline-block; background: #1e293b; color: white; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: bold; }
    .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .signature-line { border-top: 1px solid #64748b; padding-top: 8px; text-align: center; font-size: 11px; color: #64748b; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="doc-type">Totenschein</div>
    <div class="subtitle">Amtliche Sterbeurkunde</div>
    <div class="cert-number">${cert.certificateNumber}</div>
  </div>
  <div class="deceased-name">${cert.deceasedName}</div>
  <div style="text-align:center;margin-bottom:20px;color:#64748b;font-size:13px;">
    ${cert.citizenId ? `Bürger-ID: ${cert.citizenId}` : ''}
  </div>
  <div class="meta">
    <div class="meta-item">
      <label>Todesdatum</label>
      <span>${format(new Date(cert.dateOfDeath), 'dd.MM.yyyy')}</span>
    </div>
    <div class="meta-item">
      <label>Todeszeit</label>
      <span>${cert.timeOfDeath ? format(new Date(cert.timeOfDeath), 'HH:mm') : '—'}</span>
    </div>
    <div class="meta-item">
      <label>Todesort</label>
      <span>${cert.locationOfDeath}</span>
    </div>
    <div class="meta-item">
      <label>Todesursache</label>
      <span><span class="cause-badge">${causeLabel}</span></span>
    </div>
    <div class="meta-item">
      <label>Ausstellende Organisation</label>
      <span>${cert.organization.callsign} – ${cert.organization.name}</span>
    </div>
    <div class="meta-item">
      <label>Ausstellender Arzt</label>
      <span>${cert.doctor.username}</span>
    </div>
  </div>
  <div class="section">
    <h2>Beschreibung der Todesursache</h2>
    <div class="content">${safeCauseDesc}</div>
  </div>
  ${safeNotes ? `
  <div class="section">
    <h2>Zusätzliche Anmerkungen</h2>
    <div class="content">${safeNotes}</div>
  </div>` : ''}
  <div class="signature-area">
    <div class="signature-line">Unterschrift des Arztes</div>
    <div class="signature-line">Amtliches Siegel</div>
  </div>
  <div class="footer">
    Ausgestellt am ${format(new Date(cert.createdAt), 'dd.MM.yyyy')} | ${cert.organization.name} | FiveM CAD System
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: filepath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/death-certificates/${filename}`;
}
