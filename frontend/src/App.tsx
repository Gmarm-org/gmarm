import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import Vendedor from './pages/Vendedor/Vendedor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/vendedor" element={<Vendedor />} />
        {/* Future routes can be added here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
