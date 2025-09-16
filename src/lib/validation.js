// Validation côté serveur (même logique que le frontend)

// Validation de l'email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation du mot de passe
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Au moins 8 caractères");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Au moins une majuscule");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Au moins une minuscule");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Au moins un chiffre");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Au moins un caractère spécial");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validation du nom d'utilisateur
const validateUsername = (username) => {
  const errors = [];

  if (username.length < 3) {
    errors.push("Au moins 3 caractères");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Seuls les lettres, chiffres et underscores sont autorisés");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validation des noms (prénom/nom)
const validateName = (name, fieldName) => {
  const errors = [];

  if (name.length < 2) {
    errors.push(`${fieldName} doit contenir au moins 2 caractères`);
  }

  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name)) {
    errors.push(
      `${fieldName} ne peut contenir que des lettres, espaces, apostrophes et tirets`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validation complète des données d'inscription
const validateRegistrationData = (data) => {
  const errors = {};

  // Validation email
  if (!data.email) {
    errors.email = "Email requis";
  } else if (!validateEmail(data.email)) {
    errors.email = "Format d'email invalide";
  }

  // Validation nom d'utilisateur
  if (!data.username) {
    errors.username = "Nom d'utilisateur requis";
  } else {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.errors[0];
    }
  }

  // Validation mot de passe
  if (!data.password) {
    errors.password = "Mot de passe requis";
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
  }

  // Validation prénom
  if (!data.firstName) {
    errors.firstName = "Prénom requis";
  } else {
    const firstNameValidation = validateName(data.firstName, "Prénom");
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.errors[0];
    }
  }

  // Validation nom
  if (!data.lastName) {
    errors.lastName = "Nom requis";
  } else {
    const lastNameValidation = validateName(data.lastName, "Nom");
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.errors[0];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validation des données de connexion
const validateLoginData = (data) => {
  const errors = {};

  if (!data.email) {
    errors.email = "Email requis";
  } else if (!validateEmail(data.email)) {
    errors.email = "Format d'email invalide";
  }

  if (!data.password) {
    errors.password = "Mot de passe requis";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateName,
  validateRegistrationData,
  validateLoginData,
};
