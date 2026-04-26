import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // validar usuario...
    navigate("/home");
  };

  return <button onClick={handleLogin}>Ingresar</button>;
}

export default Login;