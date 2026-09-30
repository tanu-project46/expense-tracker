import React, { useState} from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";


function Login(){

    const [name,setName]=useState("");
    const [email,setemail]=useState("");
    const [password,setPassword]=useState("");
    const [isRegister,setIsRegister]=useState(false);
    const navigate= useNavigate();

    const [message,setMessage]=useState("");
    const [messagecolor,setMessagecolor]=useState("black");


    async function handlelogin(event){
        event.preventDefault();

        if (isRegister && name.trim() === ""){
            setMessage("please enter your name");
            setMessagecolor("red");
            return;
        }

        if(email === ""){
           setMessage("please enter your email");
           setMessagecolor("red");
            return;
        }
        if(password === ""){
            setMessage("please enter password");
            setMessagecolor("red");
            return;
        }
        try{
            const endpoint = isRegister ? "/api/register" : "/api/login";
            const payload = isRegister
                ? { name, email, password }
                : { email, password };

            const response= await fetch(endpoint,{
                method:"POST",
                headers:{
                    "content-type":"application/json"
                },
                body:JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok){
                setMessage(data.error || "Authentication failed");
                setMessagecolor("red");
                return;
            }

            if (isRegister) {
                setMessage("Registration successful! Please sign in.");
                setMessagecolor("green");
                setIsRegister(false);
                setName("");
                setemail("");
                setPassword("");
                return;
            }

            setMessage("login successful!");
            setMessagecolor("green");

            localStorage.setItem("user",JSON.stringify(data.user));
            navigate("/dashboard");
        }catch (error){
           console.log("login error:",error);
           setMessage("could not connect to server");
           setMessagecolor("red");
        }
         
        
    }
    
        return(
                <div className="login-page">
                 <div className="login-container" >
                        <h1 className="main-heading">Expense Tracker</h1>
                        <h2>{isRegister ? "Create your account" : "Sign in to your account"}</h2>
                        <form onSubmit={handlelogin}>
                            {isRegister && (
                                <>
                                    <label className="visually-hidden">Full Name</label>
                                    <input type="text" placeholder="Full name"
                                        value={name}
                                        onChange={(event)=> setName(event.target.value)}
                                        aria-label="Full Name"
                                    />
                                </>
                            )}

                            <label className="visually-hidden">Email</label>
                            <input type="email" placeholder="Email address"
                                value={email}
                                onChange={(event)=> setemail(event.target.value)}
                                aria-label="Email"
                            />

                            <label className="visually-hidden">Password</label>
                            <input type="password" placeholder="Password"
                                value={password}
                                onChange={(event)=> setPassword(event.target.value)}
                                aria-label="Password"
                            />

                            <button type="submit">{isRegister ? "Create account" : "Sign in"}</button>
                            <button type="button" className="toggle-button" onClick={() => {
                                setIsRegister(!isRegister);
                                setMessage("");
                                setMessagecolor("black");
                            }}>
                                {isRegister ? "Already have an account? Sign in" : "Need an account? Sign up"}
                            </button>
                            <p style={{color:messagecolor}} className="message">{message}</p>
                        </form>
                </div>
                </div>
        );
}
export default Login;