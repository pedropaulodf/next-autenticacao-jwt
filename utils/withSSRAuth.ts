import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import decode, { InvalidTokenError } from "jwt-decode";
import { validateUserPermissions } from "./validateUserPermissions";

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
};

// HIGH ORDER FUNCTION que direciona o usuário não logado para o login
export function withSSRAuth<P>(
  fn: GetServerSideProps<P>,
  options?: WithSSRAuthOptions
) {
  return async (
    ctx: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx);
    const token = cookies[process.env.NAME_JWT_TOKEN];

    // Se o usuário NÃO estiver logado, direciona ele para a tela de login
    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // Verifica se o refresh token/refreshtoken está válido no server
    try {
      if (options) {
        const user =
          decode<{ permissions: string[]; roles: string[] }>(token);

        const { permissions, roles } = options;
        const userHasValidPermission = validateUserPermissions({
          user,
          permissions,
          roles,
        });

        if (!userHasValidPermission) {
          return {
            redirect: {
              destination: "/dashboard",
              permanent: false,
            },
            // notFound: true
          };
        }
      }
      return await fn(ctx);
    } catch (error) {
      if (error instanceof AuthTokenError) {
        destroyCookie(ctx, process.env.NAME_JWT_TOKEN);
        destroyCookie(ctx, process.env.NAME_JWT_REFRESH_TOKEN);
        return {
          redirect: {
            destination: "/",
            permanent: false,
          },
        };
      }
      
      if (error instanceof InvalidTokenError) {
        destroyCookie(ctx, process.env.NAME_JWT_TOKEN);
        destroyCookie(ctx, process.env.NAME_JWT_REFRESH_TOKEN);
        return {
          redirect: {
            destination: "/",
            permanent: false,
          },
        };
      }
    }
  };
}
