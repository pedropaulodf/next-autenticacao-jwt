import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";

let cookies = parseCookies();

let isRefreshing = false;
let failedRequestsQueue = [];

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    Authorization: `Bearer ${cookies["nextauth.token"]}`,
  },
});

// INTERCEPTA O RESPONSE DE TODAS AS REQUISIÇÕES
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response.status === 401) {
      if (error.response.data?.code === "token.expired") {
        // renovar o token
        cookies = parseCookies();

        const { "nextauth.refreshToken": refreshToken } = cookies;

        const originalConfig = error.config;

        if (!isRefreshing) {
          isRefreshing = true;

          api
            .post("/refresh", { refreshToken })
            .then((response) => {
              const { token: JWToken } = response.data;

              // SETA OS TOKENS NOS COOKIES
              setCookie(undefined, "nextauth.token", JWToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: "/", // Qualquer endereço do app vai ter acesso
              });
              setCookie(
                undefined,
                "nextauth.refreshToken",
                response.data.refreshToken,
                {
                  maxAge: 60 * 60 * 24 * 30, // 30 dias
                  path: "/", // Qualquer endereço do app vai ter acesso
                }
              );

              // ATUALIZA O HEADER COM O TOKEN RETORNADO
              api.defaults.headers["Authorization"] = `Bearer ${JWToken}`;

              // Executas a fila de requisições falhadas
              failedRequestsQueue.forEach((request) =>
                request.onSuccess(JWToken)
              );
              failedRequestsQueue = [];
            })
            .catch((err) => {
              // Executas a fila de requisições falhadas
              failedRequestsQueue.forEach((request) => request.onFailure(err));
              failedRequestsQueue = [];
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers["Authorization"] = `Bearer ${token}`;

              resolve(api(originalConfig));
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            },
          });

        });
      } else {
        //DESLOGAR O USUÁRIO
        signOut();
      }
    }

    return Promise.reject(error);

  }
);
