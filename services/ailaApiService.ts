const API_ENDPOINT_PRODUCTION = 'https://n8n.smcmais.com.br/webhook/72fc3fa1-3728-4665-b692-7a9a0fff601b';
const API_ENDPOINT_TEST = 'https://n8n.smcmais.com.br/webhook-test/72fc3fa1-3728-4665-b692-7a9a0fff601b';

export interface AILAResponse {
    audio: string; // base64 encoded audio
}

export interface AILAError {
    message: string;
    code?: string;
}

export type Environment = 'production' | 'test';

class AILAApiService {
    private currentEnvironment: Environment = 'production';

    /**
     * Set the current environment
     */
    setEnvironment(env: Environment) {
        this.currentEnvironment = env;
    }

    /**
     * Get the current environment
     */
    getEnvironment(): Environment {
        return this.currentEnvironment;
    }

    /**
     * Get the current API endpoint based on environment
     */
    private getEndpoint(): string {
        return this.currentEnvironment === 'production'
            ? API_ENDPOINT_PRODUCTION
            : API_ENDPOINT_TEST;
    }

    /**
     * Send audio to AILA and receive response
     */
    async sendAudioToAILA(audioBase64: string): Promise<string> {
        try {
            const endpoint = this.getEndpoint();
            console.log(`Sending audio to ${this.currentEnvironment} environment:`, endpoint);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio: audioBase64,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('API Error Response:', errorText);
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            // Get response text first to check if it's empty
            const responseText = await response.text();
            console.log('API Response length:', responseText.length);

            if (!responseText || responseText.trim() === '') {
                throw new Error('API returned empty response');
            }

            let data: AILAResponse;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse API response:', responseText.substring(0, 200));
                throw new Error('API returned invalid JSON response');
            }

            if (!data.audio) {
                console.error('API response missing audio field:', data);
                throw new Error('Invalid API response: missing audio field');
            }

            console.log('Audio response received, length:', data.audio.length);
            return data.audio;
        } catch (error) {
            console.error('Error sending audio to AILA:', error);

            if (error instanceof TypeError && error.message.includes('Network request failed')) {
                throw new Error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
            }

            throw error;
        }
    }

    /**
     * Check if API is reachable
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch(this.getEndpoint(), {
                method: 'HEAD',
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export default new AILAApiService();
