const API_BASE = "";
const TOKEN_KEY = "home_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const buildError = (message, status) => {
  const error = new Error(message || "请求失败");
  error.status = status;
  return error;
};

const request = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      throw buildError(data.message || "登录已失效，请重新登录", 401);
    }
    throw buildError(data.message || "请求失败", res.status);
  }
  return data;
};

export const login = (payload) =>
  request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const logout = () =>
  request("/api/admin/logout", {
    method: "POST",
  });

export const updatePassword = (payload) =>
  request("/api/admin/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const getSettings = () => request("/api/admin/settings");
export const updateSettings = (payload) =>
  request("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const getSiteLinks = () => request("/api/admin/site-links");
export const createSiteLink = (payload) =>
  request("/api/admin/site-links", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateSiteLink = (id, payload) =>
  request(`/api/admin/site-links/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
export const deleteSiteLink = (id) =>
  request(`/api/admin/site-links/${id}`, {
    method: "DELETE",
  });

export const getSocialLinks = () => request("/api/admin/social-links");
export const createSocialLink = (payload) =>
  request("/api/admin/social-links", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateSocialLink = (id, payload) =>
  request(`/api/admin/social-links/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
export const deleteSocialLink = (id) =>
  request(`/api/admin/social-links/${id}`, {
    method: "DELETE",
  });
