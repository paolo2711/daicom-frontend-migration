import ClientDataService from '@/services/clients/clientDataService'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import LabDataService from '@/services/labs/labDataService'
import ClientMappers from '@/mappers/clientMappers'
import EquipmentMappers from '@/mappers/equipmentMappers'
import LabMappers from '@/mappers/labMappers'

// Las listas de los desplegables con busqueda, cada una una sola vez y con el nombre de su modulo: ese nombre es
// tambien su memoria corta. `memoria: false` en una lista que cambia sola.
export const LISTAS = {
  clientes: { fetch: (page, size, query) => ClientDataService.getFiltered(page, size, query), mapper: ClientMappers.getMap },
  laboratorios: { fetch: (page, size, query) => LabDataService.getFiltered(page, size, query), mapper: LabMappers.getMap },
  equipos: {
    fetch: (page, size, query) => EquipmentDataService.getFiltered(page, size, query), mapper: EquipmentMappers.getMap,
  },
  // Solo los disponibles; deja de estarlo apenas se alquila.
  inventario: {
    fetch: (page, size, query) => InventoryDataService.getAll({ status: 1, search: query || '', page, page_size: size }),
    memoria: false,
  },
}
