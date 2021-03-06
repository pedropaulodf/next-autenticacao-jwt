import Router from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { api } from "../services/apiClient";
import { showToast } from "../utils/utils";

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
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

// Aqui eu seto o tipo das props que vão sair no value do Provider do Context
export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

//DESLOGAR O USUÁRIO
export function signOut() {
  destroyCookie(undefined, process.env.NAME_JWT_TOKEN);
  destroyCookie(undefined, process.env.NAME_JWT_REFRESH_TOKEN);

  authChannel.postMessage("signOut");

  Router.push("/");
  showToast("success","Logged out successfully");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");
    authChannel.onmessage = () => document.location.reload();
    // authChannel.onmessage = (message) => {
    //   console.log(message.data);
    //   switch (message.data) {
    //     case "signOut":
    //       signOut();]
    //       // authChannel.close();
    //       break;
    //     case "signIn":
    //       // Router.push('/dashboard');
    //       window.location.replace("http://localhost:3000/dashboard");
    //       break;
    //     default:
    //       break;
    //   }
    // };
  }, []);

  // BUSCA AS ROLES E PERMISSIONS DO USUÁRIO TODA VEZ QUE ELE LOGAR
  useEffect(() => {
    const { [process.env.NAME_JWT_TOKEN]: JWToken } = parseCookies();

    if (JWToken) {
      api
        .get("/me")
        .then((response) => {
          const { email, permissions, roles } = response.data;

          setUser({ email, permissions, roles });
        })
        .catch(() => {
          //DESLOGAR O USUÁRIO
          signOut();
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
      setCookie(undefined, process.env.NAME_JWT_TOKEN, JWToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/", // Qualquer endereço do app vai ter acesso
      });
      setCookie(undefined, process.env.NAME_JWT_REFRESH_TOKEN, refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/", // Qualquer endereço do app vai ter acesso
      });

      setUser({ email, permissions, roles });

      // ATUALIZA O HEADER COM O TOKEN RETORNADO
      api.defaults.headers["Authorization"] = `Bearer ${JWToken}`;

      Router.push("/dashboard");

      authChannel.postMessage("signIn");

      showToast("success","You are logged in!");
    } catch (err) {
      // console.log(err.response);
      showToast("error",`${err.response.data.message}`);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}
