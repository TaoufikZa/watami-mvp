const EVOLUTION_API_URL = process.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.VITE_EVOLUTION_API_KEY || 'replace_with_your_api_key';
const INSTANCE_NAME = 'Watami';

class EvolutionApiService {
    async _send(endpoint, body) {
        const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Evolution API Error: ${err.message || response.statusText}`);
        }
        return response.json();
    }

    /**
     * Send a text message to a specific number
     * @param {string} number - The WhatsApp number (e.g., 212612345678)
     * @param {string} text - Message content
     */
    async sendText(number, text) {
        // Evolution API expects numbers in a specific format usually (e.g. 551199999999@s.whatsapp.net)
        // But some versions handle raw numbers. We'll follow the standard /message/sendText
        return this._send(`/message/sendText/${INSTANCE_NAME}`, {
            number: number,
            options: {
                delay: 1200,
                presence: 'composing',
                linkPreview: true
            },
            textMessage: {
                text: text
            }
        });
    }

    /**
     * Send a link message with preview
     */
    async sendLink(number, text, link) {
        return this.sendText(number, `${text}\n\n${link}`);
    }

    /**
     * Create an instance (for setup flow)
     */
    async createInstance() {
        return this._send('/instance/create', {
            instanceName: INSTANCE_NAME,
            token: EVOLUTION_API_KEY,
            qrcode: true
        });
    }
}

export const evolutionApi = new EvolutionApiService();
