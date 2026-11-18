class CompanyMappers {
    putMap(element) {
        return {
            name: element.name,
            address: element.address,
            phone: element.phone,
            email: element.email,
            image: element.image,
            bank_accounts_image: element.bank_accounts_image,
            sello: element.sello,
            accredited_correlative: element.accredited_correlative,
            non_accredited_correlative: element.non_accredited_correlative,
            operationality_correlative: element.operationality_correlative,
            quote_correlative: element.quote_correlative,
            valuation_correlative: element.valuation_correlative,
            dispatch_series: element.dispatch_series,
            dispatch_correlative: element.dispatch_correlative,
            ubigeo: element.ubigeo,
            invoice_series: element.invoice_series,
            bank_accounts: element.bank_accounts || [],
            invoice_correlative: element.invoice_correlative,
            credit_note_series: element.credit_note_series,
            credit_note_correlative: element.credit_note_correlative,
            detraction_account: element.detraction_account,
            order_service_correlative: element.order_service_correlative,
            order_rental_correlative: element.order_rental_correlative,
            inventory_correlative: element.inventory_correlative,
            plantilla_acr: element.plantilla_acr,
            plantilla_nacr: element.plantilla_nacr,
            document: element.document,
        }
    }
}

export default new CompanyMappers();