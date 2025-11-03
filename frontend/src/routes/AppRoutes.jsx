import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import ListBuilder from '../pages/ListBuilder';
import PublicList from '../pages/PublicList';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import ProtectedRoute from '../components/Auth/ProtectedRoute';

function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/list/:id' element={<PublicList />} />

            <Route 
                path='/login' 
                element={
                    <ProtectedRoute requireAuth={false}>
                        <LoginForm />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path='/register' 
                element={
                    <ProtectedRoute requireAuth={false}>
                        <RegisterForm />
                    </ProtectedRoute>
                } 
            />

            <Route 
                path='/dashboard' 
                element={
                    <ProtectedRoute requireAuth={true}>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route 
                path='/builder' 
                element={
                    <ProtectedRoute requireAuth={true}>
                        <ListBuilder />
                    </ProtectedRoute>
                } 
            />
            <Route path='/builder/:id' 
            element={
                <ProtectedRoute requireAuth={true}>
                    <ListBuilder />
                </ProtectedRoute>
                } 
            />

            <Route path="/share/:token" element={<PublicList />} />
        </Routes>
    )
}

export default AppRoutes;