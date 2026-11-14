class CompanyMappers {
    putMap(element) {
        return {
            name: element.name,
            address: element.address,
            phone: element.phone,
            email: element.email,
            image: element.image,
            bank_accounts_image: element.bank_accounts_image,
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
            detraction_account: element.detraction_account,
            order_service_correlative: element.order_service_correlative,
            order_rental_correlative: element.order_rental_correlative,
            inventory_correlative: element.inventory_correlative,
            accredited_correlative_pdf_first_page: element.accredited_correlative_pdf_first_page,
            accredited_correlative_pdf_other_pages: element.accredited_correlative_pdf_other_pages,
            non_accredited_correlative_pdf_first_page: element.non_accredited_correlative_pdf_first_page,
            non_accredited_correlative_pdf_other_pages: element.non_accredited_correlative_pdf_other_pages,
            document: element.document,
        }
    }
}

export default new CompanyMappers();