import { PrismaClient, Role, OrgType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const allPermissionsTrue = {
  canViewIncidents: true,
  canCreateIncidents: true,
  canViewWarrants: true,
  canCreateWarrants: true,
  canViewReports: true,
  canCreateReports: true,
  canViewCitizens: true,
  canViewVehicles: true,
  canManageUnits: true,
  canViewLaws: true,
  canCreateLaws: true,
  canViewVerdicts: true,
  canCreateVerdicts: true,
  canViewCharges: true,
  canCreateCharges: true,
  canViewCaseFiles: true,
  canCreateCaseFiles: true,
  canViewDeathCerts: true,
  canCreateDeathCerts: true,
  canViewMedicalRecords: true,
  canCreateMedicalRecords: true,
  canViewAdminLog: true,
  canViewNews: true,
  canCreateNews: true,
  canViewWarnings: true,
  canCreateWarnings: true,
  canViewTrainingRecords: true,
  canCreateTrainingRecords: true,
  canViewDispatchLog: true,
  canCreateDispatchLog: true,
};

async function main() {
  const police = await prisma.organization.upsert({
    where: { name: 'Los Santos Police Department' },
    update: {},
    create: {
      name: 'Los Santos Police Department',
      type: OrgType.POLICE,
      callsign: 'LSPD',
      color: '#3b82f6',
      description: 'Los Santos Police Department',
    },
  });

  const ems = await prisma.organization.upsert({
    where: { name: 'Emergency Medical Services' },
    update: {},
    create: {
      name: 'Emergency Medical Services',
      type: OrgType.AMBULANCE,
      callsign: 'EMS',
      color: '#ef4444',
      description: 'Emergency Medical Services',
    },
  });

  const lsfd = await prisma.organization.upsert({
    where: { name: 'Los Santos Fire Department' },
    update: {},
    create: {
      name: 'Los Santos Fire Department',
      type: OrgType.FIRE,
      callsign: 'LSFD',
      color: '#f97316',
      description: 'Los Santos Fire Department',
    },
  });

  const doj = await prisma.organization.upsert({
    where: { name: 'Department of Justice' },
    update: {},
    create: {
      name: 'Department of Justice',
      type: OrgType.DOJ,
      callsign: 'DOJ',
      color: '#a855f7',
      description: 'Department of Justice',
    },
  });

  // Ensure all organizations have full permissions
  for (const org of [police, ems, lsfd, doj]) {
    await prisma.orgPermission.upsert({
      where: { organizationId: org.id },
      update: allPermissionsTrue,
      create: { organizationId: org.id, ...allPermissionsTrue },
    });
  }

  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@cad.local',
      password: hashedPassword,
      role: Role.ADMIN,
      organizationId: police.id,
    },
  });

  const citizen = await prisma.citizen.upsert({
    where: { citizenId: 'CIT-001' },
    update: {},
    create: {
      firstName: 'Max',
      lastName: 'Mustermann',
      citizenId: 'CIT-001',
      gender: 'männlich',
      phone: '555-0100',
      address: 'Vinewood Hills 1, Los Santos',
      nationality: 'US-Amerikanisch',
      notes: 'Beispiel-Bürger',
    },
  });

  await prisma.vehicle.upsert({
    where: { plate: 'LSCA-001' },
    update: {},
    create: {
      plate: 'LSCA-001',
      model: 'Kuruma',
      color: 'Schwarz',
      ownerId: citizen.citizenId,
    },
  });

  console.log('Seeding fine catalog...');
  const fineEntries = [
    { offense: 'Mord', category: 'Verbrechen', legalSection: 'PEN §4.1', fineMin: 10000, fineMax: 20000, jailMin: 24, jailMax: 30, seizure: 'Tatwaffe; Hülsen; Blutgeld/Geldmittel; Fluchtfahrzeug', additionalInfo: 'Höchstes Delikt gegen das Leben; keine Bewährung empfohlen.' },
    { offense: 'Totschlag', category: 'Verbrechen', legalSection: 'PEN §4.2', fineMin: 8000, fineMax: 16000, jailMin: 18, jailMax: 24, seizure: 'Tatwaffe; Fluchtfahrzeug; Erlöse', additionalInfo: 'Vorsätzlich aber ohne besondere Heimtücke/Vorsatzstufe wie Mord.' },
    { offense: 'Versuch der Tötung', category: 'Verbrechen', legalSection: 'PEN §4.4', fineMin: 7000, fineMax: 15000, jailMin: 16, jailMax: 22, seizure: 'Tatwaffe; Fluchtfahrzeug', additionalInfo: 'Versuch eine Person zu töten; Erfolg (Tod) bleibt aus.' },
    { offense: 'Schwere Körperverletzung', category: 'Verbrechen', legalSection: 'PEN §5.2', fineMin: 5000, fineMax: 12000, jailMin: 10, jailMax: 18, seizure: 'Tatwaffen; gefährliche Gegenstände', additionalInfo: 'Massive Verletzungen Einsatz von Waffen oder besonders gefährlichen Mitteln.' },
    { offense: 'Gefährliche Körperverletzung', category: 'Verbrechen', legalSection: 'PEN §5.3', fineMin: 4000, fineMax: 10000, jailMin: 8, jailMax: 16, seizure: 'Tatwaffen; gefährliche Gegenstände', additionalInfo: 'Körperverletzung unter Einsatz gefährlicher Mittel/Umstände.' },
    { offense: 'Entführung', category: 'Verbrechen', legalSection: 'PEN §6.3', fineMin: 6000, fineMax: 15000, jailMin: 16, jailMax: 24, seizure: 'Fahrzeuge; Fesseln; Lösegeld; Kommunikationsmittel', additionalInfo: 'Freiheitsentzug einer Person gegen ihren Willen.' },
    { offense: 'Geiselnahme', category: 'Verbrechen', legalSection: 'PEN §6.4', fineMin: 8000, fineMax: 17000, jailMin: 18, jailMax: 26, seizure: 'Waffen; Fahrzeuge; Lösegeld; Kommunikationsmittel', additionalInfo: 'Freiheitsentzug mit Druckmittel gegenüber Dritten.' },
    { offense: 'Schwerer Diebstahl', category: 'Verbrechen', legalSection: 'PEN §7.2', fineMin: 4000, fineMax: 10000, jailMin: 8, jailMax: 16, seizure: 'Diebesgut; Tatwerkzeuge; Fahrzeuge', additionalInfo: 'Diebstahl besonders hoher Werte oder unter erschwerenden Umständen.' },
    { offense: 'Raub', category: 'Verbrechen', legalSection: 'PEN §7.3', fineMin: 6000, fineMax: 14000, jailMin: 12, jailMax: 20, seizure: 'Beute; Tatwaffe; Fluchtfahrzeug', additionalInfo: 'Wegnahme unter Gewalt oder Drohung mit Gewalt.' },
    { offense: 'Erpressung', category: 'Verbrechen', legalSection: 'PEN §7.4', fineMin: 4000, fineMax: 12000, jailMin: 8, jailMax: 18, seizure: 'Erlangtes Geld/Vermögen; Kommunikationsmittel', additionalInfo: 'Nötigung zur Vermögensverfügung durch Drohung.' },
    { offense: 'Brandstiftung', category: 'Verbrechen', legalSection: 'PEN §7.8', fineMin: 6000, fineMax: 15000, jailMin: 14, jailMax: 22, seizure: 'Brandmittel; Zündvorrichtungen', additionalInfo: 'Vorsätzliche Inbrandsetzung fremden Eigentums.' },
    { offense: 'Korruption und Bestechung', category: 'Verbrechen', legalSection: 'PEN §8.2', fineMin: 6000, fineMax: 15000, jailMin: 8, jailMax: 18, seizure: 'Bestechungsgelder; Vermögensvorteile', additionalInfo: 'Amtsträger oder andere gegen Vorteil zu pflichtwidrigen Handlungen bewegen.' },
    { offense: 'Aufruhr oder Volksverhetzung', category: 'Verbrechen', legalSection: 'PEN §8.6', fineMin: 4000, fineMax: 12000, jailMin: 8, jailMax: 18, seizure: 'Propagandamittel; Kommunikationsmittel', additionalInfo: 'Aufruf zu Gewalt gegen Gruppen/Staat oder massiver Aufruhr.' },
    { offense: 'Street Racing mit Gefährdung', category: 'Verbrechen', legalSection: 'PEN §9.5', fineMin: 3000, fineMax: 9000, jailMin: 6, jailMax: 12, seizure: 'Fahrzeug(e); Tuningteile', additionalInfo: 'Illegales Rennen mit konkreter Gefahr für Leib/Leben oder schwere Unfälle.' },
    { offense: 'Organisiertes oder gewinnorientiertes Racing', category: 'Verbrechen', legalSection: 'PEN §9.6', fineMin: 8000, fineMax: 15000, jailMin: 6, jailMax: 18, seizure: 'Fahrzeug(e)', additionalInfo: 'Illegales Autorennen mit konkreten Hinweisen auf Rennorganisation oder Gewinnenauslobung' },
    { offense: 'Fahren unter erheblicher Fahruntüchtigkeit', category: 'Verbrechen', legalSection: 'PEN §12', fineMin: 4000, fineMax: 10000, jailMin: 8, jailMax: 18, seizure: 'Fahrzeug', additionalInfo: 'Fahrer zeigt starke Ausfallerscheinungen durch Einwirkung von Alkohol oder Drogen.' },
    { offense: 'Unfall mit Personenschaden & Fahrerflucht', category: 'Verbrechen', legalSection: 'PEN §9.3', fineMin: 4000, fineMax: 16000, jailMin: 6, jailMax: 24, seizure: 'Fahrzeug', additionalInfo: 'Körperverletzung in Tateinheit mit verlassen des Unfallortes ohne Hilfe zu leisten.' },
    { offense: 'Verbotene Waffen', category: 'Verbrechen', legalSection: 'PEN §10.3', fineMin: 5000, fineMax: 14000, jailMin: 10, jailMax: 20, seizure: 'Verbotene Schusswaffen; Munition; Waffenpapiere', additionalInfo: 'Besitz/Herstellung/Vertrieb verbotener Waffen.' },
    { offense: 'Explosivstoffe', category: 'Verbrechen', legalSection: 'PEN §10.4', fineMin: 8000, fineMax: 18000, jailMin: 16, jailMax: 26, seizure: 'Explosivstoffe; Zünder; Sprengvorrichtungen', additionalInfo: 'Unerlaubter Besitz oder Umgang mit Spreng-/Explosivstoffen.' },
    { offense: 'Herstellung/Anbau illegaler Substanzen', category: 'Verbrechen', legalSection: 'CDC §3.1', fineMin: 2000, fineMax: 10000, jailMin: 10, jailMax: 18, seizure: 'Anlagen/Pflanzen Produktionsmittel', additionalInfo: 'Produktion von Drogen' },
    { offense: 'Besitz größerer Mengen illegaler Substanzen', category: 'Verbrechen', legalSection: 'CDC §3.1', fineMin: 2000, fineMax: 15000, jailMin: 10, jailMax: 22, seizure: 'Substanzen', additionalInfo: 'Besitz von Drogen über Handelsmenge' },
    { offense: 'Besitz von Herstellungsutensilien', category: 'Verbrechen', legalSection: 'CDC §3.2', fineMin: 1000, fineMax: 5000, jailMin: 5, jailMax: 16, seizure: 'Ausrüstung Chemikalien', additionalInfo: 'Besitz von Equipment zur Drogenproduktion' },
    { offense: 'Handel mit illegalen Substanzen', category: 'Verbrechen', legalSection: 'CDC §3.3', fineMin: 2500, fineMax: 15000, jailMin: 15, jailMax: 22, seizure: 'Substanzen; Vermögenswerte; Transportmitteln', additionalInfo: 'Verkauf/Verteilung illegaler Drogen' },
    { offense: 'Grenzüberschreitender Transport illegaler Drogen', category: 'Verbrechen', legalSection: 'PEN §11.3', fineMin: 2500, fineMax: 15000, jailMin: 15, jailMax: 22, seizure: 'Substanzen; Vermögenswerte; Transportmitteln', additionalInfo: 'Transport illegaler Drogen' },
    { offense: 'Meineid', category: 'Verbrechen', legalSection: 'PEN §13.3', fineMin: 1500, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: '—', additionalInfo: 'Falschaussage unter Eid.' },
    { offense: 'Fahrlässige Tötung', category: 'Vergehen', legalSection: 'PEN §4.3', fineMin: 4000, fineMax: 8000, jailMin: 1, jailMax: 4, seizure: 'Fahrzeug/Werkzeuge; ggf. Führerschein', additionalInfo: 'Tod durch grobe Fahrlässigkeit kein Vorsatz zur Tötung.' },
    { offense: 'Einfache Körperverletzung', category: 'Vergehen', legalSection: 'PEN §5.1', fineMin: 1000, fineMax: 5000, jailMin: 0, jailMax: 3, seizure: 'Tatwerkzeuge (falls vorhanden)', additionalInfo: 'Körperliche Misshandlung ohne schwere Folgen.' },
    { offense: 'Fahrlässige Körperverletzung', category: 'Vergehen', legalSection: 'PEN §5.4', fineMin: 800, fineMax: 4000, jailMin: 0, jailMax: 2, seizure: 'Fahrzeug/Werkzeuge', additionalInfo: 'Verletzung durch Sorgfaltspflichtverletzung.' },
    { offense: 'Freiheitsberaubung', category: 'Vergehen', legalSection: 'PEN §6.1', fineMin: 1500, fineMax: 6000, jailMin: 1, jailMax: 4, seizure: 'Fixierungsmittel; Fahrzeuge', additionalInfo: 'Einsperren/Festhalten ohne Rechtfertigung.' },
    { offense: 'Nötigung', category: 'Vergehen', legalSection: 'PEN §6.2', fineMin: 1000, fineMax: 5000, jailMin: 0, jailMax: 3, seizure: 'Mittel der Drohung', additionalInfo: 'Erzwingen eines Verhaltens durch Drohung/Gewaltandrohung.' },
    { offense: 'Diebstahl', category: 'Vergehen', legalSection: 'PEN §7.1', fineMin: 800, fineMax: 4000, jailMin: 0, jailMax: 3, seizure: 'Diebesgut; Tatmittel', additionalInfo: 'Wegnahme fremder beweglicher Sachen.' },
    { offense: 'Betrug', category: 'Vergehen', legalSection: 'PEN §7.5', fineMin: 1000, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: 'Erlange Vermögenswerte; Dokumente', additionalInfo: 'Täuschung zur Erlangung eines Vermögensvorteils.' },
    { offense: 'Unterschlagung', category: 'Vergehen', legalSection: 'PEN §7.6', fineMin: 800, fineMax: 5000, jailMin: 0, jailMax: 3, seizure: 'Unterschlagene Gegenstände', additionalInfo: 'Zueignung anvertrauter Sachen.' },
    { offense: 'Sachbeschädigung', category: 'Vergehen', legalSection: 'PEN §7.7', fineMin: 500, fineMax: 4000, jailMin: 0, jailMax: 2, seizure: 'Tatmittel', additionalInfo: 'Beschädigung/Zerstörung fremder Sachen.' },
    { offense: 'Amtsanmaßung', category: 'Vergehen', legalSection: 'PEN §8.1', fineMin: 1000, fineMax: 5000, jailMin: 0, jailMax: 3, seizure: 'Uniforms-/Ausrüstungsimitate', additionalInfo: 'Sich als Amtsträger ausgeben.' },
    { offense: 'Widerstand gegen Vollstreckungsbeamte', category: 'Vergehen', legalSection: 'PEN §8.3', fineMin: 1500, fineMax: 6000, jailMin: 1, jailMax: 4, seizure: 'Tatmittel; ggf. Fahrzeug', additionalInfo: 'Aktiver Widerstand gegen LEO im Dienst.' },
    { offense: 'Behinderung staatlicher Maßnahmen', category: 'Vergehen', legalSection: 'PEN §8.4', fineMin: 1000, fineMax: 5000, jailMin: 0, jailMax: 3, seizure: 'Tatmittel; Kommunikationsmittel', additionalInfo: 'Blockade/Behinderung polizeilicher Maßnahmen.' },
    { offense: 'Störung des öffentlichen Friedens', category: 'Vergehen', legalSection: 'PEN §8.5', fineMin: 500, fineMax: 4000, jailMin: 0, jailMax: 2, seizure: 'Lautsprecher/Equipment', additionalInfo: 'Aggressives Verhalten in der Öffentlichkeit.' },
    { offense: 'Gefährdung des Straßenverkehrs', category: 'Vergehen', legalSection: 'PEN §9.1', fineMin: 1000, fineMax: 6000, jailMin: 0, jailMax: 3, seizure: 'Fahrzeug; ggf. Führerschein', additionalInfo: 'Grob verkehrswidriges Verhalten.' },
    { offense: 'Fahren unter Einfluss', category: 'Vergehen', legalSection: 'PEN §9.2', fineMin: 1500, fineMax: 6000, jailMin: 1, jailMax: 4, seizure: 'Fahrzeug; Führerschein', additionalInfo: 'Fahren unter Alkohol-/Drogeneinfluss.' },
    { offense: 'Fahrerflucht', category: 'Vergehen', legalSection: 'PEN §9.3', fineMin: 1500, fineMax: 6000, jailMin: 1, jailMax: 4, seizure: 'Fahrzeug', additionalInfo: 'Unfallort verlassen ohne Feststellungen zu ermöglichen.' },
    { offense: 'Fahren ohne Fahrerlaubnis', category: 'Vergehen', legalSection: 'PEN §9.4', fineMin: 1000, fineMax: 5000, jailMin: 0, jailMax: 3, seizure: 'Fahrzeug', additionalInfo: 'Kein gültiger Führerschein/entzogen.' },
    { offense: 'Unerlaubter Waffenbesitz', category: 'Vergehen', legalSection: 'PEN §10.1', fineMin: 1500, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: 'Waffe(n); Munition', additionalInfo: 'Besitz erlaubnispflichtiger Waffen ohne gültige Erlaubnis.' },
    { offense: 'Waffenmissbrauch', category: 'Vergehen', legalSection: 'PEN §10.2', fineMin: 1500, fineMax: 6000, jailMin: 1, jailMax: 4, seizure: 'Waffe(n); Munition', additionalInfo: 'Gefährlicher oder unverantwortlicher Umgang mit Waffen.' },
    { offense: 'Besitz verbotener Substanzen', category: 'Vergehen', legalSection: 'PEN §11.1', fineMin: 1000, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: 'Betäubungsmittel; Utensilien', additionalInfo: 'Besitz illegaler Drogen über Eigenbedarf oder harter Substanzen.' },
    { offense: 'Konsum in der Öffentlichkeit', category: 'Vergehen', legalSection: 'PEN §11.4', fineMin: 500, fineMax: 4000, jailMin: 0, jailMax: 2, seizure: 'Drogen/Alkohol am Ort', additionalInfo: 'Konsum in der Öffentlichkeit.' },
    { offense: 'Sexuelle Belästigung', category: 'Vergehen', legalSection: 'PEN §12.1-12.4', fineMin: 1500, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: '—', additionalInfo: 'Unerwünschte sexuelle Handlungen ohne Einverständnis.' },
    { offense: 'Urkundenfälschung', category: 'Vergehen', legalSection: 'PEN §13.1', fineMin: 1500, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: 'Gefälschte Dokumente; Druckmittel', additionalInfo: 'Verändern/herstellen unechter Urkunden.' },
    { offense: 'Fälschung amtlicher Dokumente', category: 'Vergehen', legalSection: 'PEN §13.2', fineMin: 2000, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: 'Amtliche Fälschungen; Stempel', additionalInfo: 'Fälschung von IDs Lizenzen staatlichen Schreiben.' },
    { offense: 'Falschaussage', category: 'Vergehen', legalSection: 'PEN §13.3', fineMin: 1500, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: '—', additionalInfo: 'Falsche Aussage bei behördlichen Befragungen.' },
    { offense: 'Vortäuschen einer Straftat', category: 'Vergehen', legalSection: 'PEN §13.4', fineMin: 800, fineMax: 5000, jailMin: 0, jailMax: 3, seizure: 'Scheinbeweise', additionalInfo: 'Bewusst falsche Anzeige oder Vortäuschen eines Delikts.' },
    { offense: 'Hausfriedensbruch', category: 'Vergehen', legalSection: 'PEN §14.1', fineMin: 500, fineMax: 4000, jailMin: 0, jailMax: 2, seizure: '—', additionalInfo: 'Betreten/Bleiben in Räumen gegen den Willen des Berechtigten.' },
    { offense: 'Missachtung dienstlicher Anweisungen', category: 'Vergehen', legalSection: 'PEN §14.4', fineMin: 500, fineMax: 4000, jailMin: 0, jailMax: 2, seizure: '—', additionalInfo: 'Hartnäckige Weigerung rechtmäßige Anordnungen zu befolgen.' },
    { offense: 'Fahrzeug in unsicherem Zustand', category: 'Vergehen', legalSection: 'SAVC §5.1', fineMin: 500, fineMax: 2000, jailMin: 0, jailMax: 1, seizure: '—', additionalInfo: 'Fahrzeug wird betrieben und weißt Beschädigungen auf.' },
    { offense: 'Verdeckte oder unlesbare Kennzeichen', category: 'Vergehen', legalSection: 'SAVC §3.2', fineMin: 500, fineMax: 2000, jailMin: 0, jailMax: 1, seizure: '—', additionalInfo: 'Vorgesehene Kennzeichen sind nicht lesbar.' },
    { offense: 'Führen einer Schusswaffe in der Öffentlichkeit ohne Ausnahmegenehmigung', category: 'Vergehen', legalSection: 'FGCC §4.3', fineMin: 500, fineMax: 2000, jailMin: 0, jailMax: 1, seizure: 'Waffe(n); Munition', additionalInfo: 'Waffe wird an öffentlichen Orten geführt ohne notwendige Lizenz' },
    { offense: 'Unerlaubter Besitz einer Langwaffe', category: 'Vergehen', legalSection: 'FGCC §5.1', fineMin: 2000, fineMax: 6000, jailMin: 1, jailMax: 3, seizure: 'Waffe(n); Munition', additionalInfo: 'Waffe ist im Besitz einer Person ohne notwendige Lizenz.' },
    { offense: 'Unzulässige Weitergabe/Überlassung von Waffen', category: 'Vergehen', legalSection: 'FGCC §5.2', fineMin: 800, fineMax: 5000, jailMin: 0, jailMax: 4, seizure: 'Waffe(n); Munition', additionalInfo: 'Besitzwechsel von Waffen ohne notwendige Lizenz.' },
    { offense: 'Bewaffnete Gefährdung/Drohung', category: 'Vergehen', legalSection: 'FGCC §7.3', fineMin: 800, fineMax: 6000, jailMin: 1, jailMax: 3, seizure: 'Waffe(n); Munition', additionalInfo: 'Die Waffe wird zur Bedrohung genutzt.' },
    { offense: 'Zweckentfremdung von Gegenständen als Waffe', category: 'Vergehen', legalSection: 'FGCC §7.4', fineMin: 500, fineMax: 6000, jailMin: 0, jailMax: 3, seizure: 'Gegenstand', additionalInfo: 'Ein Gegenstand der zum Angriff als Waffe genutzt wird.' },
    { offense: 'Missachtung einer Entzugs- oder Auflagenentscheidung', category: 'Vergehen', legalSection: 'FGCC §8.1', fineMin: 1000, fineMax: 6000, jailMin: 0, jailMax: 2, seizure: 'Waffe(n); Munition', additionalInfo: 'Missachtung einer gerichtlichen Anweisung.' },
    { offense: 'Besitz illegaler Substanzen (kleine Menge)', category: 'Vergehen', legalSection: 'CDC §3.1', fineMin: 2500, fineMax: 6000, jailMin: 0, jailMax: 2, seizure: 'Illegale Substanzen', additionalInfo: 'Besitz harter Drogen unter Handelsmenge.' },
    { offense: 'Öffentliche Trunkenheit oder Auftreten unter Einfluss', category: 'Vergehen', legalSection: 'CDC §5.3', fineMin: 800, fineMax: 3000, jailMin: 0, jailMax: 1, seizure: 'Alkohol oder berauschende Substanzen', additionalInfo: 'Öffentliche Trunkenheit die andere gefährdet.' },
    { offense: 'Illegaler Medikamentenbesitz', category: 'Vergehen', legalSection: 'CDC §6.2', fineMin: 500, fineMax: 4000, jailMin: 0, jailMax: 2, seizure: 'illegale Medikamente', additionalInfo: 'Besitz verschreibungspflichtiger Medikamente ohne Rezept' },
    { offense: 'Weitergabe illegaler Medikamente', category: 'Vergehen', legalSection: 'CDC §4.4', fineMin: 1000, fineMax: 6000, jailMin: 0, jailMax: 4, seizure: 'illegale Medikamente', additionalInfo: 'Weitergabe verschreibungspflichtiger Medikamente' },
    { offense: 'Lärmbelästigung', category: 'Ordnungswidrigkeit', legalSection: 'PEN §14.2', fineMin: 100, fineMax: 600, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Übermäßiger Lärm der andere erheblich stört.' },
    { offense: 'Öffentliche Trunkenheit', category: 'Ordnungswidrigkeit', legalSection: 'PEN §14.3', fineMin: 200, fineMax: 800, jailMin: 0, jailMax: 0, seizure: 'Alkohol am Ort', additionalInfo: 'Stark alkoholisiertes störendes Auftreten.' },
    { offense: 'Street Racing ohne Gefährdung', category: 'Ordnungswidrigkeit', legalSection: 'PEN §9.5', fineMin: 1000, fineMax: 3000, jailMin: 0, jailMax: 0, seizure: 'Fahrzeug (Impound möglich)', additionalInfo: 'Illegales Rennen ohne nachweisbare konkrete Gefährdung.' },
    { offense: 'Parkverstoß Falschparken Halteverstoß', category: 'Ordnungswidrigkeit', legalSection: 'SAVC §10', fineMin: 100, fineMax: 800, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Alle Verstöße gegen SAVC §10' },
    { offense: 'Besitz einer nichtregistrierten Kurzwaffe', category: 'Ordnungswidrigkeit', legalSection: 'FGCC §3.4', fineMin: 100, fineMax: 500, jailMin: 0, jailMax: 0, seizure: 'Waffe(n)', additionalInfo: 'Registrierung der Waffen liegt nicht vor.' },
    { offense: 'Leichte Geschwindigkeitsüberschreitung', category: 'Ordnungswidrigkeit', legalSection: 'SAVC §7', fineMin: 100, fineMax: 500, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Geschwindigkeitsübertretung bis 20mph einschließlich' },
    { offense: 'Mittlere Geschwindigkeitsüberschreitung', category: 'Ordnungswidrigkeit', legalSection: 'SAVC §7', fineMin: 200, fineMax: 800, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Geschwindigkeitsübertretung zwischen 21mph und 40mph' },
    { offense: 'Geringfügiges unangemessenes Fahrverhalten', category: 'Ordnungswidrigkeit', legalSection: 'SAVC §6.3', fineMin: 100, fineMax: 500, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Leichte Verkehrsverstöße ohne Gefährdung' },
    { offense: 'Konsum von legalen Substanzen in der Öffentlichkeit', category: 'Ordnungswidrigkeit', legalSection: 'CDC §2.3.1', fineMin: 300, fineMax: 800, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Konsum legaler Substanzen ist nur Zuhause erlaubt' },
    { offense: 'Weitergabe oder Verkauf von Cannabis', category: 'Ordnungswidrigkeit', legalSection: 'CDC §2.3.2', fineMin: 100, fineMax: 3000, jailMin: 0, jailMax: 0, seizure: 'Weitergegebenes Cannabis', additionalInfo: 'Cannabis darf weder weitergegeben oder verkauft werden.' },
    { offense: 'Besitz von Cannabis über Eigenbedarfsgrenze', category: 'Ordnungswidrigkeit', legalSection: 'CDC §2.3.3', fineMin: 200, fineMax: 800, jailMin: 0, jailMax: 0, seizure: 'Alles Cannabis oberhalb der Eigenbedarfmenge', additionalInfo: 'Personen dürfen 28g als Eigenbedarf besitzen.' },
    { offense: 'Besitz von Alkohol Tabak oder Cannabis unter 21', category: 'Ordnungswidrigkeit', legalSection: 'CDC §6.1', fineMin: 500, fineMax: 1500, jailMin: 0, jailMax: 0, seizure: 'Substanzen', additionalInfo: 'Besitz legaler Drogen erst ab 21' },
    { offense: 'Weitergabe von Alkohol Tabak oder Cannabis an unter 21', category: 'Ordnungswidrigkeit', legalSection: 'CDC §6.2', fineMin: 500, fineMax: 2000, jailMin: 0, jailMax: 0, seizure: 'Substanzen', additionalInfo: 'Weitergabe an Personen unter 21 verboten' },
    { offense: 'Öffentlicher Konsum von Alkohol oder berauschenden Substanzen', category: 'Ordnungswidrigkeit', legalSection: 'CDC §5.1', fineMin: 500, fineMax: 3000, jailMin: 0, jailMax: 0, seizure: 'Substanzen', additionalInfo: 'Alkohol und berauschende Substanzen dürfen nicht öffentlich konsumiert werden.' },
    { offense: 'Fahren trotz Überschreiten des Blutalkoholwertes', category: 'Ordnungswidrigkeit', legalSection: 'SAVC §12', fineMin: 100, fineMax: 2500, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Mit erkennbaren Ausfallerscheinungen oder Blutalkohol über Grenzwert kein Fahrzeug führen.' },
    { offense: 'Missachtung von Verkehrzeichen oder Markierungen', category: 'Ordnungswidrigkeit', legalSection: 'SAVC §15', fineMin: 150, fineMax: 900, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Alle Verstöße gegen SAVC §15' },
    { offense: 'Starts und Landungen außerhalb ausgewiesener Bereiche', category: 'Ordnungswidrigkeit', legalSection: 'SAVC §16.2', fineMin: 500, fineMax: 3000, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Starten und Landen außerhalb ausgewiesener Bereiche.' },
    { offense: 'Ausnutzen von Sonderrechten ohne Legitimation', category: 'Ordnungswidrigkeit', legalSection: 'SAVC §9.3', fineMin: 100, fineMax: 500, jailMin: 0, jailMax: 0, seizure: '—', additionalInfo: 'Nutzung von Lichtsignalleiste und Sirene ohne Begründung.' },
  ];

  for (const entry of fineEntries) {
    await prisma.fineEntry.upsert({
      where: { id: `seed-${entry.legalSection.replace(/[^a-zA-Z0-9]/g, '')}-${entry.offense.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}` },
      update: {},
      create: {
        id: `seed-${entry.legalSection.replace(/[^a-zA-Z0-9]/g, '')}-${entry.offense.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`,
        ...entry,
      },
    });
  }

  // Seed sample OrgNews for each org
  for (const org of [police, ems, lsfd, doj]) {
    await prisma.orgNews.upsert({
      where: { id: `seed-news-${org.id}` },
      update: {},
      create: {
        id: `seed-news-${org.id}`,
        title: `Willkommen bei ${org.name}`,
        content: `<p>Dies ist eine Beispiel-Nachricht für die Organisation <strong>${org.name}</strong>. Hier können interne Ankündigungen und Neuigkeiten veröffentlicht werden.</p>`,
        pinned: true,
        organizationId: org.id,
        authorId: adminUser.id,
      },
    });
  }

  // Seed sample TrainingRecord for LSPD
  await prisma.trainingRecord.upsert({
    where: { recordNumber: 'TR-SEED-001' },
    update: {},
    create: {
      recordNumber: 'TR-SEED-001',
      traineeName: 'Max Mustermann',
      trainerName: 'admin',
      trainerId: adminUser.id,
      organizationId: police.id,
      type: 'BASIC',
      modules: { GA: true, LT: true, TA: false, PA: true, LA: false, VK: true, Codes: true, FlugG: false },
      notes: 'Grundausbildung erfolgreich abgeschlossen.',
      passed: true,
      date: new Date(),
    },
  });

  // Seed sample DispatchLog for LSPD
  await prisma.dispatchLog.upsert({
    where: { logNumber: 'DL-SEED-001' },
    update: {},
    create: {
      logNumber: 'DL-SEED-001',
      dispatcherId: adminUser.id,
      organizationId: police.id,
      shiftStart: new Date(Date.now() - 4 * 60 * 60 * 1000),
      shiftEnd: new Date(),
      callsHandled: 12,
      notes: 'Ruhige Schicht. Mehrere Verkehrskontrollen durchgeführt.',
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
