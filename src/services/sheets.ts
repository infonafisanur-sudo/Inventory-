import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

let cachedAccessToken: string | null = null;
let googleUser: any = null;

export const sheetsService = {
  // Check if we already have an active session
  isConnected(): boolean {
    return cachedAccessToken !== null;
  },

  getConnectedUser() {
    return googleUser;
  },

  // Perform Google Sign-in to authorize Sheets access
  async connect(): Promise<{ accessToken: string; email: string | null }> {
    try {
      const provider = new GoogleAuthProvider();
      SCOPES.forEach(scope => provider.addScope(scope));
      
      // Force account selection to avoid automatic silent sign-in issues
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential?.accessToken) {
        throw new Error('No access token returned from Google authentication');
      }

      cachedAccessToken = credential.accessToken;
      googleUser = result.user;
      
      return {
        accessToken: cachedAccessToken,
        email: result.user.email
      };
    } catch (error) {
      console.error('Error connecting to Google Sheets:', error);
      throw error;
    }
  },

  disconnect() {
    cachedAccessToken = null;
    googleUser = null;
  },

  // Extract Spreadsheet ID from standard Google Sheets URLs
  extractSpreadsheetId(urlOrId: string): string {
    const trimmed = urlOrId.trim();
    if (!trimmed.includes('/') && trimmed.length > 10) {
      return trimmed;
    }
    
    // Pattern: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    throw new Error('Invalid Google Sheets URL or Spreadsheet ID');
  },

  // Create a new Spreadsheet in user's Google Drive
  async createSpreadsheet(title: string): Promise<{ id: string; url: string }> {
    if (!cachedAccessToken) {
      throw new Error('Google Sheets is not connected. Please authorize first.');
    }

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: title,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create spreadsheet: ${errText}`);
    }

    const data = await response.json();
    return {
      id: data.spreadsheetId,
      url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
    };
  },

  // Populate or update data in a Spreadsheet range
  async updateValues(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    if (!cachedAccessToken) {
      throw new Error('Google Sheets is not connected. Please authorize first.');
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values,
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to update spreadsheet cells: ${errText}`);
    }
  },

  // Retrieve values from a spreadsheet range
  async getValues(spreadsheetId: string, range: string): Promise<any[][]> {
    if (!cachedAccessToken) {
      throw new Error('Google Sheets is not connected. Please authorize first.');
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          'Authorization': `Bearer ${cachedAccessToken}`,
        }
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch spreadsheet cells: ${errText}`);
    }

    const data = await response.json();
    return data.values || [];
  }
};
