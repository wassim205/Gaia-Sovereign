import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsValidRedirectUriConstraint implements ValidatorConstraintInterface {
  validate(uri: string) {
    try {
      const url = new URL(uri);
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const allowlistRaw = process.env.REDIRECT_URI_ALLOWLIST || '';
      const allowlist = allowlistRaw
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean);

      const hostname = url.hostname.toLowerCase();

      // In development, allow http://localhost
      if (
        isDevelopment &&
        url.protocol === 'http:' &&
        hostname === 'localhost'
      ) {
        return true;
      }

      // In production, require https
      if (url.protocol !== 'https:') {
        return false;
      }

      // Avoid fragment and query params
      if (url.hash || url.search) {
        return false;
      }

      if (allowlist.length > 0 && !allowlist.includes(hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'Each redirect URI must be a valid HTTPS URL (or http://localhost in dev), not contain a query string or fragment, and be in the allowed host list.';
  }
}

@ValidatorConstraint({ async: false })
export class IsValidRedirectUriArrayConstraint implements ValidatorConstraintInterface {
  validate(uris: string[]) {
    if (!Array.isArray(uris)) {
      return false;
    }

    const constraint = new IsValidRedirectUriConstraint();
    return uris.every((uri) => constraint.validate(uri));
  }

  defaultMessage() {
    return 'All redirect URIs must be valid HTTPS URLs (or http://localhost in dev), not contain query strings or fragments, and be in the allowed host list.';
  }
}

export function IsValidRedirectUri(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidRedirectUriConstraint,
    });
  };
}

export function IsValidRedirectUriArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidRedirectUriArrayConstraint,
    });
  };
}
