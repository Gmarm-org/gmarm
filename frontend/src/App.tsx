import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Future routes can be added here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
