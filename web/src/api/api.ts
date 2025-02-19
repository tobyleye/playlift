import axios from "axios";
import config from "../config";

const client = axios.create({
  baseURL: config.SERVER_BASE_URL,
  withCredentials: true,
});

const api = {
  previewLink(link: string) {
    return client
      .get("/preview", {
        params: {
          link,
        },
      })
      .then((res) => res.data);
  },
  convert(link: string, destination: string) {
    return client
      .post("/convert", {
        link: link,
        to_platform: destination,
      })
      .then((res) => res.data);
  },

  fetchSingleConversion(id: string) {
    return client.get(`/conversions/${id}`).then((res) => res.data);
  },

  fetchConversions() {
    return client.get("/conversions").then((res) => res.data);
  },

  deleteConversion(id: string) {
    return client.delete(`/conversions/${id}`).then((res) => res.data);
  },
  restartConversion(id: string) {
    return client.post(`/conversions/${id}/restart`).then((res) => res.data);
  },
  getSpotifyPlaylists() {
    return client.get("/playlists/spotify").then((res) => res.data);
  },

  getYoutubePlaylists() {
    return client.get("/playlists/youtube").then((res) => res.data);
  },
  getUserSession: () => client.get("/user/session").then((res) => res.data),
};

export default api;
