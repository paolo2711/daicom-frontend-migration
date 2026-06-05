export default {
  getMap(element) {
    return {
      id: element.id,
      name: element.name,
      documentType: element.documentType,
      documentType_name: element.documentType_name,
      document: element.document,
      address: element.address,
      phone: element.phone,
      email: element.email,
    };
  },
  putMap(element) {
    return {
      id: element.id,
      name: element.name,
      documentType: element.documentType,
      document: element.document,
      address: element.address,
      phone: element.phone,
      email: element.email,
    };
  }
};