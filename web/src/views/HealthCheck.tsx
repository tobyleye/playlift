import { client } from "@/api/api";
import { Box } from "@chakra-ui/react";
import useSWR from "swr";

export default function HealthCheck() {
  const { data, error } = useSWR("/health", () =>
    client.get("/health").then((res) => res.data)
  );
  return (
    <Box py={"10vh"} display="flex" justifyContent="center">
      {error && <div>Error: {error.message}</div>}
      {data && <div>Response: {JSON.stringify(data)}</div>}
    </Box>
  );
}
