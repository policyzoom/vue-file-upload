import Vue from 'vue';
import { getInstance } from "./authWrapper";

export const authGuard = (to, from, next) => {
  const authService = getInstance();
  const fn = () => {
    if (authService.isAuthenticated || Vue.$cookies.get("token")) {
      return next();
    }

    authService.loginWithRedirect({ appState: { targetUrl: to.fullPath } });
  };

  if (!authService.loading) {
    return fn();
  }

  authService.$watch("loading", loading => {
    if (loading === false) {
      return fn();
    }
  });
};
