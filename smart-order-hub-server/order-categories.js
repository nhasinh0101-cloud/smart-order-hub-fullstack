module.exports = new Map([
  ['processing_po', ['NEW', 'RECEIVED', 'VALIDATING', 'MAPPED']],
  ['need_info_po', ['VALIDATION_FAILED', 'EXCEPTION_OPEN', 'NEED_CLARIFICATION', 'PENDING_CORRECTION']],
  ['ready_sap_po', ['VALIDATED', 'READY_FOR_SAP', 'PENDING_SAP']],
  ['sent_sap_po', ['SENT_TO_SAP', 'SAP_PENDING', 'SENT_SAP', 'TECH_ACK_RECEIVED']],
  ['sap_success_po', ['SAP_ACCEPTED', 'COMPLETED', 'CLOSED']],
  ['sap_rejected_po', ['SAP_REJECTED', 'FAILED']]
]);
