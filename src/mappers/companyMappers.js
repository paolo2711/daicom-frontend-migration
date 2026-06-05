class CompanyMappers {
    putMap(element) {
        return {
            name: element.name,
            address: element.address,
            phone: element.phone,
            email: element.email,
            image: element.image,
            accredited_correlative: element.accredited_correlative,
            non_accredited_correlative: element.non_accredited_correlative,
            operationality_correlative: element.operationality_correlative,
            accredited_correlative_pdf_first_page: element.accredited_correlative_pdf_first_page,
            accredited_correlative_pdf_other_pages: element.accredited_correlative_pdf_other_pages,
            non_accredited_correlative_pdf_first_page: element.non_accredited_correlative_pdf_first_page,
            non_accredited_correlative_pdf_other_pages: element.non_accredited_correlative_pdf_other_pages,
            document: element.document,
        }
    }
}

export default new CompanyMappers();