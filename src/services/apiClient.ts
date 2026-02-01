

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
    private getHeaders() {
        const token = localStorage.getItem('anyreps-auth-token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    private async handleResponse(response: Response) {
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'An error occurred';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        return response.json();
    }

    async get(endpoint: string) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async post(endpoint: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async put(endpoint: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async delete(endpoint: string) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    setToken(token: string) {
        localStorage.setItem('anyreps-auth-token', token);
    }

    logout() {
        localStorage.removeItem('anyreps-auth-token');
    }

    isLoggedIn() {
        return !!localStorage.getItem('anyreps-auth-token');
    }
}

export const api = new ApiClient();
