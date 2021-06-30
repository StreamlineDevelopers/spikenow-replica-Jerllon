import { useContext } from "react";
import { Button } from "react-bootstrap";
import { GoogleLogin, GoogleLogout } from "react-google-login";
import { useHistory } from "react-router";
import { BiLogOut } from "react-icons/bi";
import { UnauthorizedContext } from "./Routes";
import { AuthorizedUserContext } from "./AuthorizedRoutes";

export const Login = ({ text }) => {
  const history = useHistory();
  const socket = useContext(UnauthorizedContext);

  const handleLogin = async ({ code }) => {
    const res = await fetch("http://localhost:3001/google-auth", {
      method: "POST",
      body: JSON.stringify({
        code,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { token, email, full_name } = await res.json();
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("email", email);
    sessionStorage.setItem("full_name", full_name);
    if (token) {
      socket.auth = { email };
      socket.connect();
      history.push("/web/chat");
    }
  };
  return (
    <GoogleLogin
      clientId="886519749145-kjltr7kubuadpgpnli3lfh10bb9g0rn8.apps.googleusercontent.com"
      render={(renderProps) => (
        <button
          onClick={renderProps.onClick}
          disabled={renderProps.disabled}
          id="btn-spike"
        >
          {text}
        </button>
      )}
      onSuccess={handleLogin}
      onFailure={handleLogin}
      cookiePolicy={"single_host_origin"}
      accessType="offline"
      responseType="code"
      prompt="consent"
    />
  );
};

export const Logout = () => {
  const history = useHistory();
  const { socket } = useContext(AuthorizedUserContext);
  async function logout() {
    sessionStorage.clear();
    socket.disconnect();
    history.push("/");
    return;
  }
  return (
    <GoogleLogout
      clientId="886519749145-kjltr7kubuadpgpnli3lfh10bb9g0rn8.apps.googleusercontent.com"
      accessType="offline"
      onLogoutSuccess={logout}
      onFailure={logout}
      render={(renderProps) => (
        <Button
          onClick={renderProps.onClick}
          disabled={renderProps.disabled}
          variant="link"
        >
          <h4 className="m-0">
            <BiLogOut />
          </h4>
        </Button>
      )}
    />
  );
};
