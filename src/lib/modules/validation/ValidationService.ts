import { UserValidator } from "../../validators/UserValidator";
import { DocumentValidator } from "../../validators/DocumentValidator";

export class ValidationService {
  // User validation methods
  static validateRegistrationData(data: any) {
    return UserValidator.validateRegistrationData(data);
  }

  static validateProfileData(data: any) {
    return UserValidator.validateProfileData(data);
  }

  static validateEmail(email: string) {
    return UserValidator.validateEmail(email);
  }

  static validatePasswordResetData(password: string, confirmPassword: string) {
    return UserValidator.validatePasswordResetData(password, confirmPassword);
  }

  // Document validation methods
  static validateDocumentData(data: any) {
    return DocumentValidator.validateDocumentData(data);
  }

  static validateDocumentId(id: string | number) {
    return DocumentValidator.validateDocumentId(id);
  }

  static validateUserId(id: string | number) {
    return DocumentValidator.validateUserId(id);
  }

  static validateDocumentIds(ids: (string | number)[]) {
    return DocumentValidator.validateDocumentIds(ids);
  }

  static validatePaginationParams(limit: number, offset: number) {
    return DocumentValidator.validatePaginationParams(limit, offset);
  }
}
