export default {
  // use location.host if in prod mode since server serves frontend
  SERVER_BASE_URL: import.meta.env.PROD
    ? window.location.origin
    : "http://localhost:8181",
};
