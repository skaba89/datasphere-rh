/**
 * Configuration SSO/SAML — intégration Azure AD, Google Workspace, Okta.
 *
 * Supporte :
 *  - SAML 2.0 (Azure AD, Okta, Google Workspace)
 *  - OIDC (OpenID Connect — Google, Microsoft, generic)
 *  - OAuth 2.0 (Google, Microsoft)
 */

export type SSOProvider = 'azure_ad' | 'google_workspace' | 'okta' | 'oidc_generic'

export interface SSOConfig {
  providerId: SSOProvider
  label: string
  oidcClientId?: string
  oidcClientSecret?: string
  oidcDiscoveryUrl?: string
  samlEntryPoint?: string
  samlIssuer?: string
  samlCert?: string
  redirectUri?: string
  scopes?: string[]
  attributeMapping?: {
    email?: string
    name?: string
    role?: string
    department?: string
  }
  autoProvision?: boolean
  defaultRole?: string
  isActive?: boolean
}

export const SSO_PROVIDERS: Array<{ id: SSOProvider; label: string; description: string; docsUrl: string }> = [
  {
    id: 'azure_ad',
    label: 'Microsoft Azure AD',
    description: 'Azure Active Directory / Microsoft 365',
    docsUrl: 'https://docs.microsoft.com/en-us/azure/active-directory/manage-apps/configure-saml-single-sign-on',
  },
  {
    id: 'google_workspace',
    label: 'Google Workspace',
    description: 'Google Workspace / G Suite — SAML 2.0 ou OIDC',
    docsUrl: 'https://support.google.com/a/answer/6087519',
  },
  {
    id: 'okta',
    label: 'Okta',
    description: 'Okta Identity Cloud — SAML 2.0',
    docsUrl: 'https://help.okta.com/en/prod/Content/Topics/Apps/Apps_App_Integration_Wizard.htm',
  },
  {
    id: 'oidc_generic',
    label: 'OIDC générique',
    description: 'OpenID Connect — Keycloak, Auth0, Authentik…',
    docsUrl: 'https://openid.net/connect/',
  },
]

export function validateSSOConfig(config: SSOConfig): string[] {
  const errors: string[] = []
  if (['oidc_generic', 'azure_ad', 'google_workspace'].includes(config.providerId)) {
    if (!config.oidcClientId) errors.push('OIDC Client ID requis')
    if (!config.oidcClientSecret) errors.push('OIDC Client Secret requis')
    if (!config.redirectUri) errors.push('Redirect URI requis')
  }
  if (['okta', 'azure_ad'].includes(config.providerId)) {
    if (!config.samlEntryPoint) errors.push('SAML Entry Point requis')
    if (!config.samlIssuer) errors.push('SAML Issuer requis')
    if (!config.samlCert) errors.push('SAML Certificate requis')
  }
  return errors
}
