import { setupAPICLient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";
export default function Matrics() {
  
  return (
    <>
      <h1>Matrics</h1>
    </>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPICLient(ctx);
  const response = await apiClient.get("/me");
  // console.log(response);

  return {
    props: {},
  };
}, {
  permissions: ['metrics.list'],
  roles: ['administrator']
});
