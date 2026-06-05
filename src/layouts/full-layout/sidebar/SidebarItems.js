export default [
    {
        icon: 'mdi-home',
        title: 'Inicio',
        to: '/home',
        id: 1, 
        name: 'Inicio',
    },
    {
        icon: 'mdi-folder-table',
        title: 'Órdenes',
        to: '/orders',
        id: 2, 
        name: 'Órdenes de Servicio',
    },
    {
        icon: 'mdi-certificate',
        title: 'Certificados',
        to: '/certificates',
        id: 5,
        name: 'Certificados',
    },
    {
        icon: 'mdi-factory',
        title: 'Laboratorios',
        to: '/labs',
        id: 6,
        name: 'Laboratorios',
    },
    {
        icon: 'mdi-account-group',
        title: 'Clientes',
        to: '/clients',
        id: 7,
        name: 'Clientes',
    },
    {
        icon: 'mdi-file-document-multiple', 
        title: 'Plantillas',
        to: '/plantillas', 
        id: 8, 
        name: 'Plantillas',
    },
    {
        icon: 'mdi-clipboard-list-outline', 
        title: 'Inventario',
        to: '/inventario', 
        id: 9, 
        name: 'Inventario de Equipos',
    },
    {
        icon: 'mdi-toolbox', 
        title: 'Equipos',
        to: '/equipos', 
        id: 10, 
        name: 'Catálogo Maestro de Equipos',
    },
    // ─── ZONA DE ADMINISTRACIÓN (AGRUPADA PARA EL ÁRBOL Y UX) ───
    {
        icon: 'mdi-shield-crown',
        title: 'Administración',
        id: 11,
        name: 'Administración',
        children: [
            {
                icon: 'mdi-account-multiple',
                title: 'Usuarios',
                to: '/users',
                id: 111,
                name: 'Usuarios',
            },
            {
                icon: 'mdi-shield-account',
                title: 'Permisos',
                to: '/permissions',
                id: 112,
                name: 'Permisos'
            },
            {
                icon: 'mdi-office-building-cog',
                title: 'Empresa',
                to: '/company',
                id: 113,
                name: 'Datos de la Empresa',
            }
        ]
    }
]