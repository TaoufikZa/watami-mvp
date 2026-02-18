import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockBackend } from '../services/mockBackend';
import { useStore } from '../store/useStore';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';
import './Discovery.css';

const CATEGORIES = ['All', 'Food', 'Grocery', 'Pharmacy', 'Bakery'];

const Discovery = () => {
    const navigate = useNavigate();
    const location = useStore((state) => state.location);
    const setLocation = useStore((state) => state.setLocation);

    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [requestingLocation, setRequestingLocation] = useState(false);

    const fetchMerchants = async (coords) => {
        setLoading(true);
        const data = await mockBackend.getNearbyMerchants(coords.lat, coords.lng);
        setMerchants(data);
        setLoading(false);
    };

    useEffect(() => {
        if (location) {
            fetchMerchants(location);
        }
    }, [location]);

    const handleDetectLocation = () => {
        setRequestingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLoc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        address: 'Current Location'
                    };
                    setLocation(newLoc);
                    setRequestingLocation(false);
                },
                (error) => {
                    console.error(error);
                    // Fallback to manual or default Casablanca
                    setLocation({ lat: 33.5731, lng: -7.5898, address: 'Casablanca, Morocco' });
                    setRequestingLocation(false);
                }
            );
        } else {
            setLocation({ lat: 33.5731, lng: -7.5898, address: 'Casablanca, Morocco' });
            setRequestingLocation(false);
        }
    };

    return (
        <div className="discovery-page">
            <header className="discovery-header">
                <h1>Watami</h1>
                {location ? (
                    <div className="location-bar">
                        <MapPin size={16} />
                        <span>{location.address}</span>
                    </div>
                ) : (
                    <p className="text-muted">Find merchants near you</p>
                )}
            </header>

            {!location && (
                <div className="location-prompt">
                    <Navigation className="text-primary mb-4" size={48} style={{ margin: '0 auto' }} />
                    <h3>See what's nearby</h3>
                    <p>Allow access to your location to find the best shops around you.</p>
                    <button
                        className="btn btn-primary btn-full"
                        onClick={handleDetectLocation}
                        disabled={requestingLocation}
                    >
                        {requestingLocation ? <Loader2 className="animate-spin" size={20} /> : 'Detect my location'}
                    </button>
                    <button
                        className="btn btn-full mt-2"
                        onClick={() => setLocation({ lat: 33.5731, lng: -7.5898, address: 'Casablanca, Morocco' })}
                        style={{ color: 'var(--color-primary)' }}
                    >
                        Set location manually
                    </button>
                </div>
            )}

            {location && (
                <>
                    <section className="search-section">
                        <div className="categories">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="merchant-grid">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : merchants.length > 0 ? (
                            merchants.map(merchant => (
                                <div
                                    key={merchant.id}
                                    className="merchant-card"
                                    onClick={() => navigate(`/m/${merchant.slug}`)}
                                >
                                    <img src={merchant.image} alt={merchant.name} className="merchant-card-image" />
                                    <div className="merchant-card-content">
                                        <h2 className="merchant-card-name">{merchant.name}</h2>
                                        <div className="merchant-card-meta">
                                            <span>{merchant.distance} km away</span>
                                            <span>🟢 Open</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center p-8 text-muted">No merchants found in this area.</p>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default Discovery;
