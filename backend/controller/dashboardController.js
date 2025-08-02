import Dashboard from "../model/Dashboard.js";

async function getDashboard(req, res) {
  try {
    const dashboard = await Dashboard.findOne({ id: req.params.id });
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
}

async function createOrUpdate(req, res) {
  try {
    const { name, widgets, theme } = req.body;
    
    const dashboard = await Dashboard.findOneAndUpdate(
      { id: req.params.id },
      { 
        id: req.params.id,
        name,
        widgets,
        theme,
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error saving dashboard:', error);
    res.status(500).json({ error: 'Failed to save dashboard' });
  }
}

async function listDashboards(req, res) {
  try {
    const dashboards = await Dashboard.find({})
      .select('id name createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    
    res.json(dashboards);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
}


async function deleteDashboard(req, res) {
  try {
    await Dashboard.deleteOne({ id: req.params.id });
    
    // Clean up sessions
    await Session.deleteMany({ dashboardId: req.params.id });
    
    // Notify connected users
    io.to(req.params.id).emit('dashboard-deleted');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
}


export { getDashboard, createOrUpdate, listDashboards, deleteDashboard }