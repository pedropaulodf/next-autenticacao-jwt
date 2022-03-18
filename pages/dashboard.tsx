import { useContext, useEffect } from "react";
import { api } from "../services/api";
import { AuthContext } from "./contexts/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api
      .get("/me")
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
  }, []);

  return <h1>Dashboard: {user?.email} </h1>;
}
