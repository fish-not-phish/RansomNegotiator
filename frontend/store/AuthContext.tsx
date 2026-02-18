"use client";

import React from "react";
import useCsrfToken from "@/hooks/useCsrfToken";
import { baseUrl } from "@/constants/constants";
import { UserStateData } from "@/types/userData";
import { Spinner } from "@/components/ui/spinner";
import { fetchMe } from "@/services/user";

type AuthContextProps = {
  user: UserStateData;
  setUser: React.Dispatch<React.SetStateAction<UserStateData>>;
};

export const AuthContext = React.createContext<AuthContextProps | null>(null);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<UserStateData>({
    csrfToken: "",
    isLoggedIn: null,
    isLoading: true,
    isAdmin: false,
  });

  const csrfToken = useCsrfToken(`${baseUrl}/api/accounts/csrf`);

  React.useEffect(() => {
    async function init() {
      // Wait for CSRF token on initial load
      if (!csrfToken) {
        return;
      }

      setUser((p) => ({ ...p, isLoading: true, csrfToken }));

      let isLoggedIn = false;
      let statusCheckFailed = false;

      try {
        const statusRes = await fetch(`${baseUrl}/api/accounts/status`, {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        });
        const status = await statusRes.json();
        isLoggedIn = !!status.isLoggedIn;
        setUser((p) => ({ ...p, isLoggedIn }));
      } catch (err) {
        console.error("Status check failed:", err);
        statusCheckFailed = true;
      }

      // If status check failed, try one more time after a delay
      if (statusCheckFailed) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const statusRes = await fetch(`${baseUrl}/api/accounts/status`, {
            method: "GET",
            credentials: "include",
            headers: {
              "X-CSRFToken": csrfToken,
            },
          });
          const status = await statusRes.json();
          isLoggedIn = !!status.isLoggedIn;
          setUser((p) => ({ ...p, isLoggedIn }));
        } catch (err) {
          console.error("Status check retry failed:", err);
        }
      }

      // Redirect to login if not logged in
      if (!isLoggedIn) {
        // Check if we're already on the login page to avoid loops
        if (!window.location.href.includes('/accounts/')) {
          window.location.href = `${baseUrl}/accounts/login/`;
        }
        return;
      }

      // Fetch user data
      try {
        const me = await fetchMe(csrfToken);
        setUser((p) => ({ ...p, ...me }));
      } catch (err) {
        console.error("Fetch me failed:", err);
      }

      setUser((p) => ({ ...p, isLoading: false }));
    }

    init();
  }, [csrfToken]);

  if (user.isLoading) {
    return (
      <div className="h-[100dvh] w-full flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthContextProvider");
  return ctx;
};