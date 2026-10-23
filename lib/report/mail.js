// Emails and small HTML pages of the report workflow, English and French.
import { esc } from '../email.js';

const W = {
  en: {
    hello: (n) => 'Hello ' + n + ',',
    sign: 'The Djalumo Agro team',
    confirmSubject: 'Confirm your report request',
    confirmLead: (p) => 'You asked for the PDF report of your crop plan: ' + p + '.',
    confirmAsk: 'Please confirm your email address so that the Djalumo Agro team can review the request.',
    confirmBtn: 'Confirm my request',
    confirmFoot: 'This link stays valid for 7 days. If you did not make this request, simply ignore this message: nothing will follow.',
    deliverSubject: (c, ref) => 'Your Djalumo Agro report: ' + c + ' (' + ref + ')',
    deliverLead: (pages) => 'Your report is ready. You will find it attached to this message (PDF, ' + pages + ' pages).',
    deliverPlan: (p) => 'It follows the settings of your simulation: ' + p + '.',
    deliverCheck: 'The figures rest on dated public references. Please check prices and quotes locally before committing money.',
    deliverReply: 'For any question, simply reply to this message.',
    downloadBtn: 'Download my report', downloadNote: 'The download link stays valid for 60 days.',
    refuseSubject: 'Your Djalumo Agro report request',
    refuseLead: (c) => 'Thank you for your report request (' + c + ').',
    refuseBody: 'We are not able to follow it up for now. If you would like to discuss it, simply reply to this message.',
    adminSubject: (n, c, ref) => 'Report to approve: ' + n + ', ' + c + ' (' + ref + ')',
    adminLead: 'A report request has just been confirmed by its author. Nothing is sent without your approval.',
    adminAttached: 'The report exactly as it would be sent is attached to this message.',
    adminBtn: 'Review the request',
    rows: { ref: 'Report no.', name: 'Name', email: 'Email', phone: 'Phone', profile: 'Profile', place: 'Place', lang: 'Report language', crop: 'Crop', area: 'Plot', capital: 'Capital needed', price: 'Selling price', water: 'Water', start: 'Start', margin: 'Average margin', pages: 'Pages' },
    langs: { en: 'English', fr: 'French' },
    page: {
      confirmT: 'Confirm your request', confirmD: (p) => 'Report requested for ' + p + '.', confirmBtn: 'Confirm my request',
      confirmedT: 'Address confirmed', confirmedD: 'Your request is now with the Djalumo Agro team. You will receive the report by email once it has been approved.',
      alreadyT: 'Request already confirmed', alreadyD: 'This request has already been confirmed. You will receive the report by email once it has been approved.',
      invalidT: 'This link is no longer valid', invalidD: 'The link may have expired or been altered. You can make a new request from the simulator.',
      unavailableT: 'Service unavailable', unavailableD: 'The report service is not available right now. Please try again later.',
      reviewT: 'Report request', reviewD: 'Check the request and the report, then approve or refuse. The requester receives the PDF only after approval.',
      preview: 'Open the report (PDF)', approve: 'Approve and send the report', refuse: 'Refuse', notify: 'Tell the requester by email',
      sentT: 'Report sent', sentD: (e) => 'The report has been sent to ' + e + ', as an attachment and as a download link.', download: 'Download the report sent',
      refusedT: 'Request refused', refusedD: (n) => n ? 'The requester has been told by email.' : 'No email has been sent to the requester.',
      doneT: 'Request already processed', doneD: (s) => 'This request has already been ' + (s === 'SENT' ? 'approved and sent.' : 'refused.'),
      failT: 'Sending failed', failD: 'The report could not be sent. The request stays open: try again in a moment.',
      home: 'Back to Djalumo Agro'
    }
  },
  fr: {
    hello: (n) => 'Bonjour ' + n + ',',
    sign: 'L’équipe Djalumo Agro',
    confirmSubject: 'Confirmez votre demande de rapport',
    confirmLead: (p) => 'Vous avez demandé le rapport PDF de votre plan de culture : ' + p + '.',
    confirmAsk: 'Merci de confirmer votre adresse électronique pour que l’équipe Djalumo Agro étudie votre demande.',
    confirmBtn: 'Confirmer ma demande',
    confirmFoot: 'Ce lien reste valable 7 jours. Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message : aucune suite ne lui sera donnée.',
    deliverSubject: (c, ref) => 'Votre rapport Djalumo Agro : ' + c + ' (' + ref + ')',
    deliverLead: (pages) => 'Votre rapport est prêt. Vous le trouverez en pièce jointe (PDF, ' + pages + ' pages).',
    deliverPlan: (p) => 'Il reprend les réglages de votre simulation : ' + p + '.',
    deliverCheck: 'Les chiffres reposent sur des références publiques datées. Vérifiez les prix et les devis localement avant d’engager de l’argent.',
    deliverReply: 'Pour toute question, répondez simplement à ce message.',
    downloadBtn: 'Télécharger mon rapport', downloadNote: 'Le lien de téléchargement reste valable 60 jours.',
    refuseSubject: 'Votre demande de rapport Djalumo Agro',
    refuseLead: (c) => 'Merci pour votre demande de rapport (' + c + ').',
    refuseBody: 'Nous ne pouvons pas y donner suite pour le moment. Si vous souhaitez en parler, répondez simplement à ce message.',
    adminSubject: (n, c, ref) => 'Rapport à valider : ' + n + ', ' + c + ' (' + ref + ')',
    adminLead: 'Une demande de rapport vient d’être confirmée par son auteur. Rien n’est envoyé sans votre accord.',
    adminAttached: 'Le rapport, tel qu’il serait envoyé, est joint à ce message.',
    adminBtn: 'Examiner la demande',
    rows: { ref: 'Rapport n°', name: 'Nom', email: 'Adresse électronique', phone: 'Téléphone', profile: 'Profil', place: 'Lieu', lang: 'Langue du rapport', crop: 'Culture', area: 'Parcelle', capital: 'Capital nécessaire', price: 'Prix de vente', water: 'Eau', start: 'Départ', margin: 'Marge moyenne', pages: 'Pages' },
    langs: { en: 'anglais', fr: 'français' },
    page: {
      confirmT: 'Confirmer votre demande', confirmD: (p) => 'Rapport demandé pour ' + p + '.', confirmBtn: 'Confirmer ma demande',
      confirmedT: 'Adresse confirmée', confirmedD: 'Votre demande est entre les mains de l’équipe Djalumo Agro. Vous recevrez le rapport par courrier électronique dès sa validation.',
      alreadyT: 'Demande déjà confirmée', alreadyD: 'Cette demande a déjà été confirmée. Vous recevrez le rapport par courrier électronique dès sa validation.',
      invalidT: 'Ce lien n’est plus valable', invalidD: 'Le lien a sans doute expiré ou été modifié. Vous pouvez faire une nouvelle demande depuis le simulateur.',
      unavailableT: 'Service indisponible', unavailableD: 'Le service des rapports n’est pas disponible pour le moment. Merci de réessayer plus tard.',
      reviewT: 'Demande de rapport', reviewD: 'Vérifiez la demande et le rapport, puis validez ou refusez. Le demandeur ne reçoit le PDF qu’après votre validation.',
      preview: 'Ouvrir le rapport (PDF)', approve: 'Valider et envoyer le rapport', refuse: 'Refuser', notify: 'Prévenir le demandeur par courrier électronique',
      sentT: 'Rapport envoyé', sentD: (e) => 'Le rapport a été envoyé à ' + e + ', en pièce jointe et par lien de téléchargement.', download: 'Télécharger le rapport envoyé',
      refusedT: 'Demande refusée', refusedD: (n) => n ? 'Le demandeur a été prévenu par courrier électronique.' : 'Aucun message n’a été envoyé au demandeur.',
      doneT: 'Demande déjà traitée', doneD: (s) => 'Cette demande a déjà été ' + (s === 'SENT' ? 'validée et envoyée.' : 'refusée.'),
      failT: 'Échec de l’envoi', failD: 'Le rapport n’a pas pu être envoyé. La demande reste ouverte : réessayez dans un instant.',
      home: 'Retour à Djalumo Agro'
    }
  }
};
export const words = (lang) => W[lang === 'en' ? 'en' : 'fr'];

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const wordmark = '<div style="font:800 20px/1 ' + FONT + ';letter-spacing:.06em;color:#1F2A24">DJALUMO</div><div style="font:600 9px/1 ' + FONT + ';letter-spacing:.5em;color:#3F7A4E;margin:5px 0 0 1px">AGRO</div>';
const p = (s, extra = '') => '<p style="margin:0 0 14px;font:15px/1.6 ' + FONT + ';color:#1F2A24' + extra + '">' + esc(s) + '</p>';
const button = (href, label) => '<table role="presentation" cellspacing="0" cellpadding="0" style="margin:6px 0 20px"><tr><td style="border-radius:10px;background:#0A3D2E"><a href="' + esc(href) + '" style="display:inline-block;padding:13px 22px;font:600 15px ' + FONT + ';color:#ffffff;text-decoration:none;border-radius:10px">' + esc(label) + '</a></td></tr></table>';
const rowsTable = (rows) => '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:4px 0 18px">' + rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
  .map(([k, v]) => '<tr><td style="padding:7px 12px 7px 0;border-bottom:1px solid #E3ECE7;font:13px ' + FONT + ';color:#5B6F65;white-space:nowrap;vertical-align:top">' + esc(k) + '</td><td style="padding:7px 0;border-bottom:1px solid #E3ECE7;font:600 13px/1.5 ' + FONT + ';color:#1F2A24">' + esc(v) + '</td></tr>').join('') + '</table>';

export function emailLayout(lang, inner) {
  return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:28px 12px;background:#F2F6F3">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #E1EAE4"><tr><td style="padding:28px 30px 8px">' + wordmark +
    '<div style="height:2px;width:40px;background:#B0832A;margin:18px 0 22px"></div>' + inner + '</td></tr><tr><td style="padding:0 30px 26px;font:12px/1.5 ' + FONT + ';color:#8B9A93">Djalumo Agro · ' + esc(lang === 'en' ? 'Rooted in Africa. Grown by light.' : 'Enraciné en Afrique, porté par la lumière.') + '</td></tr></table></body></html>';
}

export function confirmEmail(lang, q, planText, url) {
  const w = words(lang);
  const html = emailLayout(lang, p(w.hello(q.name)) + p(w.confirmLead(planText)) + p(w.confirmAsk) + button(url, w.confirmBtn) + p(w.confirmFoot, ';font-size:13px;color:#5B6F65') + p(w.sign));
  const text = [w.hello(q.name), '', w.confirmLead(planText), w.confirmAsk, '', w.confirmBtn + ' : ' + url, '', w.confirmFoot, '', w.sign].join('\n');
  return { subject: w.confirmSubject, html, text };
}

export function deliveryEmail(lang, q, planText, cropName, pages, url) {
  const w = words(lang);
  const html = emailLayout(lang, p(w.hello(q.name)) + p(w.deliverLead(pages)) + (url ? button(url, w.downloadBtn) + p(w.downloadNote, ';font-size:13px;color:#5B6F65') : '') + p(w.deliverPlan(planText)) + p(w.deliverCheck) + p(w.deliverReply) + p(w.sign));
  const text = [w.hello(q.name), '', w.deliverLead(pages), url ? w.downloadBtn + ' : ' + url : '', url ? w.downloadNote : '', '', w.deliverPlan(planText), w.deliverCheck, w.deliverReply, '', w.sign].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n');
  return { subject: w.deliverSubject(cropName, q.ref), html, text };
}

export function refusalEmail(lang, q, cropName) {
  const w = words(lang);
  const html = emailLayout(lang, p(w.hello(q.name)) + p(w.refuseLead(cropName)) + p(w.refuseBody) + p(w.sign));
  return { subject: w.refuseSubject, html, text: [w.hello(q.name), '', w.refuseLead(cropName), w.refuseBody, '', w.sign].join('\n') };
}

export function adminEmail(lang, q, rows, url, cropName) {
  const w = words(lang);
  const html = emailLayout(lang, p(w.adminLead) + rowsTable(rows) + button(url, w.adminBtn) + p(w.adminAttached, ';font-size:13px;color:#5B6F65'));
  const text = [w.adminLead, '', ...rows.filter(([, v]) => v).map(([k, v]) => k + ' : ' + v), '', w.adminBtn + ' : ' + url, '', w.adminAttached].join('\n');
  return { subject: w.adminSubject(q.name, cropName, q.ref), html, text };
}

/** A small standalone page (no script): confirmation, review and results. */
export function page(lang, title, body, home) {
  return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + esc(title) + ' · Djalumo Agro</title>' +
    '<style>body{margin:0;min-height:100vh;background:#F2F6F3;color:#1F2A24;font:16px/1.6 ' + FONT + ';display:grid;place-items:center;padding:24px;box-sizing:border-box}main{width:100%;max-width:620px;background:#fff;border:1px solid #E1EAE4;border-radius:16px;padding:30px}' +
    'h1{font-size:24px;line-height:1.25;margin:22px 0 10px;color:#0A3D2E}p{margin:0 0 14px;color:#3B4F45}.bar{height:2px;width:40px;background:#B0832A;margin-top:18px}table{width:100%;border-collapse:collapse;margin:8px 0 20px}td{padding:8px 12px 8px 0;border-bottom:1px solid #E3ECE7;font-size:14px;vertical-align:top}td:first-child{color:#5B6F65;white-space:nowrap}td+td{font-weight:600}' +
    'button,.btn{display:inline-block;border:0;border-radius:10px;padding:13px 20px;font:600 15px ' + FONT + ';cursor:pointer;text-decoration:none}.primary{background:#0A3D2E;color:#fff}.ghost{background:#EEF4F0;color:#0A3D2E}.danger{background:#F7E2DC;color:#8E3020}' +
    'form{margin:0 0 12px}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}label{font-size:14px;color:#3B4F45;display:flex;gap:8px;align-items:center;margin:0 0 10px}a{color:#0D5C44}small{color:#8B9A93}</style></head><body><main>' +
    wordmark + '<div class="bar"></div><h1>' + esc(title) + '</h1>' + body + (home ? '<p style="margin-top:22px"><a href="' + esc(home) + '">' + esc(words(lang).page.home) + '</a></p>' : '') + '</main></body></html>';
}

export const rowsHtml = (rows) => '<table>' + rows.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => '<tr><td>' + esc(k) + '</td><td>' + esc(v) + '</td></tr>').join('') + '</table>';
