import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import type { ReportWithRelations } from '@/types';
import { format } from 'date-fns';

export async function generateReportPDF(report: ReportWithRelations): Promise<string> {
  const reportsDir = path.join(process.cwd(), 'public', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `report-${report.id}-${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);

  const safeContent = report.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; color: #1e3a5f; }
    .header .badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; margin-top: 8px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; background: #f8fafc; padding: 16px; border-radius: 8px; }
    .meta-item label { font-size: 11px; text-transform: uppercase; color: #64748b; display: block; }
    .meta-item span { font-weight: 600; color: #1e293b; }
    .content { line-height: 1.7; white-space: pre-wrap; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    <span class="badge">${report.type}</span>
  </div>
  <div class="meta">
    <div class="meta-item">
      <label>Bericht-ID</label>
      <span>${report.id}</span>
    </div>
    <div class="meta-item">
      <label>Typ</label>
      <span>${report.type}</span>
    </div>
    <div class="meta-item">
      <label>Erstellt von</label>
      <span>${report.author.username}</span>
    </div>
    <div class="meta-item">
      <label>Erstellt am</label>
      <span>${format(new Date(report.createdAt), 'dd.MM.yyyy HH:mm')}</span>
    </div>
    ${report.incident ? `
    <div class="meta-item">
      <label>Fallnummer</label>
      <span>${report.incident.caseNumber}</span>
    </div>
    <div class="meta-item">
      <label>Einsatztyp</label>
      <span>${report.incident.type}</span>
    </div>` : ''}
  </div>
  <div class="content">${safeContent}</div>
  <div class="footer">
    Generiert am ${format(new Date(), 'dd.MM.yyyy HH:mm:ss')} | FiveM CAD System
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
  return `${baseUrl}/reports/${filename}`;
}
