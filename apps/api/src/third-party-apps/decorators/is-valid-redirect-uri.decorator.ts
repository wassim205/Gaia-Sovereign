import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsValidRedirectUriConstraint
  implements ValidatorConstraintInterface
{
  validate(uri: string, args: ValidationArguments) {
    try {
      const url = new URL(uri);
      const isDevelopment = process.env.NODE_ENV !== 'production';

      // In development, allow http://localhost
      if (isDevelopment && url.protocol === 'http:' && url.hostname === 'localhost') {
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

      return true;
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Each redirect URI must be a valid HTTPS URL (or http://localhost in dev) and must not contain a query string or fragment.';
  }
}

@ValidatorConstraint({ async: false })
export class IsValidRedirectUriArrayConstraint
  implements ValidatorConstraintInterface
{
  validate(uris: string[], args: ValidationArguments) {
    if (!Array.isArray(uris)) {
      return false;
    }

    const constraint = new IsValidRedirectUriConstraint();
    return uris.every(uri => constraint.validate(uri, args));
  }

  defaultMessage(args: ValidationArguments) {
    return 'All redirect URIs must be valid HTTPS URLs (or http://localhost in dev) and must not contain query strings or fragments.';
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
