import { baseUrl } from "@/constants/constants";

export async function fetchMe(csrfToken: string) {
  const res = await fetch(`${baseUrl}/api/accounts/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-CSRFToken": csrfToken,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}