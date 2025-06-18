/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { logger } from "~/core/utils/logger.server";

/**
 * Main configuration class.
 * @example // How to use the config class
 *
 * import config from '@/config';
 *
 * console.log(config.port); // 3000
 */
export class Config {
  /** Singleton instance */
  private static instance: Config;

  /** Environment variables */
  public env: string;
  /** Whether the application is in production or not */
  public isProduction: boolean;
  /** Whether the application is in development or not */
  public port: number;
  /** Http Keep alive timeout */
  public keepAliveTimeout: number;
  /** Http Domaine name */
  public domainName: string;
  /** Http Parameter limit */
  public parameterLimit: number;
  /** Http Request body size */
  public maximumRequestBodySize: number;
  /** Project code name */
  public projectName: string;
  public appProdUrl: string;

  /** Where to store log file */
  public logDir: string;
  /** Log format */
  public logFormat: string;

  /** CORS origin */
  public origin: string;
  /** CORS credentials */
  public credentials: boolean;

  /** JWT access token expiration in minutes */
  public jwt: {
    secret: string;
    accessExpirationMinutes: number;
    refreshExpirationDays: number;
    resetPasswordExpirationMinutes: number;
    resetPINExpirationMinutes: number;
    verifyEmailExpirationMinutes: number;
    inviteExpirationMinutes: number;
  };

  /** Secrets */
  public secrets: {
    cookiesSalt: string;
    cookiesSecret: string;
    sessionSecret: string;
    sessionSalt: string;
    sessionSecrets: string[];
  };

  /** Database configuration vars */
  public db: {
    mainDbUrl: string;
    options: {};
  };

  /** Upload file type */
  public upload: {
    allowedFileTypes?: string[];
    filesTypes?: {
      audio?: {
        allowed?: string[];
        disallowed?: string[];
      };
      image?: {
        allowed?: string[];
        disallowed?: string[];
      };
      video?: {
        allowed?: string[];
        disallowed?: string[];
      };
      document?: {
        allowed?: string[];
        disallowed?: string[];
      };
    };
  };

  /** Email sending configurations */
  public email: {
    admin: string;
    smtp: {
      host: string;
      port: number;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
  };

  // Data validation constraints
  public validation: {
    password: {
      min: number;
      max: number;
    };
    username: {
      min: number;
      max: number;
    };
    userFullname: {
      max: number;
    };
    email: {
      min: number;
      max: number;
    };
  };

  /** SMS sending configurations */
  public sms: {
    twilio: {
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
  };

  public auth: {
    tokenTypes: {
      REFRESH: string;
      RESET_PASSWORD: string;
      ACCESS: string;
      RESET_PIN: string;
      VERIFY_EMAIL: string;
    };
  }

  public isEnvSetAndValid = false;
  public envVarsSchema: Joi.ObjectSchema<any> | undefined;

  private constructor() {
    /** Joi Schema to validate the env vars */
    this.envVarsSchema = Joi.object()
      .keys({
        // PROJECT
        PROJECT_NAME: Joi.string()
          .required()
          .description("Project code name (no spacial chars, no spaces)"),
        APP_PROD_URL: Joi.string().required().description("Production URL"),

        // Data Validation Constraints
        MIN_PASSWORD_LENGTH: Joi.number()
          .default(8)
          .description("Minimum password length"),
        MAX_PASSWORD_LENGTH: Joi.number()
          .default(255)
          .description("Maximum password length"),
        MIN_USERNAME_LENGTH: Joi.number()
          .default(1)
          .description("Minimum username length"),
        MAX_USERNAME_LENGTH: Joi.number()
          .default(50)
          .description("Maximum username length"),
        MAX_USER_FULLNAME_LENGTH: Joi.number()
          .default(70)
          .description("Maximum user fullname length"),
        MIN_EMAIL_LENGTH: Joi.number()
          .default(3)
          .description("Minimum email length"),
        MAX_EMAIL_LENGTH: Joi.number()
          .default(255)
          .description("Maximum email length"),

        // NODE
        NODE_ENV: Joi.string()
          .valid("production", "development", "test")
          .required(),
        LOG_FORMAT: Joi.string().required().description("Log format"),
        LOG_DIR: Joi.string().required().description("Log directory"),
        PORT: Joi.number()
          .default(3000)
          .description("Port number to run the server on"),

        // HTTP
        KEEP_ALIVE_TIMEOUT: Joi.number()
          .required()
          .description("Http keep alive timeout"),
        PARAMETER_LIMIT: Joi.number()
          .required()
          .description("Http parameter limit"),
        MAXIMUM_REQUEST_BODY_SIZE: Joi.string()
          .required()
          .description("Http request body size"),
        DOMAIN_NAME: Joi.string()
          .required()
          .description("Application full domaine name"),

        // DB
        DB_URL: Joi.string().required().description("DB URL is required"),

        // CORS
        ORIGIN: Joi.string().required().description("CORS origin"),
        CREDENTIALS: Joi.boolean()
          .default(false)
          .description("CORS credentials"),

        // JWT
        JWT_SECRET: Joi.string().required().description("JWT secret key"),
        JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
          .default(30)
          .description("Minutes after which access tokens expire"),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
          .default(30)
          .description("Days after which refresh tokens expire"),
        JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
          .default(10)
          .description("Minutes after which reset password token expires"),
        JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
          .default(10)
          .description("Minutes after which verify email token expires"),
        JWT_INVITE_EXPIRATION_MINUTES: Joi.number()
          .default(10)
          .description("Minutes after which invite token expires"),

        // EMAIL
        SMTP_HOST: Joi.string().description("Server that will send the emails"),
        SMTP_PORT: Joi.number().description(
          "Port to connect to the email server"
        ),
        SMTP_USERNAME: Joi.string().description("Username for email server"),
        SMTP_PASSWORD: Joi.string().description("Password for email server"),
        EMAIL_FROM: Joi.string().description(
          "The from field in the emails sent by the app"
        ),

        // twilio
        TWILIO_ACCOUNT_SID: Joi.string().description("Twilio account SID"),
        TWILIO_AUTH_TOKEN: Joi.string().description("Twilio auth token"),
        TWILIO_PHONE_NUMBER: Joi.string().description("Twilio phone number"),

        // secrets
        COOKIES_SALT: Joi.string().description("Cookies salt"),
        COOKIES_SECRET: Joi.string().description("Cookies secret"),
        SESSION_SECRET: Joi.string().description("Session secret"),
        SESSION_SALT: Joi.string().description("Session salt"),

        // UPLOAD
        UPLOAD_ALLOWED_FILE_TYPES: Joi.string().description(
          "Upload allowed file types"
        ),
        UPLOAD_AUDIO_ALLOWED_FILE_TYPES: Joi.string().description(
          "Upload allowed audio file types"
        ),
        UPLOAD_AUDIO_DISALLOWED_FILE_TYPES: Joi.string()
          .description("Upload disallowed audio file types")
          .optional(),
        UPLOAD_IMAGE_ALLOWED_FILE_TYPES: Joi.string().description(
          "Upload allowed image file types"
        ),
        UPLOAD_IMAGE_DISALLOWED_FILE_TYPES: Joi.string().description(
          "Upload disallowed image file types"
        ),
        UPLOAD_VIDEO_ALLOWED_FILE_TYPES: Joi.string().description(
          "Upload allowed video file types"
        ),
        UPLOAD_VIDEO_DISALLOWED_FILE_TYPES: Joi.string().description(
          "Upload disallowed video file types"
        ),
        UPLOAD_DOCUMENT_ALLOWED_FILE_TYPES: Joi.string().description(
          "Upload allowed document file types"
        ),
        UPLOAD_DOCUMENT_DISALLOWED_FILE_TYPES: Joi.string().description(
          "Upload disallowed document file types"
        ),
      })
      .unknown();

    // Validate env vars
    const { value: envVars, error } = this.envVarsSchema
      .prefs({ errors: { label: "key" }, abortEarly: true })
      .validate(process.env);
    // Throw error if env vars are not valid
    if (error) {
      logger.error(error);
      throw new Error(
        `Sorry! Cannot continue without environnement setup ? ${error.message}`
      );
    }

    this.isEnvSetAndValid = true;

    // If we are here, then the env vars are valid
    this.env = envVars.NODE_ENV;
    this.appProdUrl = envVars.APP_PROD_URL;
    this.isProduction = (this.env === "production");
    this.port = envVars.PORT;
    this.keepAliveTimeout = envVars.KEEP_ALIVE_TIMEOUT;
    this.domainName = envVars.DOMAIN_NAME;
    this.maximumRequestBodySize = envVars.MAXIMUM_REQUEST_BODY_SIZE;
    this.parameterLimit = envVars.PARAMETER_LIMIT;
    this.db = {
      mainDbUrl: envVars.DB_URL,
      options: {},
    };
    this.logDir = envVars.LOG_DIR;
    this.logFormat = envVars.LOG_FORMAT;
    this.origin = envVars.ORIGIN;
    this.credentials = envVars.CREDENTIALS === "true";
    this.projectName = envVars.PROJECT_NAME;
    this.jwt = {
      secret: envVars.JWT_SECRET,
      accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
      refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
      resetPasswordExpirationMinutes:
        envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
      resetPINExpirationMinutes: envVars.JWT_RESET_PIN_EXPIRATION_MINUTES,
      verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
      inviteExpirationMinutes: envVars.JWT_INVITE_EXPIRATION_MINUTES,
    };
    const secretsString = envVars.SESSION_COOKIES_SECRETS;
    const secrets = secretsString
    .split(",")
    .map((secret: string) => secret.trim());

    this.secrets = {
      cookiesSalt: envVars.COOKIES_SALT,
      cookiesSecret: envVars.COOKIES_SECRET,
      sessionSecret: secrets[0] || "no-secret-security-risk",
      sessionSecrets: secrets,
      sessionSalt: envVars.SESSION_SALT,
    };
    this.email = {
      admin: envVars.EMAIL_ADMIN,
      smtp: {
        host: envVars.SMTP_HOST,
        port: envVars.SMTP_PORT,
        auth: {
          user: envVars.SMTP_USERNAME,
          pass: envVars.SMTP_PASSWORD,
        },
      },
      from: envVars.EMAIL_FROM,
    };

    this.sms = {
      twilio: {
        accountSid: envVars.TWILIO_ACCOUNT_SID,
        authToken: envVars.TWILIO_AUTH_TOKEN,
        phoneNumber: envVars.TWILIO_PHONE_NUMBER,
      },
    };

    this.validation = {
      password: {
        min: envVars.MIN_PASSWORD_LENGTH,
        max: envVars.MAX_PASSWORD_LENGTH,
      },
      username: {
        min: envVars.MIN_USERNAME_LENGTH,
        max: envVars.MAX_USERNAME_LENGTH,
      },
      userFullname: {
        max: envVars.MAX_USER_FULLNAME_LENGTH,
      },
      email: {
        min: envVars.MIN_EMAIL_LENGTH,
        max: envVars.MAX_EMAIL_LENGTH,
      },
    };

    this.upload = {
      allowedFileTypes: envVars.UPLOAD_ALLOWED_FILE_TYPES?.split(","),
      filesTypes: {
        audio: {
          allowed: envVars.UPLOAD_AUDIO_ALLOWED_FILE_TYPES?.split(","),
          disallowed: envVars.UPLOAD_AUDIO_DISALLOWED_FILE_TYPES?.split(","),
        },
        image: {
          allowed: envVars.UPLOAD_IMAGE_ALLOWED_FILE_TYPES?.split(","),
          disallowed: envVars.UPLOAD_IMAGE_DISALLOWED_FILE_TYPES?.split(","),
        },
        video: {
          allowed: envVars.UPLOAD_VIDEO_ALLOWED_FILE_TYPES?.split(","),
          disallowed: envVars.UPLOAD_VIDEO_DISALLOWED_FILE_TYPES?.split(","),
        },
        document: {
          allowed: envVars.UPLOAD_DOCUMENT_ALLOWED_FILE_TYPES?.split(","),
          disallowed: envVars.UPLOAD_DOCUMENT_DISALLOWED_FILE_TYPES?.split(","),
        },
      },
    };

    this.auth = {
      tokenTypes: {
        REFRESH: 'refresh',
        RESET_PASSWORD: 'reset-password',
        ACCESS: 'access',
        RESET_PIN: 'reset-pin',
        VERIFY_EMAIL: 'verify-email',
      },
    };
  }

  /**
   * Get the singleton instance of the Config class
   * @returns {Config} The singleton instance
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}

export default Config.getInstance();
