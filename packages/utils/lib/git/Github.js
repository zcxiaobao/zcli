import { GitCommon } from "./GitCommon.js";
import axios from "axios";

const BASE_URL = "https://api.github.com";
class Github extends GitCommon {
  constructor() {
    super();
    this.service = axios.create({
      baseURL: BASE_URL,
      timeout: 5000,
    });

    this.service.interceptors.request.use(
      (config) => {
        config.headers["Authorization"] = `Bearer ${this.token}`;
        config.headers["Accept"] = "application/vnd.github+json";
        config.headers["X-GitHub-Api-Version"] = "2022-11-28";
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    this.service.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
  get(url, params, headers) {
    return this.service({
      url,
      params,
      method: "get",
      headers,
      // paramsSerializer(params) {
      //   return params;
      // },
    });
  }
  post(url, data, params, headers) {
    return this.service({
      url,
      data,
      params,
      method: "post",
      headers,
    });
  }
  getRepo(owner, repo, params) {
    return this.get(`/repos/${owner}/${repo}`, params).catch((err) => {
      return null;
    });
  }
  createRepo(data) {
    return this.post("/user/repos", data);
  }
  createOrgRepo(owner, data) {
    return this.post(`/orgs/${owner}/repos`, data);
  }
  getRepoUrl(fullName) {
    // return `https://github.com/${fullName}.git`;
    return `git@github.com:${fullName}.git`;
  }
  searchRepositories(params) {
    return this.get("/search/repositories", params);
  }
  searchCode(params) {
    return this.get("/search/code", params);
  }
  getTags(fullName, params) {
    return this.get(`/repos/${fullName}/tags`, params);
  }
  getUser(params) {
    return this.get(`/user`, params);
  }
  getOrgs(params) {
    return this.get(`/user/orgs`, params);
  }
}

export default Github;
