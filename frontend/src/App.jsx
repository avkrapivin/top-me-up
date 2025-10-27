import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>  
      </Router>
    </ToastProvider>
  )
}

export default App;