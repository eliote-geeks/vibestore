import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const usePurchasedSounds = () => {
    const { token } = useAuth();
    const [purchasedSounds, setPurchasedSounds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            loadPurchasedSounds();
        } else {
            setPurchasedSounds([]);
        }
    }, [token]);

    const loadPurchasedSounds = async() => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/purchased-sounds', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setPurchasedSounds(data.sounds || []);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des sons achetés:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkIfPurchased = (soundId) => {
        return purchasedSounds.some(sound => sound.id === soundId);
    };

    const addPurchasedSound = (sound) => {
        setPurchasedSounds(prev => {
            if (!prev.find(s => s.id === sound.id)) {
                return [...prev, sound];
            }
            return prev;
        });
    };

    return {
        purchasedSounds,
        loading,
        checkIfPurchased,
        addPurchasedSound,
        reload: loadPurchasedSounds
    };
};