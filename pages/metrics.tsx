import Router from "next/router";
import { useEffect } from "react";
import { useCan } from "../hooks/useCan";
import { setupAPICLient } from "../services/api";
import { showToast } from "../utils/utils";
import { withSSRAuth } from "../utils/withSSRAuth";
export default function Metrics() {

  // const userCanSeeMetrics = useCan({
  //   permissions: ["metrics.list"],
  // });

  // useEffect(() => {
  //   if(!userCanSeeMetrics){
  //     showToast("error", "You dont have access to this page");
  //     Router.push('/dashboard');
  //   }
  // },[userCanSeeMetrics])

  return (
    <div className="container">
      <h1 style={{ textAlign: "center" }}>
        Your have permission to see the Metrics Page!
      </h1>
      <button onClick={() => Router.push("/dashboard")}>GO TO DASHBOARD</button>
    </div>
  );
}

export const getServerSideProps = withSSRAuth(
  async (ctx) => {
    const apiClient = setupAPICLient(ctx);
    const response = await apiClient.get("/me");
    // console.log(response);

    return {
      props: {},
    };
  },
  {
    permissions: ["metrics.list"],
    roles: ["administrator"],
  }
);
