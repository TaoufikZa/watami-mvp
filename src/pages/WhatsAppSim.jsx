import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Send, User, ChevronLeft, ExternalLink } from 'lucide-react';
import { mockBackend } from '../services/mockBackend';
import './WhatsAppSim.css';

const WhatsAppSim = () => {
    const location = useLocation();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);
    const processedTokens = useRef(new Set());

    // Initial Load and Listener for Merchant Messages
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const stored = await mockBackend.getWAMessages();
                setMessages(stored.length > 0 ? stored : [
                    { id: 1, text: "Watami Bot is active. Type 'watami' to start!", sender: 'bot' }
                ]);
            } catch (e) {
                console.error("Failed to load messages", e);
            }
        };

        loadMessages();

        // Poll for updates (since we can't listen to localStorage for cross-browser API changes easily without WS)
        const interval = setInterval(loadMessages, 3000);

        return () => clearInterval(interval);
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle initial redirect from checkout if message is in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const autoMsg = params.get('text');
        if (autoMsg && !processedTokens.current.has(autoMsg)) {
            processedTokens.current.add(autoMsg);
            handleSend(autoMsg, true); // Silent = don't show user bubble for technical token
            // Clear URL to prevent re-triggering on reload
            const newParams = new URLSearchParams(location.search);
            newParams.delete('text');
            const newSearch = newParams.toString();
            window.history.replaceState({}, '', `${location.pathname}${newSearch ? '?' + newSearch : ''}`);
        }
    }, [location.search]);

    const handleSend = async (text, isSilent = false) => {
        if (!text.trim()) return;

        if (!isSilent) {
            const userMsg = { id: Date.now(), text, sender: 'user', timestamp: new Date().toISOString() };
            await mockBackend.sendWAMessage(userMsg);
            const current = await mockBackend.getWAMessages();
            setMessages(current);
        }

        setInput('');

        // Bot Logic (Automated Replies)
        setTimeout(async () => {
            const lowerText = text.toLowerCase();
            let botReply = null;
            let cta = null;

            if (lowerText.includes('watami') || lowerText.includes('watame')) {
                botReply = "Welcome to Watami! 🍕 Looking for something to eat? Check out shops near you:";
                cta = { label: "Open Nearby Shops", link: "/nearby" };
            } else if (lowerText.includes('confirm_order_')) {
                const orderId = text.split('CONFIRM_ORDER_')[1]?.trim();
                try {
                    await mockBackend.simulateUserWhatsApp(orderId, "+212600000000");
                    botReply = `✅ Order #${orderId} has been confirmed! 🍕 It's being prepared.`;
                } catch (e) {
                    botReply = `❌ Error: ${e.message}`;
                }
            }

            if (botReply) {
                const replyMsg = {
                    id: Date.now() + 1,
                    text: botReply,
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    cta: cta
                };
                await mockBackend.sendWAMessage(replyMsg);
                const current = await mockBackend.getWAMessages();
                setMessages(current);
            }
        }, isSilent ? 100 : 800); // Faster reply if automated
    };



    return (
        <div className="wa-sim-container">
            <div className="wa-sim-info">
                DEV SIMULATOR: This simulates the WhatsApp Business Bot experience.
            </div>
            <header className="wa-sim-header">
                <Link to="/merchant" className="text-white"><ChevronLeft /></Link>
                <div className="wa-sim-avatar"><User size={24} /></div>
                <div>
                    <p className="font-bold">Watami Bot</p>
                    <p className="text-xs opacity-75">Online</p>
                </div>
            </header>

            <div className="wa-chat-area">
                {messages.map(msg => (
                    <div key={msg.id} className={`wa-bubble ${msg.sender}`}>
                        <div className="wa-bubble-text">{msg.text}</div>
                        {msg.cta && (
                            <div className="wa-cta-container">
                                <a
                                    href={msg.cta.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="wa-cta-button"
                                >
                                    <ExternalLink size={16} />
                                    {msg.cta.label}
                                </a>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form className="wa-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(input); }}>
                <input
                    type="text"
                    className="wa-input"
                    placeholder="Type a message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className="wa-send-btn">
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default WhatsAppSim;
