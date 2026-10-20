export const TOKEN_NAME = "ghcl_express_session_token" as const;

export const ROUTES = {
  login: "/login",
  profile: "/profile",
  myDocuments: "/my-documents",
  bulkerEntries: "/bulkerentries",
  adminUsers: "/admin/users",
  adminDocuments: "/admin/documents",
  adminBulker: "/admin/bulker",
  manageBulker: "/admin/bulker",
  manageBulkerCustomerInfo: "/admin/bulker",
  nightchecking: "/nightchecking",
  adminNightchecking: "/admin/nightchecking",
  attendance: "/attendance",
  adminAttendance: "/admin/attendance",
} as const;


/**
 * Hierarchical React Query Keys Factory
 */
export const QUERY_KEYS = {
  profile: {
    all: ["profile"] as const,
    detail: (reveal: boolean = false) => ["profile", "detail", { reveal }] as const,
  },
  bankDetails: {
    all: ["bank-details"] as const,
    detail: (reveal: boolean = false) => ["bank-details", "detail", { reveal }] as const,
  },
  documents: {
    all: ["documents"] as const,
    userList: (reveal: boolean = false) => ["documents", "user-list", { reveal }] as const,
  },
  admin: {
    users: {
      all: ["admin", "users"] as const,
      list: (params: Record<string, any>) => ["admin", "users", "list", params] as const,
      detail: (id: string, reveal: boolean = false) =>
        ["admin", "users", "detail", id, { reveal }] as const,
      dropdown: (search?: string) => ["admin", "users", "dropdown", { search }] as const,
      sessions: (id: string) => ["admin", "users", "sessions", id] as const,
    },
    bankDetails: {
      all: ["admin", "bank-details"] as const,
      list: (params: Record<string, any>) => ["admin", "bank-details", "list", params] as const,
      userBank: (userId: string, reveal: boolean = false) =>
        ["admin", "bank-details", "user", userId, { reveal }] as const,
    },
    documents: {
      all: ["admin", "documents"] as const,
      list: (params: Record<string, any>) => ["admin", "documents", "list", params] as const,
      statistics: ["admin", "documents", "statistics"] as const,
      byUser: (userId: string, reveal: boolean = false) =>
        ["admin", "documents", "user", userId, { reveal }] as const,
      detail: (id: string, reveal: boolean = false) =>
        ["admin", "documents", "detail", id, { reveal }] as const,
    },
  },
  bulker: {
    all: ["bulker"] as const,
    entries: (params: Record<string, any> = {}) => ["bulker", "entries", params] as const,
    adminLogs: (params: Record<string, any> = {}) => ["bulker", "admin-logs", params] as const,
    bulkerInfo: () => ["bulker", "bulker-info"] as const,
    customerInfo: () => ["bulker", "customer-info"] as const,
  },
  nightchecking: {
    all: ["nightchecking"] as const,
    entries: (params: Record<string, any> = {}) => ["nightchecking", "entries", params] as const,
    adminLogs: (params: Record<string, any> = {}) => ["nightchecking", "admin-logs", params] as const,
    transporters: () => ["nightchecking", "transporters"] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    status: () => ["attendance", "status"] as const,
    adminLogs: (params: Record<string, any> = {}) => ["attendance", "admin-logs", params] as const,
    register: (month?: string, worklocation?: string) =>
      ["attendance", "register", { month, worklocation }] as const,
    cleanupPreview: (month_str: string) =>
      ["attendance", "cleanup-preview", month_str] as const,
  },
  baseNightCheckingLogs: () => ["nightchecking"] as const,
  nightCheckingLogs: (page: number, status: string) =>
    ["nightchecking", "entries", { page, status }] as const,
  adminNightCheckingLogs: (page: number, status?: string, search?: string) =>
    ["nightchecking", "admin-logs", { page, status, search }] as const,
  transporters: () => ["nightchecking", "transporters"] as const,
} as const;


