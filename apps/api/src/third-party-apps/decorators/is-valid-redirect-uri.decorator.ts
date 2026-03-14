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

export function IsValidRedirectUri(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidRedirectUriConstraint,
    });
  };
}
