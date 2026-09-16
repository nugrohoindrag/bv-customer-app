// Sesi customer BVRooms: OTP SMS (mock saat dev) → token (lib/http). Customer dipersist agar PWA/native langsung masuk.
// Mode Guest: tanpa token, hanya katalog (asumsi §10.3); aksi booking/saved/inbox/akun mengarah ke login.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { AuthResult, Customer } from "@/api/types";
import { setSessionExpiredHandler, tokenStore } from "@/lib/http";
import { loadJSON, removeKey, saveJSON } from "@/lib/storage";

interface AuthState {
  customer: Customer | null;
  ready: boolean;
  onboarded: boolean;
  guest: boolean;
  /** simpan token + customer setelah otp/verify(login) atau register */
  signIn(res: AuthResult): void;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  setCustomer(c: Customer): void;
  setOnboarded(): void;
  continueAsGuest(): void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [customer, setCustomerState] = useState<Customer | null>(() => loadJSON<Customer | null>("customer", null));
  const [onboarded, setOnboardedState] = useState<boolean>(() => loadJSON<boolean>("onboarded", false));
  const [guest, setGuest] = useState<boolean>(() => loadJSON<boolean>("guest", false));
  const [ready, setReady] = useState(false);

  const clear = useCallback(() => {
    setCustomerState(null);
    removeKey("customer");
    tokenStore.set(null);
    qc.removeQueries({ predicate: (q) => !["app-config", "catalog", "property", "banners"].includes(String(q.queryKey[0])) });
  }, [qc]);

  useEffect(() => {
    setSessionExpiredHandler(clear);
    let cancelled = false;
    (async () => {
      if (!customer || !tokenStore.get()) {
        if (customer) clear();
        setReady(true);
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) {
          setCustomerState(me);
          saveJSON("customer", me);
        }
      } catch {
        // offline / token gagal refresh: biarkan sesi tersimpan; handler sesi kedaluwarsa akan membersihkan bila 401
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      customer,
      ready,
      onboarded,
      guest,
      signIn(res) {
        if (res.access_token && res.refresh_token) tokenStore.set({ access_token: res.access_token, refresh_token: res.refresh_token, expires_at: res.expires_at });
        if (res.customer) {
          setCustomerState(res.customer);
          saveJSON("customer", res.customer);
        }
        setGuest(false);
        removeKey("guest");
        setOnboardedState(true);
        saveJSON("onboarded", true);
      },
      async logout() {
        try {
          await api.logout();
        } catch {
          // token sudah tidak berlaku: tetap bersihkan lokal
        } finally {
          clear();
        }
      },
      async refresh() {
        const me = await api.me();
        setCustomerState(me);
        saveJSON("customer", me);
      },
      setCustomer(c) {
        setCustomerState(c);
        saveJSON("customer", c);
      },
      setOnboarded() {
        setOnboardedState(true);
        saveJSON("onboarded", true);
      },
      continueAsGuest() {
        setGuest(true);
        saveJSON("guest", true);
        setOnboardedState(true);
        saveJSON("onboarded", true);
      },
    }),
    [customer, ready, onboarded, guest, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth di luar AuthProvider");
  return v;
}
