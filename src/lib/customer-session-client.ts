"use client";

export const CUSTOMER_TOKEN_KEY = "cf-customer-token";
export const CUSTOMER_USER_KEY = "cf-customer-user";

export type CustomerUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

export function getCustomerToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(CUSTOMER_TOKEN_KEY) || "";
}

export function getCustomerUser(): CustomerUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CUSTOMER_USER_KEY);
    return raw ? (JSON.parse(raw) as CustomerUser) : null;
  } catch {
    return null;
  }
}

export function setCustomerSession(token: string, user: CustomerUser) {
  sessionStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  sessionStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(
    new CustomEvent("cf-account-changed", { detail: { user } }),
  );
}

export function clearCustomerSession() {
  sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
  sessionStorage.removeItem(CUSTOMER_USER_KEY);
  window.dispatchEvent(
    new CustomEvent("cf-account-changed", { detail: { user: null } }),
  );
}

export function customerDisplayName(user: CustomerUser | null) {
  if (!user) return "";
  const first = user.name.trim().split(/\s+/)[0];
  if (first) return first;
  return user.email.split("@")[0] || "Cliente";
}

export async function refreshCustomerSession(): Promise<CustomerUser | null> {
  const token = getCustomerToken();
  if (!token) {
    clearCustomerSession();
    return null;
  }
  try {
    const res = await fetch("/api/account/session", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("invalid");
    const data = (await res.json()) as { user: CustomerUser };
    sessionStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(data.user));
    window.dispatchEvent(
      new CustomEvent("cf-account-changed", { detail: { user: data.user } }),
    );
    return data.user;
  } catch {
    clearCustomerSession();
    return null;
  }
}
