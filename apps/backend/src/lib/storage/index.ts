export {
  ObjectStorageService,
  ObjectNotFoundError,
  objectStorageClient,
  storageService,
} from "./objectStorage";

export type {
  ObjectAclPolicy,
  ObjectAccessGroup,
  ObjectAccessGroupType,
  ObjectAclRule,
} from "./objectAcl";

export {
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

export {
  getPrefix,
  getPrefixEntry,
  getSystemPolicy,
  validateSystemAccess,
  buildTenantPath,
  buildGlobalPath,
  buildUserPath,
  parseTenantFromPath,
  getAllPrefixes,
  getAllSystemPolicies,
  getAllCollectionMappings,
  getScaffoldFolders,
  getUserScaffoldFolders,
  MEDUSA_PRODUCT_PREFIX,
  MEDUSA_CATALOG_PREFIX,
  MEDUSA_SYSTEM_ID,
} from "./prefixRegistry";

export type {
  StorageDomain,
  ScopeLevel,
  Visibility,
  PrefixEntry,
  SystemPolicy,
} from "./prefixRegistry";
