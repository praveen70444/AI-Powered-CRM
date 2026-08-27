const calendarService = require("../services/calendarService");

const getEvents = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { start, end } = req.query;
    const events = await calendarService.getEvents(organizationId, userId, { start, end });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to fetch events" });
  }
};

const createEvent = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const event = await calendarService.createEvent(organizationId, userId, req.body);
    res.status(201).json({ success: true, data: event, message: "Event created successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to create event" });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const event = await calendarService.updateEvent(req.params.id, organizationId, req.body);
    res.json({ success: true, data: event, message: "Event updated successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to update event" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { organizationId } = req.user;
    await calendarService.deleteEvent(req.params.id, organizationId);
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to delete event" });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
