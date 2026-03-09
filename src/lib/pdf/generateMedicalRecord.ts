import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

interface MedicalRecordData {
  id: string;
  recordNumber: string;
  citizenName: string;
  citizenId: string | null;
  diagnosis: string;
  treatment: string | null;
  medications: string | null;
  bloodType: string | null;
  allergies: string | null;
  author: { username: string };
  organization: { name: string; callsign: string };
  confidential: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function generateMedicalRecordPDF(record: MedicalRecordData): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'medical-records');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `medical-${record.id}-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);

  const safeDiagnosis = record.diagnosis
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeTreatment = (record.treatment ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Medizinische Akte – ${record.recordNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    .confidential-stamp { 
      ${record.confidential ? `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg);
      font-size: 80px; font-weight: bold; color: rgba(239,68,68,0.12); text-transform: uppercase;
      letter-spacing: 8px; pointer-events: none; white-space: nowrap; z-index: 0;` : 'display:none;'}
    }
    .content-wrapper { position: relative; z-index: 1; }
    .header { border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { margin: 0; font-size: 22px; color: #1e3a5f; }
    .doc-type { font-size: 14px; font-weight: bold; color: #22c55e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .record-number { font-family: monospace; font-size: 13px; color: #64748b; margin-top: 4px; }
    ${record.confidential ? `.confidential-badge { display: inline-block; background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 2px solid #dc2626; }` : ''}
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; background: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0; }
    .meta-item label { font-size: 11px; text-transform: uppercase; color: #64748b; display: block; }
    .meta-item span { font-weight: 600; color: #1e293b; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
    .content { line-height: 1.7; white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; }
    .vital-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .vital-item { background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .vital-item .label { font-size: 11px; text-transform: uppercase; color: #64748b; }
    .vital-item .value { font-weight: 600; color: #1e293b; margin-top: 2px; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="confidential-stamp">VERTRAULICH</div>
  <div class="content-wrapper">
    <div class="header">
      <div>
        <div class="doc-type">Medizinische Akte</div>
        <h1>${record.citizenName}</h1>
        <div class="record-number">${record.recordNumber}</div>
      </div>
      ${record.confidential ? `<span class="confidential-badge">VERTRAULICH</span>` : ''}
    </div>
    <div class="meta">
      <div class="meta-item">
        <label>Bürger-ID</label>
        <span>${record.citizenId ?? '—'}</span>
      </div>
      <div class="meta-item">
        <label>Behandelnder Arzt</label>
        <span>${record.author.username}</span>
      </div>
      <div class="meta-item">
        <label>Organisation</label>
        <span>${record.organization.callsign} – ${record.organization.name}</span>
      </div>
      <div class="meta-item">
        <label>Erstellt am</label>
        <span>${format(new Date(record.createdAt), 'dd.MM.yyyy HH:mm')}</span>
      </div>
    </div>
    ${record.bloodType || record.allergies ? `
    <div class="section">
      <h2>Vitalinformationen</h2>
      <div class="vital-grid">
        ${record.bloodType ? `<div class="vital-item"><div class="label">Blutgruppe</div><div class="value">${record.bloodType}</div></div>` : ''}
        ${record.allergies ? `<div class="vital-item"><div class="label">Allergien</div><div class="value">${record.allergies}</div></div>` : ''}
      </div>
    </div>` : ''}
    <div class="section">
      <h2>Diagnose</h2>
      <div class="content">${safeDiagnosis}</div>
    </div>
    ${safeTreatment ? `
    <div class="section">
      <h2>Behandlung</h2>
      <div class="content">${safeTreatment}</div>
    </div>` : ''}
    ${record.medications ? `
    <div class="section">
      <h2>Medikamente</h2>
      <div class="content">${record.medications}</div>
    </div>` : ''}
    <div class="footer">
      ${record.confidential ? '<strong>⚠ VERTRAULICHES DOKUMENT – Nur für autorisiertes medizinisches Personal</strong><br>' : ''}
      Generiert am ${format(new Date(), 'dd.MM.yyyy HH:mm:ss')} | ${record.organization.name} | FiveM CAD System
    </div>
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
  return `${baseUrl}/medical-records/${filename}`;
}
