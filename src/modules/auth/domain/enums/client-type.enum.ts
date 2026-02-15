/**
 * Client Type Enum
 * Defines the types of clients that can access the authentication system
 */
export enum ClientType {
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
}

/**
 * Validates if a string is a valid ClientType
 */
export function isValidClientType(value: string): boolean {
  return Object.values(ClientType).includes(value as ClientType);
}

/**
 * Gets the ClientType from a string, with fallback to WEB
 */
export function getClientType(value?: string): ClientType {
  if (!value) {
    return ClientType.WEB;
  }

  const normalized = value.toLowerCase();
  if (isValidClientType(normalized)) {
    return normalized as ClientType;
  }

  return ClientType.WEB;
}
