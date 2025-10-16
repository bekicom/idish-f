import React, { memo } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = memo(() => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = Object.fromEntries(new FormData(e.target));

    try {
      const res = await axios.post(
        // "http://localhost:8080/api/users/login",
        // `https://kwmkqg1t-8081.euw.devtunnels.ms/api/users/login`,
        `https://idish25.richman.uz/api/users/login`,

        value
      );

      const token = res.data.token;
      const success = res.data.success;
      const role = res.data.role;
      const userLogin = res.data.login || value.login;

      // Сохраняем данные в localStorage
      localStorage.setItem("access_token", token);
      localStorage.setItem("acsess", JSON.stringify(success));
      localStorage.setItem("role", role);
      localStorage.setItem("user_login", userLogin);
      localStorage.setItem("_id", res.data._id);

      window.location.reload();
      // navigate("/");
      window.location.href = "/";
    } catch (error) {
      console.error("API xatosi:", error.response?.data || error.message);
    }
  };

  return (
    <div className="login">
      <form autoComplete="off" className="login-form" onSubmit={handleSubmit}>
        <label>
          <input
            type="text"
            placeholder="Login"
            autoComplete="off"
            name="login"
            required
          />
        </label>
        <label>
          <input
            type="password"
            placeholder="Password"
            name="password"
            required
          />
        </label>
        <label>
          <input type="submit" value="Kirish" />
        </label>
      </form>
    </div>
  );
});

export default Login;
