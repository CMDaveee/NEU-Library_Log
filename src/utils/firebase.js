/**
 * Legacy shim — kept so EnrichTab can call getDetailForVisit() locally
 * while we migrate fully to Firestore. In production, swap EnrichTab
 * to read/write visitDetails from Firestore directly.
 */
let _visitDetails = [];

export const FirebaseService = {
  getDetailForVisit(visitId) {
    return _visitDetails.find(d => d.visitId === visitId) || null;
  },
  async saveEnrichment(visitId, data) {
    const ex = _visitDetails.find(d => d.visitId === visitId);
    if (ex) Object.assign(ex, data, { enrichedAt: new Date() });
    else _visitDetails.push({ visitId, ...data, enrichedAt: new Date() });
  },
};
