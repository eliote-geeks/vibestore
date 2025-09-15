import Pusher from 'pusher-js';

class PusherService {
    constructor() {
        this.pusher = null;
        this.channel = null;
        this.isConnected = false;
    }

    initialize(competitionId, userConfig) {
        try {
            // Configuration Pusher (à remplacer par vos clés)
            this.pusher = new Pusher(
                import.meta.env.VITE_PUSHER_APP_KEY, {
                    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
                    encrypted: true,
                    authEndpoint: '/api/pusher/auth',
                    auth: {
                        headers: {
                            'Authorization': `Bearer ${userConfig.token}`
                        }
                    }
                });

            // Rejoindre le canal de compétition
            this.channel = this.pusher.subscribe(`competition.${competitionId}`);

            this.channel.bind('pusher:subscription_succeeded', () => {
                console.log('✅ Connecté au canal Pusher');
                this.isConnected = true;
            });

            return true;
        } catch (error) {
            console.error('❌ Erreur connexion Pusher:', error);
            return false;
        }
    }

    // Écouter les événements live
    onBroadcastingStarted(callback) {
        if (this.channel) {
            this.channel.bind('broadcasting-started', callback);
        }
    }

    onParticipantChanged(callback) {
        if (this.channel) {
            this.channel.bind('participant-changed', callback);
        }
    }

    onReactionAdded(callback) {
        if (this.channel) {
            this.channel.bind('reaction-added', callback);
        }
    }

    // Envoyer des événements
    sendReaction(data) {
        // Via API REST Laravel + broadcast
        return fetch('/api/competitions/react', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify(data)
        });
    }

    disconnect() {
        if (this.pusher) {
            this.pusher.disconnect();
            this.isConnected = false;
        }
    }
}

export default new PusherService();