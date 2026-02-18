import { AuthProps } from "@/types/auth";
import { baseUrl } from "@/constants/constants";

/* =========================
   LOGOUT
========================= */

export const logout: AuthProps = async (
  csrfToken,
  setUser
) => {
  // Direct redirect to logout endpoint (GET request)
  window.location.href = `${baseUrl}/accounts/logout/`;
};