import Router from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { destroyCookie, parseCookies, setCookie } from "nookies";

import { api } from "../../services/api";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  isAuthenticated: boolean;
  user: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

// Aqui eu seto o tipo das props que vão sair no value do Provider do Context
export const AuthContext = createContext({} as AuthContextData);

//DESLOGAR O USUÁRIO
export function signOut() {
  destroyCookie(undefined, "nextauth.token");
  destroyCookie(undefined, "nextauth.refreshToken");

  Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  // BUSCA AS ROLES E PERMISSIONS DO USUÁRIO TODA VEZ QUE ELE LOGAR
  useEffect(() => {
    const { "nextauth.token": JWToken } = parseCookies();

    if (JWToken) {
      api
        .get("/me")
        .then((response) => {
          const { email, permissions, roles } = response.data;

          setUser({ email, permissions, roles });
        })
        .catch(() => {
          //DESLOGAR O USUÁRIO
          signOut()
        });
    }
  }, []);

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post("/sessions", {
        email,
        password,
      });

      const {
        token: JWToken,
        refreshToken,
        permissions,
        roles,
      } = response.data;

      // sessionStorage
      // localStorage
      // cookies <-

      // SETA OS TOKENS NOS COOKIES
      setCookie(undefined, "nextauth.token", JWToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/", // Qualquer endereço do app vai ter acesso
      });
      setCookie(undefined, "nextauth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/", // Qualquer endereço do app vai ter acesso
      });

      setUser({ email, permissions, roles });

      // ATUALIZA O HEADER COM O TOKEN RETORNADO
      api.defaults.headers["Authorization"] = `Bearer ${JWToken}`;

      Router.push("/dashboard");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}
