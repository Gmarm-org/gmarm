import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login/Login';
import Vendedor from './pages/Vendedor/Vendedor';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/vendedor" element={<Vendedor />} />
          {/* Future routes can be added here */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
