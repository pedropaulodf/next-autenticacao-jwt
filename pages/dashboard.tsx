import Router from "next/router";
import { useContext, useEffect } from "react";
import { Can } from "../components/Can";
import { AuthContext } from "../contexts/AuthContext";
import { useCan } from "../hooks/useCan";
import { setupAPICLient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { user, signOut } = useContext(AuthContext);

  // const userCanSeeMetrics = useCan({
  //   permissions: ["metrics.list"],
  // });

  useEffect(() => {
    api
      .get("/me")
      .then((response) => console.log("Response:",response))
      .catch((err) => console.log("Error:",err));
  }, []);

  return (
    <div className="container">
      <div>
        <h1>Dashboard</h1>
        <h2>User: {user?.email} </h2>

        <button onClick={signOut} style={{backgroundColor: "#ff6b6b"}}>Sign Out ➡️</button>

        {/* {userCanSeeMetrics && <div>Metrics</div>} */}
        <Can permissions={['metrics.list']}>
          <div style={{margin: "20px 0", padding: "4px 8px", border: "1px solid green", color: "green", borderRadius: "50px", textAlign: "center"}}>This user is allowed to see the Metrics!</div>
          
          <button onClick={() => Router.push('/metrics')}>GO TO METRICS</button>
        </Can>
      </div>
    </div>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPICLient(ctx);
  const response = await apiClient.get("/me");
  // console.log(response);

  return {
    props: {},
  };
});
