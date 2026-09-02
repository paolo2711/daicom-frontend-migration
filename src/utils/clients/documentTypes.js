// Espeja Client.DocumentType del backend (apps/clients/models.py).
export const DOCUMENT_TYPE = {
  DNI: 1,
  RUC: 2,
  SIN_DOCUMENTO: 3,
}

export const DOCUMENT_LENGTH = {
  [DOCUMENT_TYPE.DNI]: 8,
  [DOCUMENT_TYPE.RUC]: 11,
}
