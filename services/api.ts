import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { checkIsBrowser } from "../utils/utils";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false;
let failedRequestsQueue = [];

export function setupAPICLient(ctx = undefined) {
  
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies[process.env.NAME_JWT_TOKEN]}`,
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
          cookies = parseCookies(ctx);

          const { [process.env.NAME_JWT_REFRESH_TOKEN]: refreshToken } = cookies;

          const originalConfig = error.config;

          if (!isRefreshing) {
            isRefreshing = true;

            api
              .post("/refresh", { refreshToken })
              .then((response) => {
                const { token: JWToken } = response.data;

                // SETA OS TOKENS NOS COOKIES
                setCookie(ctx, process.env.NAME_JWT_TOKEN, JWToken, {
                  maxAge: 60 * 60 * 24 * 30, // 30 dias
                  path: "/", // Qualquer endereço do app vai ter acesso
                });
                setCookie(
                  ctx,
                  process.env.NAME_JWT_REFRESH_TOKEN,
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
                failedRequestsQueue.forEach((request) =>
                  request.onFailure(err)
                );
                failedRequestsQueue = [];

                // Maneira antiga de checar
                // if(process.browser){}

                if (checkIsBrowser()) {
                  //DESLOGAR O USUÁRIO
                  signOut();
                }
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
          // Verifica se está no browser ou não
          if (checkIsBrowser()) {
            //DESLOGAR O USUÁRIO
            signOut();
          } else {
            return Promise.reject(new AuthTokenError());
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
}
