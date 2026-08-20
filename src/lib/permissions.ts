/* ================================================================
   RBAC Permission Registry — New Step Footwear Admin
   ================================================================ */

export const PERMISSIONS = {
  DASHBOARD_READ:    'dashboard:read',
  PRODUCTS_READ:     'products:read',
  PRODUCTS_WRITE:    'products:write',
  PRODUCTS_DELETE:   'products:delete',
  ORDERS_READ:       'orders:read',
  ORDERS_WRITE:      'orders:write',
  ORDERS_CREATE:     'orders:create',
  CUSTOMERS_READ:    'customers:read',
  CUSTOMERS_WRITE:   'customers:write',
  INVENTORY_READ:    'inventory:read',
  INVENTORY_WRITE:   'inventory:write',
  CATEGORIES_READ:   'categories:read',
  CATEGORIES_WRITE:  'categories:write',
  CATEGORIES_DELETE: 'categories:delete',
  MESSAGES_READ:     'messages:read',
  MESSAGES_WRITE:    'messages:write',
  MESSAGES_DELETE:   'messages:delete',
  ROLES_READ:        'roles:read',
  ROLES_WRITE:       'roles:write',
  ROLES_DELETE:      'roles:delete',
  USERS_READ:        'users:read',
  USERS_WRITE:       'users:write',
  SETTINGS_READ:     'settings:read',
  SETTINGS_WRITE:    'settings:write',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Built-in role → permission mapping */
export const BUILT_IN_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  superadmin: Object.values(PERMISSIONS),

  manager: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.MESSAGES_WRITE,
    PERMISSIONS.MESSAGES_DELETE,
  ],

  fulfillment: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
  ],

  support: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.MESSAGES_WRITE,
  ],
}

/** Permission groups for the role editor UI */
export const PERMISSION_GROUPS = [
  {
    label: 'Dashboard',
    permissions: [PERMISSIONS.DASHBOARD_READ],
  },
  {
    label: 'Products',
    permissions: [PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE, PERMISSIONS.PRODUCTS_DELETE],
  },
  {
    label: 'Orders',
    permissions: [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_WRITE, PERMISSIONS.ORDERS_CREATE],
  },
  {
    label: 'Customers',
    permissions: [PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE],
  },
  {
    label: 'Inventory',
    permissions: [PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_WRITE],
  },
  {
    label: 'Categories',
    permissions: [PERMISSIONS.CATEGORIES_READ, PERMISSIONS.CATEGORIES_WRITE, PERMISSIONS.CATEGORIES_DELETE],
  },
  {
    label: 'Messages',
    permissions: [PERMISSIONS.MESSAGES_READ, PERMISSIONS.MESSAGES_WRITE, PERMISSIONS.MESSAGES_DELETE],
  },
  {
    label: 'Roles',
    permissions: [PERMISSIONS.ROLES_READ, PERMISSIONS.ROLES_WRITE, PERMISSIONS.ROLES_DELETE],
  },
  {
    label: 'Users',
    permissions: [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE],
  },
  {
    label: 'Settings',
    permissions: [PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_WRITE],
  },
]
