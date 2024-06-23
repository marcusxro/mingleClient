import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import System from './pages/System';
import ViewedPost from './pages/ViewedPost';
import UrProfile from './pages/UrProfile';
import Homepage from './pages/Homepage';
import SearchUser from './pages/SearchUser';
import SearchedPost from './pages/SearchedPost';
import SearchedUserShow from './pages/SearchedUserShow';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
        <Route path='/' element={<Homepage />} />
          <Route path='/SignIn' element={<Login />} />
          <Route path='/Register' element={<Register />} />
          <Route path='/feed' element={<System />} />
          <Route path='/post/:ID' element={<ViewedPost />} />
          <Route path='/profile/' element={<UrProfile />} />
          <Route path='/Search' element={<SearchUser />} />
          <Route path='/SearchedPost/:postID' element={<SearchedPost />} />
          <Route path='/SearchedUser/:userUID' element={<SearchedUserShow />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
