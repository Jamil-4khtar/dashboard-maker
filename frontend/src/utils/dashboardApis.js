export const dashboardAPI = {
  async getDashboard(id) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard');
    }
    return response.json();
  },

  async saveDashboard(id, data) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${id}`, {                     
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to save dashboard');
    }
    return response.json();
  },

  async getDashboards() {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/list`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboards');
    }
    return response.json();
  },

  async deleteDashboard(id) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete dashboard');
    }
    return response.json();
  }
};