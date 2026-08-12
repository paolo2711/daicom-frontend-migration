import { createRouter, createWebHistory } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useAuthStore } from "@/stores/authStore";

const routes = [
  {
    path: "/",
    redirect: "home",
    component: () => import("@/layouts/full-layout/Layout.vue"),
    children: [
      {
        name: "home",
        path: "home",
        component: () => import("@/views/home/home.vue"),
      },
      {
        name: "certificates",
        path: "certificates",
        component: () => import("@/views/certificates/Certificates.vue"),
      },
      {
        name: "orders",
        path: "orders",
        redirect: { name: "orders-service" },
        component: () => import("@/views/orders/Orders.vue"),
        children: [
          {
            name: "orders-service",
            path: "servicios",
            component: () => import("@/views/orders/components/services/TabOrdersService.vue"),
          },
          {
            name: "orders-rental",
            path: "alquileres",
            component: () => import("@/views/orders/components/rentals/TabOrdersRental.vue"),
          },
        ],
      },
      {
        name: "clients",
        path: "clients",
        component: () => import("@/views/clients/Clients.vue"),
      },
      
      {
        name: "documents",
        path: "documentos",
        component: () => import("@/views/documents/Documents.vue"),
      },
      {
        name: "labs",
        path: "labs",
        component: () => import("@/views/labs/Labs.vue"),
      },
      {
        path: '/equipos',
        name: 'Equipos',
        component: () => import("@/views/equipments/Equipments.vue"),
      },
      {
        path: '/inventario',
        name: 'Inventario',
        component: () => import("@/views/inventory/Inventory.vue"),
      },
      // ─── RUTAS DE ADMINISTRACIÓN INTEGRADAS ───
      {
        name: "Profile",
        path: "profile",
        component: () => import("@/views/access/profile/profile.vue"),
      },
      {
        name: "Company",
        path: "company",
        component: () => import("@/views/access/company/company.vue"),
      },
      {
        name: "Permissions",
        path: "permissions",
        component: () => import("@/views/access/permissions/Permissions.vue"),
      },
      {
        name: "Users",
        path: "users",
        component: () => import("@/views/access/users/Users.vue"),
      },
      {
        name: "Maintenance",
        path: "mantenimiento",
        component: () => import("@/views/access/maintenance/Maintenance.vue"),
      }
    ]
  },
  {
    path: "/",
    redirect: "login",
    component: () => import("@/layouts/blank-layout/Blanklayout.vue"),
    children: [
      {
        name: "Login",
        path: "login",
        component: () => import("@/views/authentication/Login.vue"),
      },
      {
        name: "Error",
        path: "error",
        component: () => import("@/views/authentication/Error.vue"),
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/views/authentication/Error.vue"),
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { el: to.hash };
    } else if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
  routes,
});

router.beforeResolve((to) => {
  if (to.name) {
    NProgress.start();
  }
  return true;
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.name === 'Login') return true;
  if (authStore.status.loggedIn) return true;
  return { name: 'Login' };
});

router.afterEach(() => {
  NProgress.done();
});

export default router;