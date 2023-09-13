import { Dispatch } from "@reduxjs/toolkit";
import api from "../../api";
import { ILoginRequest, ILoginResponse } from "../../api/auth/types";
import {
  loginStart,
  loginSucess,
  loginFailure,
  logoutSuccess,
  loadProfileStart,
  loadProfileFailure,
  loadProfileSucess,
} from "./authReducer";
import { history } from "../../utils/history";
import { store } from "..";
import { AxiosPromise } from "axios";
import { isTokenExpired } from "../../utils/jwt";

export const loginUser =
  (data: ILoginRequest) =>
  async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      dispatch(loginStart()); //activate loader

      const res = await api.auth.login(data); //request /login

      console.log("RESULT REQUEST", res);

      dispatch(loginSucess(res.data.accessToken)); //add token to storage
      dispatch(getProfile()); //request /profile
    } catch (e: any) {
      console.error(e);

      dispatch(loginFailure(e.message)); //disable loading, add error to redux
    }
  };

export const logoutUser =
  () =>
  async (dispatch: Dispatch): Promise<void> => {
    try {
      await api.auth.logout();

      dispatch(logoutSuccess());

      console.log("HISTORY", history);

      history.push("/");
    } catch (e) {
      console.error(e);
    }
  };

export const getProfile =
  () =>
  async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      dispatch(loadProfileStart()); //set loader true

      const res = await api.auth.getProfile(); //get data from backend

      dispatch(loadProfileSucess(res.data)); //set data to redux
    } catch (e: any) {
      console.error(e);

      dispatch(loadProfileFailure(e.message));
    }
  };

// переменная для хранения запроса токена (для избежания race condition)
let refreshTokenRequest: AxiosPromise<ILoginResponse> | null = null;

export const getAccessToken =
  () =>
  async (dispatch: Dispatch<any>): Promise<string | null> => {
    try {
      const accessToken = store.getState().auth.authData.accessToken;

      if (!accessToken || isTokenExpired(accessToken)) {
        if (refreshTokenRequest === null) {
          refreshTokenRequest = api.auth.refreshToken();
        }

        const res = await refreshTokenRequest;
        refreshTokenRequest = null;

        dispatch(loginSucess(res.data.accessToken));

        return res.data.accessToken;
      }

      return accessToken;
    } catch (e) {
      console.error(e);

      return null;
    }
  };
