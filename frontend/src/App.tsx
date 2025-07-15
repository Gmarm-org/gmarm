import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.text())
      .then(setMessage)
      .catch(() => setMessage("No se pudo conectar al backend"));
  }, []);

  return (
    <div className="App">
      <h1>Frontend en React</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
