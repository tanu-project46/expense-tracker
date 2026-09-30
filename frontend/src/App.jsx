import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import Navbar from "./components/Navbar";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";

function App(){
  return(
    // <div>
    //   <Navbar />
    //   <Login/>
    // </div>

    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<Login />}/>
      <Route path="/dashboard" element={<Dashboard />}/>
      <Route path="/Dashboard" element={<Navigate replace to="/dashboard" />}/>
    </Routes>
    </BrowserRouter>
  );
}
export default App;