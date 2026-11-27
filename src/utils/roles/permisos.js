import SidebarItems from '@/layouts/full-layout/sidebar/SidebarItems'
import { EDITAR_CATALOGO } from '@/utils/equipments/catalogo'

// Las acciones del sistema por dominio; `id` es el permission_id del back. Una accion nueva es una linea aca.
// `soloSuperAdmin`: los meta-permisos no los ve quien no es super-admin.
const ACCIONES_CATEGORIAS = [
  { name: 'Certificados', acciones: [
    { id: 1001, name: 'Firmar / Generar QR', endpoint: 'FIRMAR_QR' },
    { id: 1003, name: 'Anular / Restaurar Certificados', endpoint: 'ANULAR_CERTIFICADO' },
    { id: 1005, name: 'Solicitar Firma', endpoint: 'SOLICITAR_FIRMA' },
    { id: 1006, name: 'Elaborar Certificado (Subir Excel)', endpoint: 'ELABORAR_CERTIFICADO' },
    { id: 1010, name: 'Marcar Certificado como Entregado', endpoint: 'MARCAR_ENTREGADO' },
  ]},
  { name: 'Órdenes', acciones: [
    { id: 1002, name: 'Ver Resumen de Orden', endpoint: 'VER_RESUMEN_ORDEN' },
    { id: 1004, name: 'Anular Órdenes', endpoint: 'ANULAR_ORDEN' },
  ]},
  { name: 'Inventario', acciones: [
    { id: 1007, name: 'Eliminar Equipos', endpoint: 'ELIMINAR_EQUIPO' },
  ]},
  { name: 'Equipos', acciones: [
    { id: EDITAR_CATALOGO, name: 'Editar Catálogo de Equipos', endpoint: 'EDITAR_CATALOGO_EQUIPOS' },
  ]},
  { name: 'Administración', soloSuperAdmin: true, acciones: [
    { id: 1008, name: 'Gestionar Usuarios', endpoint: 'GESTIONAR_USUARIOS' },
    { id: 1009, name: 'Gestionar Roles y Permisos', endpoint: 'GESTIONAR_ROLES' },
  ]},
]

// Las paginas que gobierna una accion (Usuarios 1008, Permisos 1009) y las de super-admin no son vistas a otorgar.
const soloVistas = (nodos) => nodos
  .filter(n => !n.action && !n.superAdmin)
  .map(n => (n.children ? { ...n, children: soloVistas(n.children) } : n))

// El arbol del panel: las vistas del menu y las acciones del sistema.
export function arbolDePermisos (esSuperAdmin) {
  const acciones = ACCIONES_CATEGORIAS
    .filter(categoria => !categoria.soloSuperAdmin || esSuperAdmin)
    .map(categoria => ({
      name: categoria.name,
      id: `sys_cat_${categoria.name}`,
      children: categoria.acciones.map(a => ({ name: a.name, to: a.endpoint, id: `sys_${a.id}`, real_id: a.id })),
    }))
  return [
    { name: 'Vistas / Módulos', id: 'views_root', children: soloVistas(JSON.parse(JSON.stringify(SidebarItems))) },
    { name: 'Acciones del Sistema', id: 'sys_root', children: acciones },
  ]
}

// Lo guardado de un rol, como lo marca el arbol: las acciones (desde 1000) llevan `sys_`.
export const marcadosDe = (permisos) =>
  permisos.map(p => (p.permission_id >= 1000 ? `sys_${p.permission_id}` : p.permission_id))

const nodosDe = (nodos) => nodos.flatMap(n => (n.children ? [n, ...nodosDe(n.children)] : [n]))

// Lo marcado, como lo guarda el back: solo lo que lleva `to` (una vista o una accion).
export function permisosDe (arbol, marcados) {
  const todos = nodosDe(arbol)
  return marcados
    .map(id => todos.find(n => n.id === id))
    .filter(n => n?.to)
    .map(n => ({ name: n.name, endpoint: n.to, permission_id: n.real_id ?? n.id }))
}
