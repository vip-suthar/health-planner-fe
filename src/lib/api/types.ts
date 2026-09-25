/** Shared auth API payload shapes (identifier-first / Cognito). */

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  name?: string;
  gender?: "male" | "female" | "other";
  birthdate?: string;
  [key: string]: unknown;
}

export interface Tokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export type ChallengeName = "EMAIL_OTP" | "SELECT_CHALLENGE" | "PASSWORD" | string;
export type NextStep =
  | "submit-otp"
  | "submit-password"
  | "select-challenge"
  | "respond-challenge";

/** Returned when more sign-in steps are needed. */
export interface ChallengeState {
  hasNextStep: true;
  nextStep: NextStep;
  challengeName: ChallengeName;
  session: string;
  availableChallenges?: string[];
  codeDelivery?: { medium: "EMAIL"; destination: string };
}

/** Returned when sign-in completes. */
export interface AuthResult {
  user: AuthUser;
  tokens: Tokens;
  isNewUser?: boolean;
}

/** /auth/respond and /auth/social may return either. */
export type AuthStep = AuthResult | ChallengeState;

/** Type guard: did this step complete sign-in? */
export function isAuthResult(step: AuthStep): step is AuthResult {
  return (step as AuthResult).tokens !== undefined;
}
