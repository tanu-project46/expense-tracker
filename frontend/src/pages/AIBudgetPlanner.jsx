import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./AIBudgetPlanner.css";
function AIBudgetPlanner({budget, spent, remaining}){
    const user=JSON.parse(localStorage.getItem("user"));
    const userEmail=user?.email;

const [message, setMessage]=useState("");
// const [aiResponse, setAiResponse]=useState("");
const [loading, setLoading]=useState(false);
const [chatMessage, setChatMessage]=useState([]);

const handlesend= async()=>{
    
    if(!message.trim())
        return;
    try{
        setLoading(true);
        console.log("budget:",budget);
        console.log("spent:",spent);
        console.log("Remaining:",remaining);
        const response = await fetch("/api/ai-budget",{
            method:"POST",
            headers:{
                "content-type":"application/json",
            },
            body:JSON.stringify({
                message:message,
                budget:budget,
                spent:spent,
                remaining:remaining,
                remaining_days:8,
                user_email: user?.email
            }),
        });
        const data = await response.json();
        if(!response.ok){
            throw new Error(data.error || "AI Budget request failed");
        }
        console.log("AI Response:",data);
        setChatMessage((prev)=>[
            ...prev,
            {
                sender:"user",
                text:message
            },
            {
                sender:"ai",
                text:data.reply || "Sorry, I couldn't generate a response. Please try again."
            }
        ]);
        setMessage("");
    }catch(error){
        console.error("Ai Budget Error:",error);
        setChatMessage((prev)=>[
            ...prev,
            {
                sender:"ai",
                text:"Sorry, Something went wrong. Please try again later."
            }
        ]);
        setMessage("");
    } finally {
        setLoading(false);
    }
    
}
    return(
        <div className="ai-budget-page">
            <h1>AI Budget planner 🤖</h1>
            <p>Ask AI for help with your budget.</p>
            <button className="clear-chat-btn" onClick={() => setChatMessage([])}>
                Clear Chat
            </button>
        <div className="chat-box">
            <div className="ai-message">
                Hello! 👋 I'm your AI Budget planner.
                    How can I help you manage your money?
            </div>
            <div className="message-input">
             <input type="text" placeholder="Ask about your budget..." value={message}
             onChange={(e)=>
                setMessage(e.target.value)
             }
             onKeyDown={(e)=>{
                if (e.key=="Enter"){
                    handlesend();
                }
             }} />
             <button onClick={handlesend} disabled={loading}>{loading ? "Thinking...":"send"}</button>
            </div>
            {loading && (
                <div className="ai-message">
                    <div className="ai-avatar">🤖</div>
                    <div className="ai-message-content">
                        <div className="ai-name">AI Budget Planner:</div>
                        <div className="ai-response-text">
                            Thinking...
                        </div>
                    </div>
                </div>
            )}
            {chatMessage.map((chat, index)=>
            (
                chat.sender === "user"?(
                    <div key={index} className="user-message">
                        <strong>You:</strong>
                        {chat.text}
                    </div>
                ):(
                    <div key={index} className="ai-message">
                        <div className="ai-avatar">🤖</div>
                        <div className="ai-message-content">
                        <div className="ai-name">AI Budget Planner:</div>
                        <div className="ai-response-text">
                            <ReactMarkdown>{chat.text}</ReactMarkdown>
                        </div>
                    </div>
                    </div>
                )
            ))}
        </div>
        </div>
    )
}
export default AIBudgetPlanner;