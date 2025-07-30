import React, {useState, useContext} from 'react'
import { AuthContext } from '../context/authContext';
import axios from 'axios'


function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      login({ token: res.data.token, user: res.data.user });
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };


  return (
    <form onSubmit={submit}>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
}

export default Login