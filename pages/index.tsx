import Head from "next/head";
import { FormEvent, useContext, useState } from "react";
import styles from "../styles/Home.module.css";
import { AuthContext } from "../contexts/AuthContext";
import { withSSRGuest } from "../utils/withSSRGuest";

export default function Home() {
  const [email, setEmail] = useState("contato@pedropaulo.dev");
  const [password, setPassword] = useState("123456");

  const { signIn } = useContext(AuthContext);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const data = { email, password };
    await signIn(data);
  }

  return (
    <>
      <Head>
        <title>Autenticação</title>
      </Head>
      <form onSubmit={handleSubmit} className="container">
        <div className={styles.headline}>
          <h1>Auth with next</h1>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Entrar
        </button>
      </form>
    </>
  );
}

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {},
  };
});
